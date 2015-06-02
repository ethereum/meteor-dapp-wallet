
/**
Created radom 32 byte string

@method random32Bytes
*/
var random32Bytes = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + s4() + s4() +
    s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4() +
    s4() + s4() + s4() + s4();
};

/**
Update the contract data, like dailyLimit and required signatures.

@method updateContractData
*/
var updateContractData = function(newDocument){
    var contractInstance = contracts[newDocument._id];

    contractInstance.m_dailyLimit(function(err, result){
        Accounts.update(newDocument._id, {$set: {
            dailyLimit: result.toString(10)
        }});
    });
    contractInstance.m_required(function(err, result){
        Accounts.update(newDocument._id, {$set: {
            requiredSignatures: result.toString(10)
        }});
    });
};

/**
Creates filters for a wallet contract, to watch for deposits, pending confirmations, or contract creation events.

@method setupContractFilters
@param {Object} newDocument
*/
setupContractFilters = function(newDocument){
    var blockToCheckBack = (LastBlock.findOne('latest').checkpoint || 0) - ethereumConfig.rollBackBy;
    if(blockToCheckBack < 0)
        blockToCheckBack = newDocument.creationBlock;

    var contractInstance = contracts[newDocument._id];
    if(!contractInstance || newDocument.type === 'account')
        return;

    if(!contractInstance.events)
        contractInstance.events = [];

    var events = contractInstance.events;

    // stop all running events
    _.each(contractInstance.events, function(event){
        event.stopWatching();
    });

    // WATCH for the created event, to get the creation block
    if(newDocument.imported) {

        Helpers.eventLogs('Checking Created for address: '+ newDocument.address +' from block #'+ newDocument.creationBlock);
        events.push(contractInstance.Created({}, {fromBlock: newDocument.creationBlock, toBlock: 'latest'}));
        var Created = events[events.length-1];
        Created.watch(function(error, log) {
            Helpers.eventLogs('Contract created on block #'+ log.blockNumber);

            if(!error) {

                // add the address state
                Accounts.update(newDocument._id, {$unset: {
                    imported: '',
                }, $set: {
                    creationBlock: log.blockNumber
                }});
                newDocument = Accounts.findOne(newDocument._id);

                // remove filter
                Created.stopWatching();

                // update dailyLimit and requiredSignatures
                updateContractData(newDocument);

                // add contract filters
                setupContractFilters(newDocument);
            }
        });

    // WATCH for a block confirmation, so we can turn the account active
    } else if(!newDocument.address) {


        Helpers.eventLogs('Checking Created for Identifier: '+ newDocument.createdIdentifier +' from block #'+ newDocument.creationBlock);
        events.push(web3.eth.filter({topics: [null, newDocument.createdIdentifier], fromBlock: newDocument.creationBlock, toBlock: 'latest'}));//contractInstance.Created({},{fromBlock: blockToCheckBack, toBlock: 'latest'});
        var Created = events[events.length-1];
        Created.watch(function(error, log) {
            Helpers.eventLogs('Contract created on '+ log.address);

            if(!error) {
                // add the address state
                Accounts.update(newDocument._id, {$unset: {
                    createdIdentifier: ''
                }, $set: {
                    creationBlock: log.blockNumber,
                    address: log.address
                }});
                newDocument = Accounts.findOne(newDocument._id);

                // set address to the contract instance
                contracts[newDocument._id].address = log.address;

                // SETUP DAILY LIMIT
                if(newDocument.dailyLimit && newDocument.dailyLimit !== ethereumConfig.dailyLimitDefault)
                    contractInstance.setDailyLimit(newDocument.dailyLimit, {from: newDocument.owners[0], gas: 1000000});
                // set simple wallet daily limit 100 000 000 ether
                else
                    contractInstance.setDailyLimit(ethereumConfig.dailyLimitDefault, {from: newDocument.owners[0], gas: 1000000});
                    

                // ADD OWNERS
                if(newDocument.owners.length > 1) {
                    _.each(newDocument.owners, function(owner){
                        if(newDocument.owners[0] !== owner) {
                            contractInstance.addOwner(owner, {from: newDocument.owners[0], gas: 1000000});
                            // remove owner, so that log can re-add it
                            Accounts.update(newDocument._id, {$pull: {
                                owners: owner
                            }});
                        }
                    });
                }

                // ADD REQUIRED SIGNATURES
                if(newDocument.requiredSignatures && newDocument.requiredSignatures != 1) {
                    Tracker.afterFlush(function(){
                        contractInstance.changeRequirement(newDocument.requiredSignatures, {from: newDocument.owners[0], gas: 500000});
                    });
                }


                // remove filter
                Created.stopWatching();

                // add contract filters
                setupContractFilters(Accounts.findOne(newDocument._id));
            }
        });

    // ADD FILTERS
    } else {

        // SETUP FILTERS
        Helpers.eventLogs('Checking Deposits and ConfirmationNeeded for '+ newDocument.address +' from block #', blockToCheckBack);

        // delete the last tx and pc until block -1000
        _.each(Transactions.find({_id: {$in: newDocument.transactions || []}, blockNumber: {$gt: blockToCheckBack}}).fetch(), function(tx){
            Transactions.remove(tx._id);
        });
        _.each(PendingConfirmations.find({_id: {$in: newDocument.pendingConfirmations || []}, blockNumber: {$gt: blockToCheckBack}}).fetch(), function(pc){
            PendingConfirmations.remove(pc._id);
        });


        // WATCH for incoming transactions
        events.push(contractInstance.Deposit({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('Deposit for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber());

                addTransaction(log, log.args.from, newDocument.address, log.args.value.toString(10));
            }
        });
        // WATCH for outgoing transactions
        events.push(contractInstance.SingleTransact({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('SingleTransact for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber());

                addTransaction(log, newDocument.address, log.args.to, log.args.value.toString(10));
            }
        });
        events.push(contractInstance.MultiTransact({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('MultiTransact for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber() +', Operation '+ log.args.operation);
                // Helpers.eventLogs(log);
                addTransaction(log, newDocument.address, log.args.to, log.args.value.toString(10));
            }
        });
        // WATCH FOR CONFIRMATIONS NEEDED
        events.push(contractInstance.ConfirmationNeeded({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('ConfirmationNeeded for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber() +', Operation '+ log.args.operation);

                var block = web3.eth.getBlock(log.blockNumber, true, function(err, block){

                    if(!err) {
                        var confirmationId = Helpers.makeId('pc', log.args.operation),
                            accounts = Accounts.find({$or: [{address: log.args.initiator}, {address: log.args.to}]}).fetch(),
                            pendingConf = PendingConfirmations.findOne(confirmationId),
                            depositTx;

                        if(accounts[0] && accounts[0].transactions) {
                            var txs = _.flatten(_.pluck(accounts, 'transactions'));
                            depositTx = Transactions.findOne({_id: {$in: txs || []}, operation: log.args.operation});
                        }


                        // add pending confirmation,
                        // if not already present, OR transaction already went through
                        if(depositTx) {
                            PendingConfirmations.remove(confirmationId);
                        
                        } else {
                            PendingConfirmations.upsert(confirmationId, {
                                confirmedOwners: pendingConf ? pendingConf.confirmedOwners : [],
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
                        }
                    }
                    
                });

            }
        });


        // WATCH for OWNER changes
        events.push(contractInstance.OwnerAdded({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('OwnerAdded for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args);

                // re-add owner from log
                Accounts.update(newDocument._id, {$addToSet: {
                    owners: log.args.newOwner
                }});
            }
        });
        events.push(contractInstance.OwnerRemoved({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('OwnerRemoved for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args);

                // re-add owner from log
                Accounts.update(newDocument._id, {$pull: {
                    owners: log.args.oldOwner
                }});
            }
        });
        events.push(contractInstance.RequirementChanged({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('RequirementChanged for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args);

            }
        });
        events.push(contractInstance.Confirmation({}, {fromBlock: blockToCheckBack, toBlock: 'latest'}));
        events[events.length-1].watch(function(error, log) {
            if(!error) {
                Helpers.eventLogs('Operation confirmation for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args);

                // delay a little to prevent race conditions
                Tracker.afterFlush(function(){
                    var confirmationId = Helpers.makeId('pc', log.args.operation);
                    //     accounts = Accounts.findOne({address: log.address}),
                    //     depositTx;

                    // if(accounts[0] && accounts[0].transactions) {
                    //     var txs = _.flatten(_.pluck(accounts, 'transactions'));
                    //     depositTx = Transactions.findOne({_id: {$in: txs || []}, operation: log.args.operation});
                    // }

                    // if(!depositTx)
                        PendingConfirmations.upsert(confirmationId, {$addToSet: {
                            confirmedOwners: log.args.owner
                        }, $set:{
                            from: newDocument.address,
                        }});
                });
            }
        });
    }

};


/**
Observe accounts and setup filters

@method observeAccounts
*/
observeAccounts = function(){

    /**
    Checking for confirmations of created wallets.

    Will only check if the old document, has no address and its inside the confirmations still.

    @method checkWalletConfirmations
    @param {Object} newDocument
    @param {Object} oldDocument
    */
    var checkWalletConfirmations = function(newDocument, oldDocument){
        var confirmations = LastBlock.findOne('latest').blockNumber - newDocument.creationBlock;

        if(newDocument.address && !oldDocument.address && confirmations < ethereumConfig.requiredConfirmations) {
            var filter = web3.eth.filter('latest');
            filter.watch(function(e, blockHash){
                if(!e) {
                    var confirmations = LastBlock.findOne('latest').blockNumber - newDocument.creationBlock;

                    if(confirmations < ethereumConfig.requiredConfirmations && confirmations > 0) {
                        Helpers.eventLogs('Checking wallet address '+ newDocument.address +' for code. Current confirmations: '+ confirmations);

                        // Check if the code is still at the contract address, if not remove the wallet
                        web3.eth.getCode(newDocument.address, function(e, code){
                            if(code.length <= 2) {
                                Accounts.remove(newDocument._id);
                                filter.stopWatching();

                            // check for wallet data
                            } else {
                                updateContractData(newDocument);                                
                            }
                        });
                    } else if(confirmations > ethereumConfig.requiredConfirmations) {
                        filter.stopWatching();
                    }
                }
            });
        }
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
                var createdIdentifier = '0x'+ random32Bytes();

                Helpers.eventLogs('Generated Identifier: '+ createdIdentifier);

                // identifier already exisits, so just watch for created and don't re-deploy
                if(newDocument.createdIdentifier) {
                    contracts[newDocument._id] = WalletContract.at();
                    setupContractFilters(newDocument);
                    return;
                }

                WalletContract.new(createdIdentifier, {
                    from: newDocument.owners[0],
                    data: walletABICompiled,
                    gas: 2000000,
                    gasPrice: web3.eth.gasPrice

                }, function(err, contract){
                    if(!err) {
                        contracts[newDocument._id] = contract;

                        Helpers.eventLogs('Guessed Contract Address: ', contract.address);


                        // newDocument.address = contracts[newDocument._id].address;
                        newDocument.createdIdentifier = createdIdentifier;

                        // add createdIdentifier to account
                        Accounts.update(newDocument._id, {$set: {
                            createdIdentifier: createdIdentifier
                            // address: newDocument.address
                        }});

                        setupContractFilters(newDocument);                    
                        
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

                setupContractFilters(newDocument);

                checkWalletConfirmations(newDocument, {});
            }
        },
        /**
        Will check if the contract is still 

        @method changed
        */
        changed: checkWalletConfirmations
    });

};