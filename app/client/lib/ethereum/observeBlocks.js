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

    var walletsAndContracts = Wallets.find().fetch().concat(CustomContracts.find().fetch());

    // UPDATE WALLETS ACCOUNTS balance
    _.each(walletsAndContracts, function(wallet){
        if(wallet.address) {
            web3.eth.getBalance(wallet.address, function(err, res){
                if(!err) {
                    // is of type wallet
                    if(wallet.creationBlock) {
                        Wallets.update(wallet._id, {$set: {
                            balance: res.toString(10)
                        }});
                    } else {
                        CustomContracts.update(wallet._id, {$set: {
                            balance: res.toString(10)
                        }});
                    }
                }
            });

            // update dailylimit spent, etc, if wallet type
            if(wallet.creationBlock) {
                Meteor.setTimeout(function() {
                    updateContractData(wallet);
                }, 1000);
            }
        }
    });


    
    // UPDATE TOKEN BALANCES
    var walletsAndAccounts = EthAccounts.find().fetch().concat(Wallets.find().fetch(), CustomContracts.find().fetch());

    _.each(Tokens.find().fetch(), function(token){
        if(!token.address)
            return;


        var tokenInstance = TokenContract.at(token.address),
            totalBalance = new BigNumber(0);
        
        // go through all existing accounts, for each token
        _.each(walletsAndAccounts, function(account){
            tokenInstance.balanceOf(account.address, function(e, balance){
                var tokenID = Helpers.makeId('token', token.address);
                var currentBalance = Tokens.findOne(tokenID).balances ? Tokens.findOne(tokenID).balances[account._id] : 0;

                if(!e && balance.toString(10) !== currentBalance){
                    var set = {};
                    if (balance > 0) {
                        set['balances.'+ account._id] = balance.toString(10);
                        Tokens.update(tokenID, {$set: set});
                    } else if (currentBalance){
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