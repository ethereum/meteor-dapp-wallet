/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/


Template['views_dashboard'].helpers({
    /**
    Get all current wallets

    @method (wallets)
    */
    'wallets': function(){
        return Wallets.find({}, {sort: {disabled: 1, creationBlock: 1}});
    },
    /**
    Get all current accounts

    @method (accounts)
    */
    'accounts': function(){
        // balance need to be present, to show only full inserted accounts (not ones added by mist.requestAccount)
        return EthAccounts.find({name: {$exists: true}}, {sort: {name: 1}});
    },
    /**
    Get all transactions

    @method (allTransactions)
    */
    'allTransactions': function(){
        return Transactions.find({}, {sort: {timestamp: -1}}).count();
    },
    /**
    Returns an array of pending confirmations, from all accounts
    
    @method (pendingConfirmations)
    @return {Array}
    */
    'pendingConfirmations': function(){
        return _.pluck(PendingConfirmations.find({operation: {$exists: true}, confirmedOwners: {$ne: []}}).fetch(), '_id');
    }
});


Template['views_dashboard'].events({
    'click button.compile': function(e, template) {
        web3.eth.compile.solidity(template.find('textarea.compile').value, function(e, res) {
            if(!e) {
                console.log(res);
            } else {
                GlobalNotification.error({
                    content: 'Couldn\'t compile code' , //TAPi18n.__('wallet.newWallet.error.stubHasNoOrigWalletAddress'),
                    duration: 5
                });
            }

        })
    },
    /**
    Request to create an account in mist
    
    @event click a.create.account
    */
    'click a.create.account': function(e){
        e.preventDefault();

        mist.requestAccount(function(e, account) {
            if(!e) {
                EthAccounts.upsert({address: account}, {$set: {
                    address: account,
                    new: true
                }});
            }
        });
    },
});