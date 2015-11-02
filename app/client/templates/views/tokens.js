/**
The template to list all token

@class [template] views_tokens
@constructor
*/

var addToken = function(e) {

    var address = $('.modals-add-token input[name="address"]').hasClass('dapp-error') ? 
            '' : $('.modals-add-token input[name="address"]').val(),
        name = $('.modals-add-token input.name').val(),
        symbol = $('.modals-add-token input.symbol').val(),
        decimals = $('.modals-add-token input.decimals').val();


    tokenId = Helpers.makeId('token', address);

    var msg = (Tokens.findOne(tokenId)!=undefined)? 
        TAPi18n.__('wallet.tokens.editedToken', {token: name}) : 
        TAPi18n.__('wallet.tokens.addedToken', {token: name}) ;

    if(address != '') {
        Tokens.upsert(tokenId, {$set: {
            address: address,
            name: name,
            symbol: symbol,
            decimals: Number(decimals || 0)
        }});

        // update balances from lib/ethereum/observeBlocks.js
        updateBalances();

        GlobalNotification.success({
           content: msg,
           duration: 2
        });
    } else {
       GlobalNotification.warning({
           content: TAPi18n.__('wallet.tokens.invalidAddress'),
           duration: 2
        }); 
    }
    
}

Template['views_tokens'].helpers({
    /**
    Get all tokens

    @method (tokens)
    */
    'tokens': function(){
        return Tokens.find({}, {sort:{symbol:1}});
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
            ok: addToken,
            cancel: true
        },{
            class: 'modals-add-token'
        });
    },
    /**
    Edit Token
    
    @event click .wallet-box.tokens
    */
    'click .wallet-box.tokens': function(e){
        e.preventDefault();

        // Open a modal 
        EthElements.Modal.question({
            template: 'views_modals_addToken',
            data: this,
            ok: addToken.bind(this),
            cancel: true
        },{
            class: 'modals-add-token'
        });

    }
})
