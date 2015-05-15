
/**
The walletConnector

@class walletConnector
@constructor
*/

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
        gasPrice: web3.eth.gasPrice.toString(10)
    }});

    // GET the latest blockchain information
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {
            var block = web3.eth.getBlock(res, function(e, block){
                // console.log('BLOCK', block.number);
                
                Blockchain.update(blockchainId, {$set: {
                    blockNumber: block.number
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


    // ADD accounts
    _.each(web3.eth.accounts, function(item){
        if(!_.contains(_.pluck(Accounts.find().fetch(), 'address'), item))
            Accounts.insert({
                type: 'account',
                address: item,
                balance: '0',
                name: (item === web3.eth.coinbase) ? 'Coinbase' : item
            });
    });


    /*
    Wallet(addressOfTheWalletContract).execute(to, value)
    from: addressOfTheWalletContract
    Wallet(addressOfWallet).transact({from: secretKeysAddress}).execute(...)
    Wallet(addressOfWallet).from(secretKeysAddress).execute(...)
    */

    // var accounts = web3.eth.accounts;
    // if(_.isArray(accounts)) {

    //     // disable accounts, which weren't in the given accounts array
    //     // _.each(Accounts.find({_id: {$nin: accounts}}).fetch(), function(item){
    //     //     Accounts.update(item, {$set: {
    //     //         disabled: true
    //     //     }});
    //     // });

    //     _.each(accounts, function(address) {
            
    //         // SETUP accounts
    //         // if(!Accounts.findOne(address)) {
    //         //     Accounts.insert({
    //         //         _id: address,
    //         //         name: null,
    //         //         balance: web3.toDecimal(web3.eth.getBalance(address))
    //         //     });

    //         // // undisbale them and update balance
    //         // } else {
    //         //     Accounts.update(address, {
    //         //         $set: {
    //         //             balance: web3.toDecimal(web3.eth.getBalance(address))
    //         //         },
    //         //         $unset: {
    //         //             disabled: '',
    //         //         }
    //         //     });
    //         // }

    //         // watch for new blocks
    //         var updateBalance = function (log) {
    //             console.log(log); //  {"address":"0x0000000000000000000000000000000000000000","data":"0x0000000000000000000000000000000000000000000000000000000000000000","number":0}

    //             Accounts.update(address, {$set: {
    //                 balance: web3.toDecimal(web3.eth.getBalance(address))
    //             }});
    //         };


            
    //         TODO: change later to
    //         {
    //             address: web3.eth.accounts
    //         }
            
    //         // web3.eth.watch('pending').changed(updateBalance);
    //         // web3.eth.watch('chain').changed(updateBalance);

    //         // console.log(web3.eth.watch('chain').logs());


    //         // start WATCH for transactions
    //         // var walletContract = web3.eth.contract(address, walletABI);

    //         // // single transactions
    //         // var singleTxWatcher = walletContract.SingleTransact(),
    //         //     transactionCallback = function(result) {
    //         //         console.log('transaction arrived', result);
    //         //         Transactions.insert(result);
    //         //     };

    //         // var pastSingleTransactions = singleTxWatcher.logs();
    //         // if(_.isArray(pastSingleTransactions)) {
    //         //     _.each(pastSingleTransactions, transactionCallback);
    //         // }

    //         // singleTxWatcher.changed(transactionCallback);

    //         // // multisig transactions
    //         // var multiTxWatcher = walletContract.MultiTransact(),
    //         //     transactionCallback = function(result) {
    //         //         console.log('transaction arrived', result);
    //         //         Transactions.insert(result);
    //         //     };

    //         // var pastMultiTransactions = multiTxWatcher.logs();
    //         // if(_.isArray(pastMultiTransactions)) {
    //         //     _.each(pastMultiTransactions, transactionCallback);
    //         // }

    //         // multiTxWatcher.changed(transactionCallback);
    //     });

    // }

    /**
    Creates filters for a wallet contract, to watch for deposits, or contract creation events.

    @method contractFilters
    @param {Object} newDocument
    @param {Object} contractInstance
    @param {String} address
    @param {Number} blockToCheckBack
    */
    var contractFilters = function(newDocument, contractInstance, address, blockToCheckBack){
        if(!contractInstance || newDocument.type === 'account')
            return;

        // SETUP FILTERS

        // get BlockNumber to look from
        var lastBlock = (lastTx = Transactions.findOne({account: newDocument._id}, {sort: {blockNumber: -1}}))
            ? lastTx.blockNumber - blockToCheckBack // check the last 1000 blocks again, to be sure we are not on a fork
            : 0;
        if(lastBlock < 0)
            lastBlock = 0;

        console.log('Checkin Deposits for '+ address +' from block #', lastBlock);

        // delete the last tx until block -1000
        // var lastTx = Transactions.findOne({account: newDocument._id}, {sort: {blockNumber: -1}});
        // console.log(lastTx.blockNumber - blockToCheckBack, lastBlock);
        // if(lastTx.blockNumber - blockToCheckBack === lastBlock) {
        //     _.each(Transactions.find({account: newDocument._id, blockNumber: {$gt: lastBlock}}).fetch(), function(tx){
        //         Transactions.remove(tx._id);
        //     });
        //     console.log('Deleted, now have', Transactions.find().count());
        // }

        // WATCH for a block confirmation, so we can turn the account active
        if(newDocument.disabled) {
            console.log('Checkin Created for '+ address +' from block #', lastBlock);
            contractInstance.Created({},{fromBlock: lastBlock, toBlock: 'latest'}).watch(function(error, result) {
                console.log('Contract created on '+ address);

                if(!error) {
                    // remove the disabled state
                    Accounts.update(newDocument._id, {$unset: {
                        disabled: ''
                    }});

                    // remove filter
                    contractInstance.Created().stopWatching();
                }
            });
        }

        // WATCH for incoming transactions
        contractInstance.Deposit({}, {fromBlock: lastBlock, toBlock: 'latest'}).watch(function(error, result) {
            if(!error) {
                console.log('Deposit for '+ address +' arrived in block: #'+ result.blockNumber, result.args.value.toNumber());

                var block = web3.eth.getBlock(result.blockNumber, function(err, block){

                    if(!err) {
                        txId = Helpers.makeTransactionId(result.transactionHash);

                        // add transaction
                        if(!Transactions.findOne(txId)) {
                            Transactions.insert({
                                _id: txId,
                                value: result.args.value.toString(10),
                                to: newDocument.address,
                                from: result.args.from,
                                timestamp: block.timestamp,
                                blockNumber: result.blockNumber,
                                blockHash: result.blockHash,
                                transactionHash: result.transactionHash,
                                transactionIndex: result.transactionIndex
                            });
                            Accounts.update(newDocument._id, {$addToSet: {
                                transactions: txId
                            }});
                        }

                        // update balance
                        web3.eth.getBalance(address, function(err, res){
                            Accounts.update(newDocument._id, {$set: {
                                balance: res.toString(10)
                            }});
                        });
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
            var address,
                contractInstance,
                blockToCheckBack = 1000;

            // DEPLOYED NEW CONTRACT
            if(!newDocument.address) {

                WalletContract.new({
                    from: newDocument.owner,
                    data: walletABICompiled,
                    gas: 1500000,
                    gasPrice: web3.eth.gasPrice

                }, function(err, contract){
                    if(!err) {
                        contractInstance = contract;
                        address = contractInstance.address;

                        // add address to account
                        Accounts.update(newDocument._id, {$set: {
                            address: address
                        }});

                        contractFilters(newDocument, contractInstance, address, blockToCheckBack);                    
                        
                    } else
                        // remove account, if something failed
                        Accounts.remove(newDocument._id);
                });

            // USE DEPLOYED CONTRACT
            } else {
                address = newDocument.address;
                contractInstance = WalletContract.at(address);

                // update balance on start
                web3.eth.getBalance(address, function(err, res){
                    Accounts.update(newDocument._id, {$set: {
                        balance: res.toString(10)
                    }});
                });

                contractFilters(newDocument, contractInstance, address, blockToCheckBack);
            }

        }
    });


    /**

    @method updateTransaction
    @param {Object} newDocument     The transaction object from our database
    @param {Object} transaction     The transaction object from getTransaction
    */
    var updateTransaction = function(newDocument, transaction){
        Transactions.update(newDocument._id, {$set: {
            blockNumber: transaction.blockNumber,
            blockHash: transaction.blockHash,
            transactionIndex: transaction.transactionIndex
        }});
    };

    /**
    Observe transactions, listen for new created transactions.

    @class Chats.Transactions({}).observe
    @constructor
    */
    Transactions.find({}).observe({
        /**
        This will observe the transactions creation and create watchers for outgoing trandsactions, to see when they are mined.

        @method added
        */
        added: function(newDocument) {
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
                                var block = web3.eth.getTransaction(newDocument.transactionHash, function(e, tx){
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
        }
    });
};


