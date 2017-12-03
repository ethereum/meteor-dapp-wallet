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
        // Get wallets and accounts, but not contracts
        var walletsAndAccounts = _.map(Wallets.find().fetch().concat(EthAccounts.find().fetch()), function(account){  
                if(!account.disabled) return account._id; 
            });
        // check the total balance of these accounts only
        var totalBalance = new BigNumber(0);
        _.each(this.balances, function(balance, id){
            if (walletsAndAccounts.indexOf(id) >= 0)
                totalBalance = totalBalance.plus(new BigNumber(balance, 10));
        })

        return Helpers.formatNumberByDecimals(totalBalance, this.decimals);
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
            text: new Spacebars.SafeString(TAPi18n.__('wallet.tokens.deleteToken', {token: token.name})), // could be vulnerable as token name is not HTML purified
            ok: function(){
                Tokens.remove(token._id);
            },
            cancel: true
        });

    }
})
