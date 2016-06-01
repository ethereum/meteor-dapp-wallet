/**
The template show the token in the .wallet-box

@class [template] elements_tokenBox
@constructor
*/

Template['elements_tokenBox'].helpers({
    /**
    Formats the total balance

    @method (formattedTotalBalance)
    */
    'formattedTotalBalance': function(e){
        var balance = _.reduce(this.balances, function(memo, bal){
            return memo.plus(new BigNumber(bal, 10));
        }, new BigNumber(0));
        return Helpers.formatNumberByDecimals(balance, this.decimals);
    },
    /**
    Generates the geo pattern for the background

    @method (geoPattern)
    */
    'geoPattern' : function(){
        var pattern = GeoPattern.generate(this.address, {color: '#CCC6C6'});
        return pattern.toDataUrl();
    }
})



Template['elements_tokenBox'].events({
    /**
    Click Delete Token
    
    @event click a.create.account
    */
    'click .delete-token': function(e){
        var token = this;
        e.preventDefault();
        e.stopImmediatePropagation();

        EthElements.Modal.question({
            text: new Spacebars.SafeString(TAPi18n.__('wallet.tokens.deleteToken', {token: token.name})),
            ok: function(){
                Tokens.remove(token._id);
            },
            cancel: true
        });

    }
})
