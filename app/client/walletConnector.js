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
        //         balance: web3.toDecimal(web3.eth.balanceAt(address))
        //     });

        // // undisbale them and update balance
        // } else {
        //     Accounts.update(address, {
        //         $set: {
        //             balance: web3.toDecimal(web3.eth.balanceAt(address))
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
                balance: web3.toDecimal(web3.eth.balanceAt(address))
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
        var contract,
            address;

        if(!newDocument.address) {


            address = web3.eth.transact({
                from: newDocument.owner,
                data: walletABICompiled,
                gas: web3.fromDecimal(30400),
                gasPrice: web3.eth.gasPrice
            });


            // add
            Accounts.update(newDocument._id, {$set: {
                address: address
            }});

            contract = web3.eth.contract(address, walletABI);


            // WATCH for a block confirmation, so we can turn the account active
            var watcher = web3.eth.watch(contract.Created, {}, {latest: -1});
            watcher.changed(function(result) {

                // remove the disabled state
                Accounts.update(newDocument._id, {$unset: {
                    disabled: ''
                }});

                watcher.uninstall();

                console.log('Created', result);
            });



        } else {
            address = newDocument.address;
            contract = web3.eth.contract(address, walletABI);
        }


        // WATCH for incoming transactions
        console.log('Watch for Deposit');
        var watcher = web3.eth.watch(contract.Deposit);
        watcher.changed(function(result) {
            console.log('Deposit', result.args); //result.args.value.toNumber()

            // update balance
            Accounts.update(newDocument._id, {$set: {
                balance: web3.toDecimal(web3.eth.balanceAt(address))
            }});
        });

        // console.log('log:', web3.eth.logs({address: address}));
    }
});

