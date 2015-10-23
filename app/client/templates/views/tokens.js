/**
The template to list all token

@class [template] views_tokens
@constructor
*/

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
        decimals: decimals,
        totalBalance: this.totalBalance || 0
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
        
        return Tokens.find({}, {sort:{symbol:1}});
    },
    /**
    Get Balance of a Coin

    @method (formattedTotalBalance)
    */
    'formattedTotalBalance': function(e){

        // var balance = new BigNumber(this.totalBalance, 10).dividedBy(Math.pow(10, this.decimals));
        // console.log(balance.toString(10));
        // console.log(new BigNumber(this.totalBalance, 10).toString(10));

        // return EthTools.formatNumber(this.totalBalance, '0,0.00');
        return Helpers.formatNumberByDecimals(this.totalBalance, this.decimals);
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
        var token = Tokens.findOne(tokenId);

        EthElements.Modal.question({
            text: new Spacebars.SafeString(TAPi18n.__('wallet.tokens.deleteToken', {token: token.name})),
            ok: function(){
                Tokens.remove(tokenId);
            },
            cancel: true
        });

    },
    /**
    Edit Token
    
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
            ok: addToken.bind(this),
            cancel: true
        },{
            class: 'modals-add-token'
        });

        }

})
