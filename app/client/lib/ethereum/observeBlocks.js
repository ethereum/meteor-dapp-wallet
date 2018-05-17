var peerCountIntervalId = null;

/**
Update the peercount

@method getPeerCount
*/
var getPeerCount = function() {
  web3.eth.net.getPeerCount().then(function(peerCount) {
    Session.set('peerCount', peerCount);
  });
};

/**
Update wallet balances

@method updateBalances
*/
updateBalances = function() {
  // UPDATE ALL BALANCES (incl. Tokens)
  var walletsAndContracts = Wallets.find()
    .fetch()
    .concat(CustomContracts.find().fetch());

  var allAccounts = EthAccounts.find()
    .fetch()
    .concat(walletsAndContracts);

  // go through all existing accounts, for each token
  _.each(walletsAndContracts, function(account) {
    if (account.address) {
      web3.eth.getBalance(account.address, function(err, res) {
        if (!err) {
          // is of type wallet
          if (account.creationBlock) {
            Wallets.update(account._id, {
              $set: {
                balance: res.toString(10)
              }
            });
          } else {
            CustomContracts.update(account._id, {
              $set: {
                balance: res.toString(10)
              }
            });
          }
        }
      });

      // update dailylimit spent, etc, if wallet type
      if (account.creationBlock) {
        Meteor.setTimeout(function() {
          updateContractData(account);
        }, 1000);
      }
    }
  });

  // WALLETS STUCK IN CREATE STATE
  // issue found when using the light client mode on Mist 0.9.1 and 0.9.2
  var creatingWallets = Wallets.find({
    transactionHash: { $exists: true },
    address: { $exists: false }
  }).fetch();

  _.each(creatingWallets, function(wallet) {
    // Fetches transactionReceipt looking for contractAddress
    web3.eth
      .getTransactionReceipt(wallet.transactionHash)
      .then(function(receipt) {
        if (receipt && receipt.contractAddress !== null) {
          // Updates the wallet
          var r = Wallets.update(wallet._id, {
            $set: {
              address: receipt.contractAddress
            }
          });
        }
        return null;
      });
  });

  // UPDATE ENS
  _.each(allAccounts, function(account) {
    // Only check ENS names every N minutes
    var now = Date.now();
    if (
      !account.ensCheck ||
      (account.ensCheck && now - account.ensCheck > 10 * 60 * 1000)
    ) {
      Helpers.getENSName(account.address, function(err, name, returnedAddr) {
        if (!err && account.address.toLowerCase() == returnedAddr) {
          EthAccounts.update(
            { address: account.address },
            { $set: { name: name, ens: true, ensCheck: now } }
          );
          CustomContracts.update(
            { address: account.address },
            { $set: { name: name, ens: true, ensCheck: now } }
          );
          Wallets.update(
            { address: account.address },
            { $set: { name: name, ens: true, ensCheck: now } }
          );
        } else {
          EthAccounts.update(
            { address: account.address },
            { $set: { ens: false, ensCheck: now } }
          );
          CustomContracts.update(
            { address: account.address },
            { $set: { ens: false, ensCheck: now } }
          );
          Wallets.update(
            { address: account.address },
            { $set: { ens: false, ensCheck: now } }
          );
        }
      });
    }
  });

  // UPDATE TOKEN BALANCES
  _.each(Tokens.find().fetch(), function(token) {
    if (!token.address) return;

    var tokenInstance = Object.assign({}, TokenContract);
    tokenInstance.options.address = token.address;

    _.each(allAccounts, function(account) {
      tokenInstance.methods
        .balanceOf(account.address)
        .call()
        .then(function(balance) {
          var currentBalance =
            token && token.balances ? token.balances[account._id] : 0;

          if (balance.toString(10) !== currentBalance) {
            var set = {};
            if (balance > 0) {
              set['balances.' + account._id] = balance.toString(10);
              Tokens.update(token._id, { $set: set });
            } else if (currentBalance) {
              set['balances.' + account._id] = '';
              Tokens.update(token._id, { $unset: set });
            }
          }
          return null;
        });
    });
  });
};

/**
Observe the latest blocks

@method observeLatestBlocks
*/
observeLatestBlocks = function() {
  // update balances on start
  updateBalances();

  // GET the latest blockchain information
  web3.eth.subscribe('newBlockHeaders', function(e, res) {
    if (!e) {
      updateBalances();
    }
  });

  // check peer count
  Session.setDefault('peerCount', 0);
  getPeerCount();

  clearInterval(peerCountIntervalId);
  peerCountIntervalId = setInterval(function() {
    getPeerCount();
  }, 1000);
};
