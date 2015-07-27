/**
Template Controllers

@module Templates
*/

/**
The select account modal template

@class [template] views_modals_selectAccount
@constructor
*/


Template['views_modals_selectAccount'].helpers({
    /**
    Return the accounts

    @method (accounts)
    */
    'accounts': function(){
        if(_.isString(this.accounts[0]))
            return EthAccounts.find({address: {$in: this.accounts}});
        else
            return this.accounts;
    },
});

Template['views_modals_selectAccount'].events({
    /**
    Close the modal

    @event click button.cancel
    */
    'click button.cancel': function(){
        Router.current().render(null, {to: 'modal'});
    },
    /**
    Select an account

    @event click .dapp-account-list button
    */
    'click .dapp-account-list button': function(e, template){
        template.data.callback(this.address);
        Router.current().render(null, {to: 'modal'});
    },

});
