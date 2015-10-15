/**
The template to display each token.

@class [template] views_account
@constructor
*/



Template['views_modals_addToken'].onRendered(function(){
    TemplateVar.set('symbol', '$');
});

Template['views_modals_addToken'].events({
    /**
    Change Decimals

    @event submit form
    */
    'change .decimals': function(e, template) {
        var decimals = e.target.value;
        TemplateVar.set('decimals', decimals);
    },    
    /**
    Change Symbol

    @event change symbol
    */
    'change input.symbol': function(e, template) {
        TemplateVar.set('symbol', e.target.value);
    },    
    /**
    Change Name

    @event change name
    */
    'change input.name': function(e, template) {
        TemplateVar.set('name', e.target.value);
    },    
    /**
    Change Symbol

    @event submit form
    */
    'change input[name="address"]': function(e, template) {
        // initiate the geo pattern
        var pattern = GeoPattern.generate(e.target.value, {color: '#CCC6C6'});
        $('.example.wallet-box.tokens').css('background-image', pattern.toDataUrl());
        
        if(!$(e.target).hasClass('dapp-error')){
            TemplateVar.set('tokenAddress', e.target.value)
        };
    },    
    /**
    click example

    @event submit form
    */
    'click .example.wallet-box.tokens': function(e) {
        e.preventDefault();
    }
});


Template['views_modals_addToken'].helpers({
    /**
    Calculates the fee used for this transaction in ether

    @method (estimatedFee)
    */
    'formattedNumber': function() {
        var decimals = this.decimals;
        var numberFormat = '0,0.';

        for(i=0;i<decimals;i++){
            numberFormat += "0";
        }

        var formatted = numeral(1).format(numberFormat);

        return formatted;
    },
    /**

    @method address
    */
    'tokenAddress' : function(){
        if (this.address){
            return this.address;
        } else {
            return TemplateVar.get("tokenAddress");
        }
    }
});