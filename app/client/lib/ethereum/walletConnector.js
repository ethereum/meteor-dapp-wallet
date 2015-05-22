
/**
The walletConnector

@class walletConnector
@constructor
*/

/**
Contains all wallet contracts

@property contracts
*/
contracts = {};

/**
Number of blocks to rollback, from the last stable point.

@property rollBackBy
*/
rollBackBy = 10000;


/**
Connects to a node and setup all the filters for the accounts.

@method connectNode
*/
connectNode = function(){

    console.log('Connect to node...');

    // set providor
    web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545")); //8545 8080 10.10.42.116

    // UPDATE latest BLOCKCHAIN DATA (SYNC!)
    Blockchain.update(blockchainId, {$set: {
        blockNumber: web3.eth.blockNumber,
        gasPrice: web3.eth.gasPrice.toString(10),
        blockHash: web3.eth.getBlock('latest').hash
    }});

    // GET the latest blockchain information
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {
            var block = web3.eth.getBlock(res, function(e, block){
                var oldBlock = Blockchain.findOne();
                // console.log('BLOCK', block.number);

                // CHECK for FORK
                if(oldBlock.blockNumber+1 === block.number && oldBlock.blockHash !== block.parentHash) {
                    console.log('FORK detected from Block #'+ oldBlock.blockNumber + ' -> #'+ block.number +', rolling back!');
                    _.each(Accounts.find({type: 'wallet'}).fetch(), function(account){
                        contractFilters(account);
                    });
                }
                
                Blockchain.update(blockchainId, {$set: {
                    blockNumber: block.number,
                    blockHash: block.hash,
                    checkpoint: block.number // TODO set checkoints more smartly
                }});

                // update the current gas price
                web3.eth.getGasPrice(function(e, res){
                    if(!e)
                        Blockchain.update(blockchainId, {$set: {
                            gasPrice: res.toString(10)
                        }});
                });

                // update simple accounts balance
                _.each(Accounts.find({type: 'account'}).fetch(), function(account){
                    web3.eth.getBalance(account.address, function(err, res){
                        Accounts.update(account._id, {$set: {
                            balance: res.toString(10)
                        }});
                    });
                });
            });
        }
    });


    // ADD normal accounts
    _.each(web3.eth.accounts, function(item){
        if(!_.contains(_.pluck(Accounts.find().fetch(), 'address'), item))
            Accounts.insert({
                type: 'account',
                address: item,
                balance: '0',
                name: (item === web3.eth.coinbase) ? 'Coinbase' : item
            });
    });

    /**
    Update checkpoint by comparing the logs blocknumber with the current checkpoint

    */


    /**
    Add new in/outgoing transaction

    @method addTransaction
    @param {Object} log
    @param {String} from
    @param {String} to
    @param {String} value
    */
    var addTransaction = function(log, from, to, value){
        var block = web3.eth.getBlock(log.blockNumber, true, function(err, block){

            if(!err) {
                var txId = Helpers.makeId('tx', log.transactionHash),
                    transaction = _.find(block.transactions, function(tx){ return tx.hash === log.transactionHash; }),
                    tx = Transactions.findOne(txId);

                // add transaction
                if(!tx) {
                    Transactions.insert({
                        _id: txId,
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


                // update the operation, if
                } else if(log.args.operation) {
                    Transactions.update(txId, {$set: {
                        operation: log.args.operation
                    }});
                }


                // remove pending confirmation, if still present
                var account = Accounts.findOne({address: log.address});
                if(account) {
                    _.each(PendingConfirmations.find({_id: {$in: account.pendingConfirmations || []}, operation: log.args.operation}).fetch(), function(pendingConfirmation){
                        PendingConfirmations.remove(pendingConfirmation._id);
                    });
                }

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
    Creates filters for a wallet contract, to watch for deposits, or contract creation events.

    @method contractFilters
    @param {Object} newDocument
    */
    var contractFilters = function(newDocument){
        var blockToCheckBack = (Blockchain.findOne().checkpoint || 0) - rollBackBy;
        if(blockToCheckBack < 0)
            blockToCheckBack = 0;

        var contractInstance = contracts[newDocument._id];
        if(!contractInstance || newDocument.type === 'account')
            return;

        if(!contractInstance.events)
            contractInstance.events = [];

        // stop all running events
        _.each(contractInstance.events, function(event){
            event.stopWatching();
        });


        // SETUP FILTERS
        console.log('Checking Deposits and ConfirmationNeeded for '+ newDocument.address +' from block #', blockToCheckBack);

        // delete the last tx and pc until block -1000
        _.each(Transactions.find({_id: {$in: newDocument.transactions}, blockNumber: {$gt: blockToCheckBack}}).fetch(), function(tx){
            Transactions.remove(tx._id);
        });
        _.each(PendingConfirmations.find({_id: {$in: newDocument.pendingConfirmations}, blockNumber: {$gt: blockToCheckBack}}).fetch(), function(pc){
            PendingConfirmations.remove(pc._id);
        });

        // WATCH for a block confirmation, so we can turn the account active
        if(newDocument.disabled) {
            console.log('Checkin Created for '+ newDocument.address +' from block #', blockToCheckBack);
            var Created = contractInstance.Created({},{fromBlock: blockToCheckBack, toBlock: 'latest'});
            Created.watch(function(error, result) {
                console.log('Contract created on '+ newDocument.address);

                if(!error) {
                    // remove the disabled state
                    Accounts.update(newDocument._id, {$unset: {
                        disabled: ''
                    }, $set: {
                        creationBlock: result.blockNumber
                    }});

                    // setup daily limit
                    if(newDocument.dailyLimit)
                        contractInstance.setDailyLimit(newDocument.dailyLimit, {from: newDocument.owner});

                    // remove filter
                    Created.stopWatching();
                }
            });
        }

        // WATCH for incoming transactions
        contractInstance.events.push(contractInstance.Deposit({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        contractInstance.events[contractInstance.events.length-1].watch(function(error, log) {
            if(!error) {
                console.log('Deposit for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber());

                addTransaction(log, log.args.from, newDocument.address, log.args.value.toString(10));
            }
        });
        // WATCH for outgoing transactions
        contractInstance.events.push(contractInstance.SingleTransact({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        contractInstance.events[contractInstance.events.length-1].watch(function(error, log) {
            if(!error) {
                console.log('SingleTransact for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber());

                addTransaction(log, newDocument.address, log.args.to, log.args.value.toString(10));
            }
        });
        contractInstance.events.push(contractInstance.MultiTransact({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        contractInstance.events[contractInstance.events.length-1].watch(function(error, log) {
            if(!error) {
                console.log('MultiTransact for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber() +', Operation '+ log.args.operation);
                // console.log(log);
                addTransaction(log, newDocument.address, log.args.to, log.args.value.toString(10));

                // make sure pending confirmations get removed
                var confirmationId = Helpers.makeId('pc', log.args.operation);
                PendingConfirmations.remove(confirmationId);
                Tracker.afterFlush(function(){
                    Accounts.update({address: newDocument.address}, {$pull: {
                        pendingConfirmations: confirmationId
                    }});
                });
            }
        });
        // WATCH FOR CONFIRMATIONS NEEDED
        contractInstance.events.push(contractInstance.ConfirmationNeeded({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        contractInstance.events[contractInstance.events.length-1].watch(function(error, log) {
            if(!error) {
                console.log('ConfirmationNeeded for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber() +', Operation '+ log.args.operation);

                var block = web3.eth.getBlock(log.blockNumber, true, function(err, block){

                    if(!err) {
                        var confirmationId = Helpers.makeId('pc', log.args.operation),
                            transaction = _.find(block.transactions, function(tx){ return tx.hash === log.transactionHash; });

                        var account = Accounts.findOne({address: log.args.to}),
                            pendingConf = PendingConfirmations.findOne(confirmationId);
                         

                        // add pending confirmation,
                        // if not already present, OR transaction already went through
                        if(!pendingConf &&
                           !Transactions.findOne({_id: {$in: account.transactions || []}, operation: log.args.operation})) {
                            PendingConfirmations.insert({
                                _id: confirmationId,
                                initiator: log.args.initiator,
                                operation: log.args.operation,
                                value: log.args.value.toString(10),
                                to: log.args.to,
                                from: newDocument.address,
                                timestamp: block.timestamp,
                                blockNumber: log.blockNumber,
                                blockHash: log.blockHash,
                                transactionHash: log.transactionHash,
                                transactionIndex: log.transactionIndex,
                            });

                        } else if(pendingConf) {
                            PendingConfirmations.remove(confirmationId);
                        }
                    }

                });
            }
        });
    };


    /**
    Observe Accounts, listen for new created accounts.

    @class Accounts.find({}).observe
    @constructor
    */
    Accounts.find({}).observe({
        /**
        This will observe the account creation, to send the contract creation transaction.

        @method added
        */
        added: function(newDocument) {

            if(newDocument.type !== 'wallet')
                return;

            // DEPLOYED NEW CONTRACT
            if(!newDocument.address) {

                WalletContract.new({
                    from: newDocument.owner,
                    data: walletABICompiled,
                    gas: 1500000,
                    gasPrice: web3.eth.gasPrice

                }, function(err, contract){
                    if(!err) {
                        contracts[newDocument._id] = contract;
                        newDocument.address = contracts[newDocument._id].address;

                        // add address to account
                        Accounts.update(newDocument._id, {$set: {
                            address: newDocument.address
                        }});

                        contractFilters(newDocument);                    
                        
                    } else
                        // remove account, if something failed
                        Accounts.remove(newDocument._id);
                });

            // USE DEPLOYED CONTRACT
            } else {
                contracts[newDocument._id] = WalletContract.at(newDocument.address);

                // update balance on start
                web3.eth.getBalance(newDocument.address, function(err, res){
                    Accounts.update(newDocument._id, {$set: {
                        balance: res.toString(10)
                    }});
                });

                contractFilters(newDocument);
            }
        }
    });


    /**
    Updates a transaction.

    @method updateTransaction
    @param {Object} newDocument     The transaction object from our database
    @param {Object} transaction     The transaction object from getTransaction
    */
    var updateTransaction = function(newDocument, transaction){
        Transactions.update(newDocument._id, {$set: {
            blockNumber: transaction.blockNumber,
            blockHash: transaction.blockHash,
            transactionIndex: transaction.transactionIndex,
            fee: transaction.gasPrice.times(new BigNumber(transaction.gas)).toString(10)
        }});
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

            // add to accounts
            Accounts.update({address: {$in: [newDocument.from, newDocument.to]}}, {$addToSet: {
                transactions: newDocument._id
            }});

            if(!newDocument.blockHash) {

                // check first if the transaction was already mined
                web3.eth.getTransaction(newDocument.transactionHash, function(e, tx){
                    if(tx && tx.blockNumber)
                        updateTransaction(newDocument, tx);

                    // otherwise watch incoming transactions
                    else {

                        // watch the latest blocks until the transaction is included
                        var filter = web3.eth.filter('latest');
                        filter.watch(function(e, res){
                            if(!e) {
                                web3.eth.getTransaction(newDocument.transactionHash, function(e, tx){
                                    if(tx && tx.blockNumber) {
                                        updateTransaction(newDocument, tx);
                                        
                                        filter.stopWatching();
                                    }
                                });
                            }
                        });
                    }

                });

            }
        },
        /**
        Remove transactions confirmations from the accounts

        @method remove
        */
        remove: function(document) {
            Accounts.update({address: {$in: [document.from, document.to]}}, {$pull: {
                transactions: document._id
            }});
        }
    });


    
    /**
    Observe PendingConfirmations 

    @class PendingConfirmations({}).observe
    @constructor
    */
    PendingConfirmations.find({}).observe({
        /**
        Add pending confirmations to the accounts

        @method added
        */
        added: function(document) {
            Accounts.update({address: document.from}, {$addToSet: {
                pendingConfirmations: document._id
            }});
        },
        /**
        Remove pending confirmations from the accounts

        @method remove
        */
        remove: function(document) {
            Accounts.update({address: document.from}, {$pull: {
                pendingConfirmations: document._id
            }});
        }
    });
};


