
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

    EthAccounts.init();
    EthBlocks.init();


    EthBlocks.detectFork(function(oldBlock, block){
        console.log('FORK detected from Block #'+ oldBlock.number + ' -> #'+ block.number +', rolling back!');
        
        // Go through all accounts and re-run
        _.each(Wallets.find({}).fetch(), function(wallet){
            // REMOVE ADDRESS for YOUNG ACCOUNTS, so that it tries to get the Created event and correct address again
            if(wallet.creationBlock + ethereumConfig.requiredConfirmations >= block.number)
                delete wallet.address;

            setupContractFilters(wallet);
        });
    });


    observeWallets();

    observeTransactions();

    observePendingConfirmations();

};


