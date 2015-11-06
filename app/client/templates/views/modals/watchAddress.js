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
        var tokenAddress = TemplateVar.getFrom('.token-address', 'value');
        
        if(!tokenAddress || (template.data && template.data.address && template.data.address == tokenAddress))
            return;
        
        TemplateVar.set('address', tokenAddress);
    
        // initiate the geo pattern
        var pattern = GeoPattern.generate(tokenAddress, {color: '#CCC6C6'});
        $('.example.wallet-box.tokens').css('background-image', pattern.toDataUrl());
        
        // check if the token has information about itself asynchrounously
        var tokenInstance = TokenContract.at(tokenAddress);

        tokenInstance.symbol(function(e, i){
            if(template.$('input.symbol').val() === '')
                template.$('input.symbol').val(i).change();
        });

        tokenInstance.name(function(e, i){
            if(template.$('input.name').val() === '')
                template.$('input.name').val(i).change();
        });
        
        tokenInstance.decimals(function(e, i){
            if(template.$('input.decimals').val() === '')
                template.$('input.decimals').val(i).change();
        });

    },    
    /**
    Prevent the example from beeing clicked

    @event click .example.wallet-box.tokens
    */
    'click .example.wallet-box.tokens': function(e) {
        e.preventDefault();
    }
});