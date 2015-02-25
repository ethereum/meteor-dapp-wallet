/*
Wallet(addressOfTheWalletContract).execute(to, value)
from: addressOfTheWalletContract
Wallet(addressOfWallet).transact({from: secretKeysAddress}).execute(...)
Wallet(addressOfWallet).from(secretKeysAddress).execute(...)
*/

var accounts = web3.eth.accounts;
if(_.isArray(accounts)) {

    // disable accounts, which weren't in the given accounts array
    // _.each(Accounts.find({_id: {$nin: accounts}}).fetch(), function(item){
    //     Accounts.update(item, {$set: {
    //         disabled: true
    //     }});
    // });

    _.each(accounts, function(address) {
        
        // SETUP accounts
        // if(!Accounts.findOne(address)) {
        //     Accounts.insert({
        //         _id: address,
        //         name: null,
        //         balance: web3.toDecimal(web3.eth.getBalance(address))
        //     });

        // // undisbale them and update balance
        // } else {
        //     Accounts.update(address, {
        //         $set: {
        //             balance: web3.toDecimal(web3.eth.getBalance(address))
        //         },
        //         $unset: {
        //             disabled: '',
        //         }
        //     });
        // }

        // watch for new blocks
        var updateBalance = function (log) {
            console.log(log); //  {"address":"0x0000000000000000000000000000000000000000","data":"0x0000000000000000000000000000000000000000000000000000000000000000","number":0}

            Accounts.update(address, {$set: {
                balance: web3.toDecimal(web3.eth.getBalance(address))
            }});
        };


        /*
        TODO: change later to
        {
            address: web3.eth.accounts
        }
        */
        // web3.eth.watch('pending').changed(updateBalance);
        // web3.eth.watch('chain').changed(updateBalance);

        // console.log(web3.eth.watch('chain').logs());


        // start WATCH for transactions
        // var walletContract = web3.eth.contract(address, walletABI);

        // // single transactions
        // var singleTxWatcher = walletContract.SingleTransact(),
        //     transactionCallback = function(result) {
        //         console.log('transaction arrived', result);
        //         Transactions.insert(result);
        //     };

        // var pastSingleTransactions = singleTxWatcher.logs();
        // if(_.isArray(pastSingleTransactions)) {
        //     _.each(pastSingleTransactions, transactionCallback);
        // }

        // singleTxWatcher.changed(transactionCallback);

        // // multisig transactions
        // var multiTxWatcher = walletContract.MultiTransact(),
        //     transactionCallback = function(result) {
        //         console.log('transaction arrived', result);
        //         Transactions.insert(result);
        //     };

        // var pastMultiTransactions = multiTxWatcher.logs();
        // if(_.isArray(pastMultiTransactions)) {
        //     _.each(pastMultiTransactions, transactionCallback);
        // }

        // multiTxWatcher.changed(transactionCallback);
    });

}


/**
Observe Accounts, listen for new created accounts.

@class Chats.find({}).observe
@constructor
*/
Accounts.find({}).observe({
    /**
    This will observe the account creation, to send the contract transaction.

    @method added
    */
    added: function(newDocument) {
        var Contract = web3.eth.contract(walletABI),
            address;

        if(!newDocument.address) {


            address = web3.eth.sendTransaction({
                from: newDocument.owner,
                data: walletABICompiled,
                gas: 30400,
                gasPrice: 10000000000000//web3.eth.gasPrice
            }, function(){
                console.log('contract READY');
            });

            // add address to account
            Accounts.update(newDocument._id, {$set: {
                address: address
            }});

            
            var contractInstance = new Contract(address);

            // WATCH for a block confirmation, so we can turn the account active
            // var filter = web3.eth.filter(contractInstance.Created, {}, {latest: -1});
            contractInstance.Created().watch(function(result) {

                // remove the disabled state
                Accounts.update(newDocument._id, {$unset: {
                    disabled: ''
                }});

                contractInstance.Created().stopWatching();
            });



        } else {
            address = newDocument.address;
            var contractInstance = new Contract(address);

            // update balance on start
            Accounts.update(newDocument._id, {$set: {
                balance: web3.eth.getBalance(address).toString(10)
            }});
        }


        // WATCH for incoming transactions
        contractInstance.Deposit({}, {}).watch(function(result) {
            console.log('Deposit', result.args.value.toNumber()); //result.args.value.toNumber()

            // update balance
            Accounts.update(newDocument._id, {$set: {
                balance: web3.eth.getBalance(address).toString(10)
            }});
        });

        console.log(contractInstance.Deposit({}, {}).get());
    }
});

