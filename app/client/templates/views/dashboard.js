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
    // /**
    // Get all current accounts

    // @method (accounts)
    // */
    // 'accounts': function(){
    //     return Accounts.find({}, {sort: {type: 1}});
    // },
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
        var accounts = Accounts.find().fetch();
        return _.compact(_.flatten(_.pluck(accounts, 'pendingConfirmations')));
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