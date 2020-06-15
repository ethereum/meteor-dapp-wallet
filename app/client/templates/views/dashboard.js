/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/

Template['views_dashboard'].helpers({
  /**
    Get all current wallets

    @method (wallets)
    */
  wallets: function() {
    var wallets = Wallets.find(
      { $or: [{ disabled: { $exists: false } }, { disabled: false }] },
      { sort: { creationBlock: 1 } }
    ).fetch();

    // sort wallets by balance
    wallets.sort(Helpers.sortByBalance);

    return wallets;
  },
  /**
    Get all current accounts

    @method (accounts)
    */
  accounts: function() {
    // balance need to be present, to show only full inserted accounts (not ones added by mist.requestAccount)
    var accounts = EthAccounts.find(
      { name: { $exists: true } },
      { sort: { name: 1 } }
    ).fetch();

    accounts.sort(Helpers.sortByBalance);

    return accounts;
  },
  /**
    Are there any accounts?

    @method (hasAccounts)
    */
  hasAccounts: function() {
    return EthAccounts.find().count() > 0;
  },
  /**
    Are there any accounts?

    @method (hasAccounts)
    */
  hasMinimumBalance: function() {
    var enoughBalance = false;
    _.each(_.pluck(EthAccounts.find({}).fetch(), 'balance'), function(bal) {
      if (bal && new BigNumber(bal, '10').gt(1000000000000000))
        enoughBalance = true;
    });

    return enoughBalance;
  },
  /**
    Get all transactions

    @method (allTransactions)
    */
  allTransactions: function() {
    return Transactions.find({}, { sort: { timestamp: -1 } }).count();
  },
  /**
    Returns an array of pending confirmations, from all accounts

    @method (pendingConfirmations)
    @return {Array}
    */
  pendingConfirmations: function() {
    return _.pluck(
      PendingConfirmations.find({
        operation: { $exists: true },
        confirmedOwners: { $ne: [] }
      }).fetch(),
      '_id'
    );
  }
});

var insertAccounts = function(accounts) {
  accounts.forEach(function(account) {
    account = account.toLowerCase();
    EthAccounts.upsert(
      { address: account },
      {
        $set: {
          address: account,
          new: true
        }
      }
    );
  });
};

Template['views_dashboard'].events({
  /**
    Request to create an account in mist

    @event click .create.account
    */
  'click .create.account': async function(e) {
    e.preventDefault();

    if (typeof mist !== 'undefined') {
      mist.requestAccount(function(e, accounts) {
        if (!e) {
          if (!_.isArray(accounts)) {
            accounts = [accounts];
          }
          insertAccounts(accounts);
        }
      });

      // we assume meta mask is present
    } else {
      if (typeof ethereum != 'undefined') {
        let accounts = await ethereum.enable();
        // old meta mask way
        if (Array.isArray(accounts) && accounts.length > 0) {
          insertAccounts(accounts);
        } else {
          try {
            accounts = await ethereum.send('eth_requestAccounts');
          } catch (e) {}
          if (Array.isArray(accounts) && accounts.length > 0) {
            insertAccounts(accounts);
          } else {
            const web3 = new Web3(ethereum);
            accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
              insertAccounts(accounts);
            } else {
              alert(
                'No accounts found! Is your browser wallet unlocked?\n\nUnlock your Browser-Wallet and reload the page.'
              );
            }
          }
        }
      }
    }
  }
});
