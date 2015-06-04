
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
                fee: transaction.gasPrice.times(new BigNumber(transaction.gas)).toString(10)
            });

            // update balance
            web3.eth.getBalance(log.address, function(err, res){
                Accounts.update({address: log.address}, {$set: {
                    balance: res.toString(10)
                }});
            });
        }
    });
};


/**
Observe transactions and pending confirmations

@method observeAccounts
*/
observeTransactions = function(){


    /**
    Checking for confirmations of transactions.

    @method checkTransactionConfirmations
    @param {Object} newDocument
    @param {Object} oldDocument
    */
    var checkTransactionConfirmations = function(newDocument, oldDocument){
        // Tracker.afterFlush(function(){

            var confirmations = LastBlock.findOne('latest').blockNumber - newDocument.blockNumber;

            // check for confirmations
            if(!oldDocument.blockNumber && newDocument.blockNumber && confirmations < ethereumConfig.requiredConfirmations) {
                var filter = web3.eth.filter('latest');
                filter.watch(function(e, blockHash){
                    if(!e) {
                        var confirmations = LastBlock.findOne('latest').blockNumber - newDocument.blockNumber;

                        if(confirmations < ethereumConfig.requiredConfirmations && confirmations > 0) {
                            Helpers.eventLogs('Checking transaction '+ newDocument.transactionHash +'. Current confirmations: '+ confirmations);

                            // Check if the tx still exists, if not remove the tx
                            web3.eth.getTransaction(newDocument.transactionHash, function(e, tx){
                                if(tx && tx.blockNumber)
                                    newDocument = updateTransaction(newDocument, tx);
                                else if(!tx) {
                                    Transactions.remove(newDocument._id);
                                    filter.stopWatching();
                                }
                            });
                        } else if(confirmations > ethereumConfig.requiredConfirmations) {
                            filter.stopWatching();
                        }
                    }
                });
            }
        // });
    };

    /**
    Updates a transaction.

    @method updateTransaction
    @param {Object} newDocument     The transaction object from our database
    @param {Object} transaction     The transaction object from getTransaction
    @return {Object} The updated transaction
    */
    var updateTransaction = function(newDocument, transaction){

        newDocument.blockNumber = transaction.blockNumber;
        newDocument.blockHash = transaction.blockHash;
        newDocument.transactionIndex = transaction.transactionIndex;
        newDocument.fee = transaction.gasPrice.times(new BigNumber(transaction.gas)).toString(10);

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
            var confirmations = LastBlock.findOne('latest').blockNumber - newDocument.blockNumber;

            // add to accounts
            Accounts.update({address: newDocument.from}, {$addToSet: {
                transactions: newDocument._id
            }});
            Accounts.update({address: newDocument.to}, {$addToSet: {
                transactions: newDocument._id
            }});

            // remove pending confirmations, if present
            if(newDocument.operation) {
                var confirmationId = Helpers.makeId('pc', newDocument.operation);
                PendingConfirmations.remove(confirmationId);
            }


            // check first if the transaction was already mined
            if(!newDocument.blockHash || confirmations < ethereumConfig.requiredConfirmations) {
                web3.eth.getTransaction(newDocument.transactionHash, function(e, tx){
                    if(tx && tx.blockNumber) {
                        newDocument = updateTransaction(newDocument, tx);

                        checkTransactionConfirmations(newDocument, {});
                    }
                });
            }
        },
        /**
        Will check if the transaction is confirmed 

        @method changed
        */
        changed: checkTransactionConfirmations,
        /**
        Remove transactions confirmations from the accounts

        @method removed
        */
        removed: function(document) {
            Accounts.update({address: document.from}, {$pull: {
                transactions: document._id
            }});
            Accounts.update({address: document.to}, {$pull: {
                transactions: document._id
            }});
        }
    });

};