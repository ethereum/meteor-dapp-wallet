// var timer = 0,
//     timerId = null;

Blockchain.insert({
    blockNumber: web3.eth.blockNumber
});

// GET the latest blockchain information
web3.eth.filter('latest').watch(function(e, res){
    if(!e) {
        var block = web3.eth.getBlock('latest');
        
        Blockchain.update(Blockchain.findOne()._id, {$set: {
            blockNumber: block.number
        }});
    }
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
Observe Accounts, listen for new created accounts.

@class Chats.find({}).observe
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

            try {
                contractInstance = new WalletContract({
                    from: newDocument.owner,
                    data: walletABICompiled,
                    gas: 1500000,
                    gasPrice: web3.eth.gasPrice
                });
                address = contractInstance.address;

                // add address to account
                Accounts.update(newDocument._id, {$set: {
                    address: address
                }});
                
            } catch(e){
                console.error(e);

                // remove account, fi something failed
                Accounts.remove(newDocument._id);
            }


        // USE DEPLOYED CONTRACT
        } else {
            address = newDocument.address;
            contractInstance = new WalletContract(address);

            // update balance on start
            Accounts.update(newDocument._id, {$set: {
                balance: web3.eth.getBalance(address).toString(10)
            }});
        }

        if(!contractInstance)
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

                txId = result.transactionHash.replace('0x','').substr(0,10); //String(result.blockNumber) + String(result.transactionIndex) + result.args.value.toString(10).substr(0,10);
                var block = web3.eth.getBlock(result.blockNumber);

                // add transaction
                if(!Transactions.findOne(txId)) {
                    Transactions.insert({
                        _id: txId,
                        account: newDocument._id,
                        value: result.args.value.toString(10),
                        from: result.args.from,
                        timestamp: block.timestamp,
                        dateString: moment.unix(block.timestamp).format('LLLL'),
                        blockNumber: result.blockNumber,
                        blockHash: result.blockHash,
                        transactionHash: result.transactionHash,
                        transactionIndex: result.transactionIndex,
                        logIndex: 0,
                        text: ''
                    });
                    Accounts.update(newDocument._id, {$addToSet: {
                        transactions: txId
                    }});
                }

                // update balance
                Accounts.update(newDocument._id, {$set: {
                    balance: web3.eth.getBalance(address).toString(10)
                }});
            }

        });
    }
});

