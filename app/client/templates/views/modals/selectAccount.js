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
            return Helpers.getAccounts({address: {$in: this.accounts}});
        else
            return this.accounts;
    },
});

Template['views_modals_selectAccount'].events({
    /**
    Select an account

    @event click .dapp-account-list button
    */
    'click .dapp-account-list button': function(e, template){
        template.data.callback(this.address);
        EthElements.Modal.hide();
    }
});
