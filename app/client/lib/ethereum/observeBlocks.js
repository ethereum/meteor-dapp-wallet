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
            

            _.each(Tokens.find().fetch(), function(token){
                tokenInstance = web3.eth.contract(tokenABI).at(token.address);

                if (token.address) {
                    var totalBalance = 0;
                    _.each(EthAccounts.find().fetch(), function(account){
                        var balance = Number(tokenInstance.balanceOf(account.address));

                        var  balanceID = Helpers.makeId('balance', token.address.substring(2,7) + account.address.substring(2,7));

                        if(balance>0){
                            Balances.upsert(balanceID, {$set: {
                                account: account.address,
                                token: token.address,
                                tokenBalance: balance
                            }});
                        }

                        totalBalance += balance;
                    })

                    if(token.totalBalance != totalBalance ){
                        var tokenID = Helpers.makeId('token', token.address);

                        Tokens.update(tokenID, {$set: {
                            totalBalance: totalBalance
                        }});
                    } 
                }               
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

    // get peercount on start
    web3.net.getPeerCount(function(e, res) {
        if(!e)
            Session.set('peerCount', res);
    });

};