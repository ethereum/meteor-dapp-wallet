/**
The template to display each token.

@class [template] views_modals_addToken
@constructor
*/



Template['views_modals_addToken'].onCreated(function(){
    TemplateVar.set('symbol', '$');
});

Template['views_modals_addToken'].onRendered(function(){
    this.$('input[name="address"]').focus();
});

Template['views_modals_addToken'].helpers({
    /**
    Calculates the fee used for this transaction in ether

    @method (estimatedFee)
    */
    'formattedNumber': function() {
        return Helpers.formatNumberByDecimals(123456789, TemplateVar.get('decimals'));
    },
    /**
    Return the address given, or from the template var

    @method address
    */
    'tokenAddress' : function(){
        return this.address || TemplateVar.get("tokenAddress");
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
        
        if(!tokenAddress) 
            return;
        
        TemplateVar.set('tokenAddress', tokenAddress)
    
        // initiate the geo pattern
        var pattern = GeoPattern.generate(tokenAddress, {color: '#CCC6C6'});
        $('.example.wallet-box.tokens').css('background-image', pattern.toDataUrl());
        
        // check if the token has information about itself asynchrounously
        var tokenInstance = TokenContract.at(tokenAddress);

        tokenInstance.symbol(function(e, i){
            if(template.$('input.symbol').val() === '')
                template.$('input.symbol').val(i).change();
        })

        tokenInstance.name(function(e, i){
            if(template.$('input.name').val() === '')
                template.$('input.name').val(i).change();
        })
        
        tokenInstance.decimals(function(e, i){
            if(template.$('input.decimals').val() === '')
                template.$('input.decimals').val(i).change();
        })

    },    
    /**
    Prevent the example from beeing clicked

    @event click .example.wallet-box.tokens
    */
    'click .example.wallet-box.tokens': function(e) {
        e.preventDefault();
    }
});