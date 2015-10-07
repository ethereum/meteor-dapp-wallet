var peerCountIntervalId = null;

/**
Observe the latest blocks

@method observeLatestBlocks
*/
observeLatestBlocks = function(){

    // GET the latest blockchain information
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {

            console.log('Block arrived ', res);

            // UPDATE WALLETS ACCOUNTS balance
            _.each(Wallets.find().fetch(), function(wallet){
                if(wallet.address) {
                    web3.eth.getBalance(wallet.address, function(err, res){
                        if(!err) {
                            Wallets.update(wallet._id, {$set: {
                                balance: res.toString(10)
                            }});
                        }
                    });

                    // update dailylimit spent, etc
                    Meteor.setTimeout(function() {
                        updateContractData(wallet);
                    }, 1000);
                }
            });

            _.each(EthAccounts.find().fetch(), function(account){
              _.each(Tokens.find().fetch(), function(token){
                
                tokenInstance = web3.eth.contract(tokenABI).at(token.address);
        
                var balance = Number(tokenInstance.coinBalanceOf(account.address));

                    console.log(balance);
                    if(balance>0){
                        // EthAccounts.update(account._id, {$set: {
                        //     tokenBalance: balance 
                        // }})
                        Balances.upsert(account._id, {$set: {
                            account: account.address,
                            token: token.address,
                            tokenBalance: balance
                        }});
                    }
              })  
            });
        }
    });


    // check peer count
    Session.setDefault('peerCount', 0);
    clearInterval(peerCountIntervalId);
    peerCountIntervalId = setInterval(function() {
        web3.net.getPeerCount(function(e, res) {
            if(!e)
                Session.set('peerCount', res);
        });
    }, 1000);

};