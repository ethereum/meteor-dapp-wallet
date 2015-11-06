var peerCountIntervalId = null;

/**
Update the peercount

@method getPeerCount
*/
var getPeerCount = function() {
    web3.net.getPeerCount(function(e, res) {
        if(!e)
            Session.set('peerCount', res);
    });
};


/**
Update wallet balances

@method updateBalances
*/
updateBalances = function() {

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

    // UPDATE WATCHED ACCOUNTS balance
    _.each(WatchedAddresses.find().fetch(), function(watchedAdress){
        if(watchedAdress.address) {
            web3.eth.getBalance(watchedAdress.address, function(err, res){
                if(!err) {
                    WatchedAddresses.update(watchedAdress._id, {$set: {
                        balance: res.toString(10)
                    }});
                }
            });

            // update dailylimit spent, etc
            Meteor.setTimeout(function() {
                updateContractData(watchedAdress);
            }, 1000);
        }
    });


    
    // UPDATE TOKEN BALANCES
    var walletsAndAccounts = EthAccounts.find().fetch().concat(Wallets.find().fetch(), WatchedAddresses.find().fetch());

    _.each(Tokens.find().fetch(), function(token){
        if(!token.address)
            return;


        var tokenInstance = TokenContract.at(token.address),
            totalBalance = new BigNumber(0);
        
        // go through all existing accounts, for each token
        _.each(walletsAndAccounts, function(account){
            tokenInstance.balanceOf(account.address, function(e, balance){
                var tokenID = Helpers.makeId('token', token.address);
                var currentBalance = Number(Tokens.findOne(tokenID).balances[account._id]);
                if(!e && balance.toNumber() != currentBalance){
                    var set = {};

                    if (currentBalance) {
                        set['balances.'+ account._id] = balance.toString(10);
                        Tokens.update(tokenID, {$set: set});
                        console.log("set balance");
                    } else {
                        set['balances.'+ account._id] = '';
                        Tokens.update(tokenID, {$unset: set});
                    }
                    
                }
            });
        });
    });
};


/**
Observe the latest blocks

@method observeLatestBlocks
*/
observeLatestBlocks = function(){

    // update balances on start 
    updateBalances();

    // GET the latest blockchain information
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {
            // console.log('Block arrived ', res);
            updateBalances();
        }
    });


    // check peer count
    Session.setDefault('peerCount', 0);
    getPeerCount();

    clearInterval(peerCountIntervalId);
    peerCountIntervalId = setInterval(function() {
        getPeerCount()
    }, 1000);
};