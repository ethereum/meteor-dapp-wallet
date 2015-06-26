
/**
The walletConnector

@class walletConnector
@constructor
*/

/**
Contains all wallet contracts

@property contracts
*/
contracts = {};


/**
Config for the ethereum connector

@property config
*/
ethereumConfig = {
    /**
    Number of blocks to rollback, from the last stable point.

    @property ethereumConfig.rollBackBy
    */
    rollBackBy: 500,
    /**
    Number of blocks to confirm a wallet

    @property ethereumConfig.requiredConfirmations
    */
    requiredConfirmations: 12,
    /**
    The default daily limit used for simple accounts

    @property ethereumConfig.dailyLimitDefault
    */
    dailyLimitDefault: '100000000000000000000000000'
};


/**
Connects to a node and setup all the filters for the accounts.

@method connectToNode
*/
connectToNode = function(){

    console.log('Connect to node...');


    // UPDATE normal accounts
    web3.eth.getAccounts(function(e, accounts){
        _.each(Accounts.find({type: 'account'}).fetch(), function(account){
            if(!_.contains(accounts, account.address)) {
                Accounts.remove(account._id);
            } else {
                web3.eth.getBalance(account.address, function(e, balance){
                    if(!e) {
                        Accounts.update(account._id, {$set: {
                            balance: balance.toString(10)
                        }});
                    }
                });
            }

            accounts = _.without(accounts, account.address);
        });
        // ADD missing accounts
        _.each(accounts, function(address){
            web3.eth.getBalance(address, function(e, balance){
                if(!e) {
                    Accounts.insert({
                        type: 'account',
                        address: address,
                        balance: balance.toString(10),
                        name: (address === web3.eth.coinbase) ? 'Coinbase' : address
                    });
                }
            });
        });
    });


    observeLatestBlocks();

    observeAccounts();

    observeTransactions();

    observePendingConfirmations();

};


