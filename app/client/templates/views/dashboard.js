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
    Get all current accounts

    @method (accounts)
    */
    'accounts': function(){
        return Accounts.find({});
    },
    /**
    Get all transactions

    @method (allTransactions)
    */
    'allTransactions': function(){
        return Transactions.find({}, {sort: {timestamp: -1}});
    },
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