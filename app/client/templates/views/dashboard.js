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
        return EthAccounts.find({}, {sort: {balance: -1, name: 1}});
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
    /**
    Set the to publicKey while typing
    
    @event keyup input[name="to"]
    */
    // 'keyup input[name="to"]': function(e){
    //     TemplateVar.set('toPublicKey', e.currentTarget.value);
    // },
});