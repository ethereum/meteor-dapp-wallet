
/**
Add new in/outgoing transaction

@method addTransaction
@param {Object} log
@param {String} from
@param {String} to
@param {String} value
@return {Boolean} TRUE if a transaction already existed
*/
addTransaction = function(log, from, to, value){
    var txId = Helpers.makeId('tx', log.transactionHash);

    var block = web3.eth.getBlock(log.blockNumber, false, function(err, block){
        if(!err) {

            web3.eth.getTransaction(log.transactionHash, function(err, transaction) {
                if(!err) {
                    web3.eth.getTransactionReceipt(log.transactionHash, function(err, receipt){

                        delete transaction.hash;
                        transaction.transactionHash = log.transactionHash;

                        var tx = {
                            _id: txId,
                            to: to,
                            from: from,
                            value: value,
                            timestamp: block.timestamp,
                        };

                        if(log.tokenId)
                            tx.tokenId = log.tokenId;

                        if(log.args.operation)
                            tx.operation = log.args.operation;

                        if(!err) {
                            updateTransaction(tx, transaction, receipt);

                        }
                    });
                }
            });
        }
    });

    return Transactions.findOne(txId);
};

/**
Updates a transaction.

@method updateTransaction
@param {Object} newDocument     The transaction object from our database
@param {Object} transaction     The transaction object from getTransaction
@param {Object} receipt     The transaction object from getTransactionReceipt
@return {Object} The updated transaction
*/
var updateTransaction = function(newDocument, transaction, receipt){
    var id = newDocument._id || Helpers.makeId('tx', transaction.transactionHash || newDocument.transactionHash);

    // if transaction has no transactionId, stop
    if(!id)
        return;

    newDocument._id = id;

    if(transaction) {
        newDocument.blockNumber = transaction.blockNumber;
        newDocument.blockHash = transaction.blockHash;
        newDocument.transactionIndex = transaction.transactionIndex;
        if(transaction.transactionHash)
            newDocument.transactionHash = transaction.transactionHash;

        newDocument.data = transaction.input || transaction.data || null;
        if(_.isString(newDocument.data) && newDocument.data === '0x')
            newDocument.data = null;

        newDocument.gasPrice = transaction.gasPrice.toString(10);
    }

    if(receipt && transaction) {
        newDocument.contractAddress = receipt.contractAddress;
        newDocument.gasUsed = receipt.gasUsed;
        newDocument.fee = transaction.gasPrice.times(new BigNumber(receipt.gasUsed)).toString(10);

        // check for code on the address
        if(receipt.contractAddress) {
            web3.eth.getCode(receipt.contractAddress, function(e, code) {
                if(!e && code.length > 2) {
                    Transactions.update({_id: id}, {$set: {
                        deployedData: code
                    }});
                }
            })
        }
    }

    if(oldTx = Transactions.findOne({_id: id})) {

        // prevent wallet events overwriding token transfer events
        if(oldTx.tokenId && !newDocument.tokenId) {
            newDocument.tokenId = oldTx.tokenId;
            newDocument.from = oldTx.from;
            newDocument.to = oldTx.to;
            newDocument.value = oldTx.value;
        }

        delete newDocument._id;
        Transactions.update({_id: id}, {$set: newDocument});
    } else {
        Transactions.insert(newDocument);
    }
};


/**
Observe transactions and pending confirmations

@method observeTransactions
*/
observeTransactions = function(){


    /**
    Checking for confirmations of transactions.

    @method checkTransactionConfirmations
    @param {Object} newDocument
    @param {Object} oldDocument
    */
    var checkTransactionConfirmations = function(tx){
        var confCount = 0;

        // check for confirmations
        if(!tx.confirmed) {
            var filter = web3.eth.filter('latest');
            filter.watch(function(e, blockHash){
                if(!e) {
                    var confirmations = (tx.blockNumber && EthBlocks.latest.number) ? (EthBlocks.latest.number + 1) - tx.blockNumber : 0;
                    confCount++;

                    // get the latest tx data
                    tx = Transactions.findOne(tx._id);

                    // stop if tx was removed
                    if(!tx) {
                        filter.stopWatching();
                        return;
                    }


                    if(confirmations < ethereumConfig.requiredConfirmations && confirmations >= 0) {
                        Helpers.eventLogs('Checking transaction '+ tx.transactionHash +'. Current confirmations: '+ confirmations);


                        // Check if the tx still exists, if not disable the tx
                        web3.eth.getTransaction(tx.transactionHash, function(e, transaction){
                            web3.eth.getTransactionReceipt(tx.transactionHash, function(e, receipt){
                                if(e || !receipt || !transaction) return;

                                // update with receipt
                                if(transaction.blockNumber !== tx.blockNumber)
                                    updateTransaction(tx, transaction, receipt);

                                // enable transaction, if it was disabled
                                else if(transaction.blockNumber && tx.disabled)
                                    Transactions.update(tx._id, {$unset:{
                                        disabled: ''
                                    }});

                                // disable transaction if gone (wait for it to come back)
                                else if(!transaction.blockNumber) {
                                    Transactions.update(tx._id, {$set:{
                                        disabled: true
                                    }});
                                }
                            });
                        });

                    }

                    if(confirmations > ethereumConfig.requiredConfirmations || confCount > ethereumConfig.requiredConfirmations*2) {

                        // confirm after a last check
                        web3.eth.getTransaction(tx.transactionHash, function(e, transaction){
                            web3.eth.getTransactionReceipt(tx.transactionHash, function(e, receipt){
                                if(!e) {

                                    // if still not mined, remove tx
                                    if(!transaction || !transaction.blockNumber) {
                                        Transactions.remove(tx._id);
                                        filter.stopWatching();

                                    } else if(transaction.blockNumber) {


                                        // check if parent block changed
                                        // TODO remove if later tx.blockNumber can be null again
                                        web3.eth.getBlock(transaction.blockNumber, function(e, block) {
                                            if(!e) {

                                                if(block.hash === transaction.blockHash) {
                                                    tx.confirmed = true;
                                                    updateTransaction(tx, transaction, receipt);

                                                    // remove disabled
                                                    if(tx.disabled)
                                                        Transactions.update(tx._id, {$unset:{
                                                            disabled: ''
                                                        }});

                                                // remove if the parent block is not in the chain anymore.
                                                } else {
                                                    Transactions.remove(tx._id);
                                                }

                                                filter.stopWatching();
                                            }
                                        });

                                    }
                                }
                            });
                        });
                    }
                }
            });
        }
    };

    /**
    Observe transactions, listen for new created transactions.

    @class Transactions({}).observe
    @constructor
    */
    collectionObservers[collectionObservers.length] = Transactions.find({}).observe({
        /**
        This will observe the transactions creation and create watchers for outgoing transactions, to see when they are mined.

        @method added
        */
        added: function(newDocument) {
            var confirmations = EthBlocks.latest.number - newDocument.blockNumber;

            // add to accounts
            Wallets.update({address: newDocument.from}, {$addToSet: {
                transactions: newDocument._id
            }});
            Wallets.update({address: newDocument.to}, {$addToSet: {
                transactions: newDocument._id
            }});

            // remove pending confirmations, if present
            if(newDocument.operation) {
                var confirmationId = Helpers.makeId('pc', newDocument.operation);
                PendingConfirmations.remove(confirmationId);
            }


            // check first if the transaction was already mined
            if(!newDocument.confirmed) {
                checkTransactionConfirmations(newDocument);
            }
        },
        /**
        Will check if the transaction is confirmed 

        @method changed
        */
        changed: function(newDocument){
            // add to accounts
            Wallets.update({address: newDocument.from}, {$addToSet: {
                transactions: newDocument._id
            }});
            Wallets.update({address: newDocument.to}, {$addToSet: {
                transactions: newDocument._id
            }});
        },
        /**
        Remove transactions confirmations from the accounts

        @method removed
        */
        removed: function(document) {
            Wallets.update({address: document.from}, {$pull: {
                transactions: document._id
            }});
            Wallets.update({address: document.to}, {$pull: {
                transactions: document._id
            }});
            EthAccounts.update({address: document.from}, {$pull: {
                transactions: document._id
            }});
            EthAccounts.update({address: document.to}, {$pull: {
                transactions: document._id
            }});
        }
    });

};