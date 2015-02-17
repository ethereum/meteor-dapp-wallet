/*
[17/02/15 20:39:20] gavofyork: Wallet(addressOfTheWalletContract).execute(to, value)
[17/02/15 20:40:32] gavofyork: from: addressOfTheWalletContract
[17/02/15 20:41:27] gavofyork: Wallet(addressOfWallet).transact({from: secretKeysAddress}).execute(...)
[17/02/15 20:41:47] gavofyork: Wallet(addressOfWallet).from(secretKeysAddress).execute(...)
*/

var accounts = web3.eth.accounts;
if(_.isArray(accounts)) {

    // disable accounts, which weren't in the given accounts array
    _.each(Accounts.find({_id: {$nin: accounts}}).fetch(), function(item){
        Accounts.update(item, {$set: {
            disabled: true
        }});
    });


    _.each(accounts, function(address) {
        
        // SETUP accounts
        if(!Accounts.findOne(address)) {
            Accounts.insert({
                _id: address,
                name: null,
                balance: web3.toDecimal(web3.eth.balanceAt(address))
            });

        // undisbale them and update balance
        } else {
            Accounts.update(address, {
                $set: {
                    balance: web3.toDecimal(web3.eth.balanceAt(address))
                },
                $unset: {
                    disabled: '',
                }
            });
        }

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
        web3.eth.watch('pending').changed(updateBalance);
        web3.eth.watch('chain').changed(updateBalance);

        console.log(web3.eth.watch('chain').logs(function(item){console.log(item);}));

        // look for balance changes
        // Meteor.setInterval(function(){
        // }, 1000);


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

