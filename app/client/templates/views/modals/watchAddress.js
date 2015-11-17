/**
Modal to add token.

@class [template] views_modals_addToken
@constructor
*/


Template['views_modals_watchAddress'].onRendered(function(){
    if(!this.data || !this.data.address)
        this.$('input[name="address"]').focus();
});

Template['views_modals_watchAddress'].events({
    /**
    Change Address

    @event change input[name="address"], input input[name="address"]
    */
    'change input[name="address"], input input[name="address"]': function(e, template) {
        var contractAddress = TemplateVar.getFrom('.contract-address', 'value');
        
        if(!contractAddress || (template.data && template.data.address && template.data.address == tokenAddress))
            return;
        
        TemplateVar.set('address', contractAddress);
      
        // check if the contract has a name
        var tokenInstance = TokenContract.at(contractAddress);

        tokenInstance.name(function(e, i){
            if(template.$('input.name').val() === '')
                template.$('input.name').val(i).change();
        });

    }
});