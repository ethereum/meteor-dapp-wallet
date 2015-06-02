
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
    rollBackBy: 1000,
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

@method connectNode
*/
connectNode = function(){

    console.log('Connect to node...');

    // set providor
    web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545")); //8545 8080 10.10.42.116


    // ADD normal accounts
    _.each(web3.eth.accounts, function(item){
        if(!_.contains(_.pluck(Accounts.find().fetch(), 'address'), item))
            Accounts.insert({
                type: 'account',
                address: item,
                balance: web3.eth.getBalance(item).toString(10),
                name: (item === web3.eth.coinbase) ? 'Coinbase' : item
            });
    });

    observeLatestBlocks();

    observeAccounts();

    observeTransactions();

    observePendingConfirmations();

};


