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
        var numberFormat = '0,0.';

        for(i=0;i<this.decimals;i++){
            numberFormat += "0";
        }

        var formatted = this.symbol + " " + numeral(balance).format(numberFormat);

        return formatted;
    }
})



Template['views_tokens'].events({
    /**
    Submit form

    @event submit form
    */
    'submit form': function(e) {
        var address = document.querySelector('[name=address]').value,
            symbol = document.querySelector('.symbol').value,
            decimals = document.querySelector('.division').value; 

        tokenId = Helpers.makeId('token', address);

        Tokens.upsert(tokenId, {$set: {
            address: address,
            symbol: symbol,
            decimals: decimals
        }})

       return GlobalNotification.warning({
           content: symbol + ' has been added to your token lists',
           duration: 2
       });
    },
    /**
    Click Add Token
    
    @event click a.create.account
    */
    'click .add-token': function(e){
        e.preventDefault();
        
        var addToken = function(e) {
            var address = document.querySelector('[name=address]').value,
                symbol = document.querySelector('.symbol').value,
                division = document.querySelector('.division').value; 

            tokenId = Helpers.makeId('token', address);

            Tokens.upsert(tokenId, {$set: {
                address: address,
                symbol: symbol,
                division: division
            }})

           return GlobalNotification.warning({
               content: symbol + ' has been added to your token lists',
               duration: 2
           });
        }

        // Open a modal showing the QR Code
        EthElements.Modal.question({
                    template: 'views_modals_addToken',
                    ok: "addToken",
                    cancel: true
                },{
                    class: 'send-transaction-info'
                });
    },
    /**
    Click Delete Token
    
    @event click a.create.account
    */
    'click .delete-token': function(e){
        e.preventDefault();
        
        var address = e.currentTarget.getAttribute('data')
        var tokenId = Helpers.makeId('token', address);

        console.log(tokenId);

        EthElements.Modal.question({
            text: new Spacebars.SafeString(TAPi18n.__('wallet.tokens.deleteToken', {token: address.substring(2,10)})),
            ok: function(){
                console.log(tokenId);
                Tokens.remove(tokenId);
            },
            cancel: true
        });

        
        //$(e.currentTarget).data('value')
    }

})
