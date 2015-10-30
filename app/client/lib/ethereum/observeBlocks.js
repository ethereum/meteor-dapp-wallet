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
    
    // UPDATE TOKEN BALANCES
    var walletsAndAccounts = EthAccounts.find().fetch().concat(Wallets.find().fetch());

    _.each(Tokens.find().fetch(), function(token){
        if(!token.address)
            return;


        var tokenInstance = TokenContract.at(token.address),
            totalBalance = new BigNumber(0);
        
        // go through all existing accounts, for each token
        _.each(walletsAndAccounts, function(account){
            tokenInstance.balanceOf(account.address, function(e, balance){
                if(!e && balance.toNumber() > 0){
                    var tokenID = Helpers.makeId('token', token.address),
                        set = {};

                    set['balances.'+ account._id] = balance.toString(10);

                    Tokens.update(tokenID, {$set: set});
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