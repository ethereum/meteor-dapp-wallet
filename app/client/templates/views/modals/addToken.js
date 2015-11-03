/**
Modal to add token.

@class [template] views_modals_addToken
@constructor
*/


Template['views_modals_addToken'].onRendered(function(){
    if(!this.data || !this.data.address)
        this.$('input[name="address"]').focus();
});

Template['views_modals_addToken'].helpers({
    /**
    Returns the token for the preview token box

    @method (previewToken)
    */
    'previewToken' : function(){
        var token = _.clone(this || {});

        if(TemplateVar.get('address'))
            token.address = TemplateVar.get('address');
        if(TemplateVar.get('decimals'))
            token.decimals = TemplateVar.get('decimals');
        if(TemplateVar.get('symbol'))
            token.symbol = TemplateVar.get('symbol');
        if(TemplateVar.get('name'))
            token.name = TemplateVar.get('name');

        return token;
    }
});


Template['views_modals_addToken'].events({
    /**
    Change Decimals

    @event change .decimals, input .decimals
    */
    'change .decimals, input .decimals': function(e, template) {
        TemplateVar.set('decimals', e.target.value);
    },    
    /**
    Change Symbol

    @event change input.symbol, input input.symbol
    */
    'change input.symbol, input input.symbol': function(e, template) {
        TemplateVar.set('symbol', e.target.value);
    },    
    /**
    Change Name

    @event change input.name, input input.name
    */
    'change input.name, input input.name': function(e, template) {
        TemplateVar.set('name', e.target.value);
    },    
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