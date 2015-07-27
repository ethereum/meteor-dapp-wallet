
/**
Add new in/outgoing transaction

@method addTransaction
@param {Object} log
@param {String} from
@param {String} to
@param {String} value
*/
addTransaction = function(log, from, to, value){
    var block = web3.eth.getBlock(log.blockNumber, true, function(err, block){
        if(!err) {
            var txId = Helpers.makeId('tx', log.transactionHash),
                transaction = _.find(block.transactions, function(tx){ return tx.hash === log.transactionHash; });

            web3.eth.getTransactionReceipt(log.transactionHash, function(err, receipt){
                if(!err) {
                    Transactions.upsert({_id: txId}, {
                        operation: log.args.operation || null,
                        value: value,
                        to: to,
                        from: from,
                        timestamp: block.timestamp,
                        blockNumber: log.blockNumber,
                        blockHash: log.blockHash,
                        transactionHash: log.transactionHash,
                        transactionIndex: log.transactionIndex,
                        fee: transaction.gasPrice.times(new BigNumber(receipt.gasUsed)).toString(10)
                    });
                }
            });

            // update balance
            web3.eth.getBalance(log.address, function(err, res){
                Wallets.update({address: log.address}, {$set: {
                    balance: res.toString(10)
                }});
            });
        }
    });
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
        // check for confirmations
        if(!tx.confirmed) {
            var filter = web3.eth.filter('latest');
            filter.watch(function(e, blockHash){
                if(!e) {
                    var confirmations = (tx.blockNumber) ? EthBlocks.latest.number - tx.blockNumber : 0;

                    if(confirmations < ethereumConfig.requiredConfirmations && confirmations > 0) {
                        Helpers.eventLogs('Checking transaction '+ tx.transactionHash +'. Current confirmations: '+ confirmations);

                        // Check if the tx still exists, if not remove the tx
                        web3.eth.getTransaction(tx.transactionHash, function(e, transaction){
                            web3.eth.getTransactionReceipt(tx.transactionHash, function(e, receipt){
                                if(!e)
                                    return;

                                if(transaction && transaction.blockNumber)
                                    updateTransaction(tx, transaction, receipt);

                                // delete transacrion if gone
                                else if(!transaction.blockNumber) {
                                    // TODO: better check for removed transactions, e.g. check for block number if this block then still matches the block hash
                                    //  really remove?
                                    Transactions.remove(tx._id);
                                    filter.stopWatching();
                                }
                            });
                        });

                    } else if(confirmations > ethereumConfig.requiredConfirmations) {
                        Transactions.update(tx._id, {$set: {confirmed: true}});
                        filter.stopWatching();
                    }
                }
            });
        }
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

        newDocument.blockNumber = transaction.blockNumber;
        newDocument.blockHash = transaction.blockHash;
        newDocument.transactionIndex = transaction.transactionIndex;
        newDocument.fee = transaction.gasPrice.times(new BigNumber(receipt.gasUsed)).toString(10);

        Transactions.update(newDocument._id, newDocument);

        return newDocument;
    };

    /**
    Observe transactions, listen for new created transactions.

    @class Transactions({}).observe
    @constructor
    */
    Transactions.find({}).observe({
        /**
        This will observe the transactions creation and create watchers for outgoing trandsactions, to see when they are mined.

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
                web3.eth.getTransaction(newDocument.transactionHash, function(e, transaction){
                    web3.eth.getTransactionReceipt(newDocument.transactionHash, function(e, receipt){
                        if(!e && receipt)
                            updateTransaction(newDocument, transaction, receipt);
                    });
                });
                checkTransactionConfirmations(newDocument, {});
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
        }
    });

};