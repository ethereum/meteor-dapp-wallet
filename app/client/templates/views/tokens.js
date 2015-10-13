Template['views_tokens'].helpers({
    /**
    Get all tokens

    @method (tokens)
    */
    'tokens': function(){
        return Tokens.find({},{sort:{symbol:1}});
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
    }

})

// Template['views_dashboard'].helpers({
//     /**
//     Get all current wallets

//     @method (wallets)
//     */
//     'wallets': function(){
//         return Wallets.find({}, {sort: {disabled: 1, creationBlock: 1}});
//     },

    // Transactions.upsert(txId, {$set: {
    //     value: amount,
    //     from: selectedAccount.address,
    //     to: to,
    //     timestamp: moment().unix(),
    //     transactionHash: txHash,
    //     gasPrice: gasPrice,
    //     gasUsed: estimatedGas,
    //     fee: String(gasPrice * estimatedGas),
    //     data: data
    // }});