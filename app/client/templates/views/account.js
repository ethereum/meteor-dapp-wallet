/**
Template Controllers

@module Templates
*/

/**
The template to display account information.

@class [template] views_account
@constructor
*/



Template['views_account'].helpers({
    /**
    Get the name

    @method (name)
    */
    'name': function(){
        return this.name || TAPi18n.__('wallet.accounts.defaultName');
    },
    /**
    Lists the transactions belonging to this account

    @method (transactions)
    */
    'transactions': function(){
        return Transactions.find({_id: {$in: this.transactions}}, {sort: {timestamp: -1}});
    }
});

Template['views_account'].events({
    /**
    Select the current section, based on the radio inputs value.

    @event change input[type="radio"]
    */
    // 'change input[type="radio"]': function(e){
    //     TemplateVar.set('selectedSection', e.currentTarget.value);
    // }
});
