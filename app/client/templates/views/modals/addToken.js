/**
The template to display each token.

@class [template] views_account
@constructor
*/



Template['views_modals_addToken'].events({
    /**
    Submit form

    @event submit form
    */
    'change .division': function(e, template) {
        console.log(template);
        console.log(TemplateVar.getFrom('.division', 'value'));

    },
        /**
    Select an account

    @event click .dapp-account-list button
    */
    'click .dapp-account-list button': function(e, template){
        template.data.callback(this.address);
        TemplateVar.set('TokenBaseDecimals', 2);

        EthElements.Modal.hide();
    }
});


Template['views_modals_addToken'].helpers({
       /**
    Calculates the fee used for this transaction in ether

    @method (estimatedFee)
    */
    'formattedNumber': function() {
        console.log(TemplateVar.getFrom('.division', 'value'))
        return "1.2";
    }
});