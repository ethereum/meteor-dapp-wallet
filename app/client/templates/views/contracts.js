/**
Template Controllers

@module Templates
*/

/**
The contracts template

@class [template] views_contracts
@constructor
*/


/**
Function to add a new custom contract

@method addCustomContract
*/
var addCustomContract = function(e) {

    var address = $('.modals-add-custom-contract input[name="address"]').hasClass('dapp-error')
            ? ''
            : $('.modals-add-custom-contract input[name="address"]').val(),
        name = $('.modals-add-custom-contract input.name').val() || TAPi18n.__('wallet.accounts.defaultName');

    address = address.toLowerCase();


    try {
        jsonInterface = JSON.parse($('.modals-add-custom-contract textarea.jsonInterface').val());
    } catch(e) {
        GlobalNotification.warning({
           content: TAPi18n.__('wallet.contracts.error.jsonInterfaceParseError'),
           duration: 2
        });

        return false;
    }

    if(web3.isAddress(address)) {
        // chech if contract already exists as wallet contract
        if(Wallets.findOne({address: address})) {
            GlobalNotification.warning({
            content: TAPi18n.__('wallet.newWallet.error.alreadyExists'),
            duration: 2
            });

            return false;
        }

        CustomContracts.upsert({address: address}, {$set: {
            address: address,
            name: name,
            jsonInterface: jsonInterface
        }});

        // update balances from lib/ethereum/observeBlocks.js
        updateBalances();

        GlobalNotification.success({
           content: TAPi18n.__('wallet.contracts.addedContract'),
           duration: 2
        });
    } else {
        GlobalNotification.warning({
           content: TAPi18n.__('wallet.contracts.error.invalidAddress'),
           duration: 2
        }); 
    }
    
}

/**
Function to add tokens

@method addToken
*/
var addToken = function(e) {

    var address = $('.modals-add-token input[name="address"]').hasClass('dapp-error') ? 
            '' : $('.modals-add-token input[name="address"]').val(),
        name = $('.modals-add-token input.name').val(),
        symbol = $('.modals-add-token input.symbol').val(),
        decimals = $('.modals-add-token input.decimals').val();

    address = address.toLowerCase().trim();

    tokenId = Helpers.makeId('token', address);

    var msg = (Tokens.findOne(tokenId)!=undefined)? 
        TAPi18n.__('wallet.tokens.editedToken', {token: name}) : 
        TAPi18n.__('wallet.tokens.addedToken', {token: name}) ;

    if(web3.isAddress(address)) {
        Tokens.upsert(tokenId, {$set: {
            address: address,
            name: name,
            symbol: symbol,
            balances: {},
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
           content: TAPi18n.__('wallet.tokens.error.invalidAddress'),
           duration: 2
        }); 
    }
    
}


Template['views_contracts'].helpers({
    /**
    Get all custom contracts

    @method (customContracts)
    */
    'customContracts': function(){
        return CustomContracts.find({}, {sort:{symbol:1}});
    }, 
    /**
    Get all tokens

    @method (tokens)
    */
    'tokens': function(){
        return Tokens.find({}, {sort:{symbol:1}});
    }
});


Template['views_contracts'].events({
    /**
    Add custom contract
    
    @event click .add-contract
    */
    'click .add-contract': function(){

        // Open a modal 
        EthElements.Modal.question({
            template: 'views_modals_addCustomContract',
            ok: addCustomContract,
            cancel: true
        },{
            class: 'modals-add-custom-contract'
        });
    }, 
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
});