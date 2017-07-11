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
    // UPDATE TOKEN BALANCES
    var allWatchedAccounts = EthAccounts.find().fetch().concat(Wallets.find().fetch().concat(CustomContracts.find().fetch()));

    // go through all existing accounts, for each token
    _.each(allWatchedAccounts, function(account){

        if(account.address) {
            web3.eth.getBalance(account.address, function(err, res){
                if(!err) {
                    // is of type wallet
                    if(account.creationBlock) {
                        Wallets.update(account._id, {$set: {
                            balance: res.toString(10)
                        }});
                    } else {
                        EthAccounts.update(account._id, {$set: {
                            balance: res.toString(10)
                        }});
                        CustomContracts.update(account._id, {$set: {
                            balance: res.toString(10)
                        }});
                    }
                }
            });

            // update dailylimit spent, etc, if wallet type
            if(account.creationBlock) {
                Meteor.setTimeout(function() {
                    updateContractData(account);
                }, 1000);
            }
        }


        // Only check ENS names every N minutes
        if (!account.ensCheck || (account.ensCheck && Date.now() - account.ensCheck > 10*60*1000)) {
            Helpers.getENSName(account.address, function(err, name, returnedAddr) {
                if (!err && account.address.toLowerCase() == returnedAddr){
                    EthAccounts.update({address: account.address}, {$set:{ name: name, ens: true, ensCheck: Date.now()}});
                    CustomContracts.update({address: account.address}, {$set:{ name: name, ens: true, ensCheck: Date.now()}});
                    Wallets.update({address: account.address}, {$set:{ name: name, ens: true, ensCheck: Date.now()}});
                } else {
                    EthAccounts.update({address: account.address}, {$set:{ens: false, ensCheck: Date.now()}});
                    CustomContracts.update({address: account.address}, {$set:{ens: false, ensCheck: Date.now()}});
                    Wallets.update({address: account.address}, {$set:{ens: false, ensCheck: Date.now()}});

                }
            });
        }



        _.each(Tokens.find().fetch(), function(token){
            if(!token.address)
                return;

            var tokenInstance = TokenContract.at(token.address);

            tokenInstance.balanceOf(account.address, function(e, balance){
                var currentBalance = (token && token.balances) ? token.balances[account._id] : 0;

                if(!e && balance.toString(10) !== currentBalance){
                    var set = {};
                    if (balance > 0) {
                        set['balances.'+ account._id] = balance.toString(10);
                        Tokens.update(token._id, {$set: set});
                    } else if (currentBalance){
                        set['balances.'+ account._id] = '';
                        Tokens.update(token._id, {$unset: set});
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
    console.log('observeLatestBlocks');

    // update balances on start
    updateBalances();

    // If watching blocks is not working..
    var interval = setInterval(updateBalances, 15000);

    // GET the latest blockchain information
    web3.eth.filter('latest').watch(function(e, res){
        console.log('NEW BLOCK', e, res);

        clearInterval(interval);

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