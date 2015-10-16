

var addToken = function(e) {

    var address = $('.modals-add-token input[name="address"]').val(),
        name = $('.modals-add-token input.name').val(),
        symbol = $('.modals-add-token input.symbol').val(),
        decimals = $('.modals-add-token input.decimals').val();


    tokenId = Helpers.makeId('token', address);

    console.log(tokenId);

    var msg = (Tokens.findOne(tokenId)!=undefined)? 
        TAPi18n.__('wallet.tokens.editedToken', {token: name}) : 
        TAPi18n.__('wallet.tokens.addedToken', {token: name}) ;

    Tokens.upsert(tokenId, {$set: {
        address: address,
        name: name,
        symbol: symbol,
        decimals: decimals
    }})

   return GlobalNotification.success({
       content: msg,
       duration: 2
   });
}

Template['views_tokens'].helpers({
    /**
    Get all tokens

    @method (tokens)
    */
    'tokens': function(){
        
        return Tokens.find({},{sort:{symbol:1}});
    },
    /**
    Get Balance of a Coin

    @method (getBalance)
    */
    'formattedTotalBalance': function(e){

        var tokenAddress = this.address;
        var balance = this.totalBalance / Math.pow(10, this.decimals);
   
        return Helpers.formatNumberDecimals(balance, this.decimals);
    },
    /**

    @method geoPattern
    */
    'geoPattern' : function(){
        var pattern = GeoPattern.generate(this.address, {color: '#CCC6C6'});
        return pattern.toDataUrl();
    }
})



Template['views_tokens'].events({
    /**
    Click Add Token
    
    @event click a.create.account
    */
    'click .add-token': function(e){
        e.preventDefault();

        // Open a modal 
        EthElements.Modal.question({
                    template: 'views_modals_addToken',
                    data: {
                        decimals: 2
                    },
                    ok: addToken,
                    cancel: true
                },{
                    class: 'modals-add-token'
                });
    },
    /**
    Click Delete Token
    
    @event click a.create.account
    */
    'click .delete-token': function(e){
        e.preventDefault();
        e.stopImmediatePropagation();

        
        var address = e.currentTarget.getAttribute('data')
        var tokenId = Helpers.makeId('token', address);


        EthElements.Modal.question({
            text: new Spacebars.SafeString(TAPi18n.__('wallet.tokens.deleteToken', {token: address.substring(2,10)})),
            ok: function(){
                console.log(tokenId);
                Tokens.remove(tokenId);
            },
            okText: "delete",
            cancel: true
        });

    },
    /**
    Click Token
    
    @event click .wallet-box.tokens
    */
    'click .wallet-box.tokens': function(e){
        e.preventDefault();

        var address = e.currentTarget.getAttribute('data')
        var tokenId = Helpers.makeId('token', address);


        token = Tokens.findOne(tokenId)        

       // Open a modal 
        EthElements.Modal.question({
                    template: 'views_modals_addToken',
                    data: {
                        address: address,
                        name: token.name,
                        symbol: token.symbol, 
                        decimals: token.decimals 
                    },
                    ok: addToken,
                    cancel: true
                },{
                    class: 'modals-add-token'
                });

        }

})
