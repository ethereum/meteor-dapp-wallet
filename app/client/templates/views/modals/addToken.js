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
        var tokenAddress = e.target.value;

        // initiate the geo pattern
        var pattern = GeoPattern.generate(tokenAddress, {color: '#CCC6C6'});
        $('.example.wallet-box.tokens').css('background-image', pattern.toDataUrl());
        


        if(!$(e.target).hasClass('dapp-error')){
            TemplateVar.set('tokenAddress', tokenAddress)
        };

        // check if the token has information about itself asynchrounously
        var tokenInstance = TokenContract.at(tokenAddress);

        tokenInstance.tokenSymbol(function(e, i){
            if ($('input.symbol').val()=='')
                $('input.symbol').val(i).change();
        })

        tokenInstance.tokenName(function(e, i){
            if ($('input.name').val()=='')
                $('input.name').val(i).change();
        })
        
        tokenInstance.tokenDecimals(function(e, i){
            if ($('input.decimals').val()=='')
                $('input.decimals').val(i).change();
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