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
Contains all collection observers

@property collectionObservers
*/
collectionObservers = [];

/**
Config for the ethereum connector

@property config
*/
ethereumConfig = {
  /**
    Number of blocks to rollback, from the last checkpoint block of the wallet.

    @property ethereumConfig.rollBackBy
    */
  rollBackBy: 0,
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
Check and set which network we are on.

@method checkNetwork
*/
Session.setDefault('network', false);
var checkNetwork = function() {
  web3.eth.getBlock(0).then(function(block) {
    switch (block.hash) {
      case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
        Session.set('network', 'main');
        break;
      case '0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177':
        Session.set('network', 'rinkeby');
        break;
      case '0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d':
        Session.set('network', 'ropsten');
        break;
      case '0xa3c565fc15c7478862d50ccd6561e3c06b24cc509bf388941c25ea985ce32cb9':
        Session.set('network', 'kovan');
        break;
      default:
        Session.set('network', 'private');
    }
  });
};

/**
Connects to a node and setup all the subscriptions for the accounts.

@method connectToNode
*/
connectToNode = function() {
  console.time('startNode');
  console.log('Connect to node...');

  checkNetwork();

  EthAccounts.init();
  EthBlocks.init();

  EthTools.ticker.start({
    extraParams: typeof mist !== 'undefined' ? 'Mist-' + mist.version : '',
    currencies: ['BTC', 'USD', 'EUR', 'BRL', 'GBP']
  });

  if (EthAccounts.find().count() > 0) {
    checkForOriginalWallet();
  }

  // EthBlocks.detectFork(function(oldBlock, block){
  //     console.log('FORK detected from Block #'+ oldBlock.number + ' -> #'+ block.number +', rolling back!');

  //     // Go through all accounts and re-run
  //     _.each(Wallets.find({}).fetch(), function(wallet){
  //         // REMOVE ADDRESS for YOUNG ACCOUNTS, so that it tries to get the Created event and correct address again
  //         if(wallet.creationBlock + ethereumConfig.requiredConfirmations >= block.number)
  //             delete wallet.address;

  //         setupContractSubscription(wallet);
  //     });
  // });

  // Reset collection observers
  _.each(collectionObservers, function(observer) {
    if (observer) {
      observer.stop();
    }
  });
  collectionObservers = [];

  observeLatestBlocks();

  observeWallets();

  observeTransactions();

  observeEvents();

  observeTokens();

  observePendingConfirmations();

  observeCustomContracts();

  console.timeEnd('startNode');
};

/**
Will remove all transactions, and will set the checkpointBlock to the creationBlock in the wallets

@method connectToNode
*/
resetWallet = function function_name(argument) {
  _.each(Transactions.find().fetch(), function(tx) {
    console.log(tx._id);
    try {
      Transactions.remove(tx._id);
    } catch (e) {
      console.error(e);
    }
  });

  _.each(PendingConfirmations.find().fetch(), function(pc) {
    try {
      PendingConfirmations.remove(pc._id);
    } catch (e) {
      console.error(e);
    }
  });

  _.each(Wallets.find().fetch(), function(wallet) {
    Wallets.update(wallet._id, {
      $set: {
        checkpointBlock: wallet.creationBlock,
        transactions: []
      }
    });
  });

  web3.eth.clearSubscriptions();

  console.log('The wallet will re-fetch log information in 6 seconds...');

  setTimeout(function() {
    console.log('Fetching logs...');
    connectToNode();
  }, 1000 * 6);
};
