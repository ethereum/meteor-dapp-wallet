/**
Template Controllers

@module Templates
*/

/**
The contracts template

@class [template] views_contracts
@constructor
*/

/**
Function to add a new custom contract

@method addCustomContract
*/
var addCustomContract = function(e) {
  var address = $('.modals-add-custom-contract input[name="address"]').hasClass(
      'dapp-error'
    )
      ? ''
      : $('.modals-add-custom-contract input[name="address"]').val(),
    name =
      $('.modals-add-custom-contract input.name').val() ||
      TAPi18n.__('wallet.accounts.defaultName');

  address = address.toLowerCase();

  try {
    jsonInterface = JSON.parse(
      $('.modals-add-custom-contract textarea.jsonInterface').val()
    );
  } catch (e) {
    GlobalNotification.warning({
      content: TAPi18n.__('wallet.contracts.error.jsonInterfaceParseError'),
      duration: 2
    });

    return false;
  }

  if (web3.utils.isAddress(address)) {
    // chech if contract already exists as wallet contract
    if (Wallets.findOne({ address: address })) {
      GlobalNotification.warning({
        content: TAPi18n.__('wallet.newWallet.error.alreadyExists'),
        duration: 2
      });

      return false;
    }

    CustomContracts.upsert(
      { address: address },
      {
        $set: {
          address: address,
          name: name,
          jsonInterface: jsonInterface
        }
      }
    );

    // update balances from lib/ethereum/observeBlocks.js
    updateBalances();

    GlobalNotification.success({
      content: TAPi18n.__('wallet.contracts.addedContract'),
      duration: 2
    });
  } else {
    GlobalNotification.warning({
      content: TAPi18n.__('wallet.contracts.error.invalidAddress'),
      duration: 2
    });
  }
};

/**
Function to add tokens

@method addToken
*/
var addToken = function(e) {
  var address = $('.modals-add-token input[name="address"]').hasClass(
      'dapp-error'
    )
      ? ''
      : $('.modals-add-token input[name="address"]').val(),
    name = $('.modals-add-token input.name').val(),
    symbol = $('.modals-add-token input.symbol').val(),
    decimals = $('.modals-add-token input.decimals').val();

  address = address.toLowerCase().trim();

  tokenId = Helpers.makeId('token', address);

  var msg =
    Tokens.findOne(tokenId) != undefined
      ? TAPi18n.__('wallet.tokens.editedToken', { token: name })
      : TAPi18n.__('wallet.tokens.addedToken', { token: name });

  if (web3.utils.isAddress(address)) {
    Tokens.upsert(tokenId, {
      $set: {
        address: address,
        name: name,
        symbol: symbol,
        balances: {},
        decimals: Number(decimals || 0)
      }
    });

    // update balances from lib/ethereum/observeBlocks.js
    updateBalances();

    GlobalNotification.success({
      content: msg,
      duration: 2
    });
  } else {
    GlobalNotification.warning({
      content: TAPi18n.__('wallet.tokens.error.invalidAddress'),
      duration: 2
    });
  }
};

/**
Function to auto-scan for popular tokens on all accounts

@method autoScanGetTokens
*/
var autoScanGetTokens = function(template) {
  return new Promise(function(resolve, reject) {
    TemplateVar.set(
      template,
      'autoScanStatus',
      TAPi18n.__('wallet.tokens.autoScan.status.downloadingList')
    );

    var tokenListURL =
      'https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/dist/tokens/eth/tokens-eth.json';

    const accounts = _.pluck(
      EthAccounts.find()
        .fetch()
        .concat(CustomContracts.find().fetch())
        .concat(Wallets.find().fetch()),
      'address'
    );

    const tokensToAdd = [];
    const promises = [];
    let balancesChecked = 0;

    const alreadySubscribed = _.pluck(Tokens.find().fetch(), 'address');

    HTTP.get(tokenListURL, function(error, result) {
      let tokens;

      try {
        tokens = JSON.parse(result.content);
      } catch (error) {
        const errorString = 'Error parsing token list: ' + error;
        console.error(errorString);
        TemplateVar.set(template, 'autoScanStatus', errorString);
        reject(errorString);
        return;
      }

      const numberOfBalancesToCheck = tokens.length * accounts.length;
      TemplateVar.set(
        template,
        'autoScanStatus',
        TAPi18n.__('wallet.tokens.autoScan.status.checkingBalances', {
          number: numberOfBalancesToCheck
        })
      );

      Tracker.flush();
      Meteor.defer(function() {
        // defer to wait for autoScanStatus to update in UI first
        _.each(tokens, function(token) {
          if (alreadySubscribed.includes(token.address)) {
            console.log('Already subscribed to ' + token.name);
            return;
          }

          _.each(accounts, function(account) {
            const callData =
              '0x70a08231000000000000000000000000' +
              account.substring(2).replace(' ', ''); // balanceOf(address)
            try {
              const promise = web3.eth
                .call({
                  to: token.address.replace(' ', ''),
                  data: callData
                })
                .then(function(result) {
                  const tokenAmt = web3.utils.toBN(result);
                  const tokenAmtInEther = web3.utils.fromWei(tokenAmt, 'ether');

                  if (!tokenAmt.isZero()) {
                    console.log(
                      token.name +
                        ' (' +
                        token.symbol +
                        ') balance for ' +
                        account +
                        ': ' +
                        tokenAmtInEther
                    );

                    tokensToAdd.push(token);

                    tokenId = Helpers.makeId('token', token.address);
                    Tokens.upsert(tokenId, {
                      $set: {
                        address: token.address,
                        name: token.name,
                        symbol: token.symbol,
                        balances: {},
                        decimals: Number(token.decimals || 0)
                      }
                    });

                    TemplateVar.set(template, 'tokens', tokensToAdd);
                  }

                  balancesChecked++;

                  let statusString = TAPi18n.__(
                    'wallet.tokens.autoScan.status.checkingBalances',
                    {
                      number:
                        numberOfBalancesToCheck -
                        balancesChecked -
                        alreadySubscribed.length
                    }
                  );

                  if (tokensToAdd.length > 0) {
                    statusString += ' (';
                    statusString += TAPi18n.__(
                      'wallet.tokens.autoScan.status.found',
                      {
                        number: tokensToAdd.length
                      }
                    );
                    statusString += ')';
                  }

                  TemplateVar.set(template, 'autoScanStatus', statusString);

                  return null;
                })
                .catch(function(error) {
                  console.error(error);
                });
              promises.push(promise);
            } catch (error) {
              const errorString = 'Error trying to web3.eth.call: ' + error;
              console.error(errorString);
              TemplateVar.set(template, 'autoScanStatus', errorString);
            }
          });
        });

        Promise.all(promises)
          .then(function() {
            console.log('autoscan done');
            console.log(tokensToAdd);
            TemplateVar.set(template, 'autoScanStatus', null);
            resolve(tokensToAdd);
            return null;
          })
          .catch(function(error) {
            console.error(error);
            TemplateVar.set(template, 'autoScanStatus', error);
          });
      });
    });
  });
};

Template['views_contracts'].helpers({
  /**
    Get all custom contracts

    @method (customContracts)
    */
  customContracts: function() {
    return CustomContracts.find({}, { sort: { name: 1 } });
  },
  /**
    Get all tokens

    @method (tokens)
    */
  tokens: function() {
    return Tokens.find({}, { sort: { name: 1 } });
  },
  autoScanButtonIsDisabled: function() {
    if (TemplateVar.get('autoScanStatus')) {
      if (TemplateVar.get('autoScanStatus') === null) {
        return '';
      }

      if (TemplateVar.get('autoScanStatus').indexOf('Error') > -1) {
        return '';
      }

      return 'disabled';
    } else {
      return '';
    }
  }
});

Template['views_contracts'].onRendered(function() {
  TemplateVar.set('autoScanStatus', null);
});

Template['views_contracts'].events({
  /**
    Add custom contract

    @event click .add-contract
    */
  'click .add-contract': function() {
    // Open a modal
    EthElements.Modal.question(
      {
        template: 'views_modals_addCustomContract',
        ok: addCustomContract,
        cancel: true
      },
      {
        class: 'modals-add-custom-contract'
      }
    );
  },
  /**
    Click Add Token

    @event click a.create.add-token
    */
  'click .add-token': function(e) {
    e.preventDefault();

    // Open a modal
    EthElements.Modal.question(
      {
        template: 'views_modals_addToken',
        ok: addToken,
        cancel: true
      },
      {
        class: 'modals-add-token'
      }
    );
  },
  /**
    Click Token Auto Scan

    @event click a.create.token-auto-scan
    */
  'click .token-auto-scan': function(e, template) {
    autoScanGetTokens(template).then(function(tokens) {
      if (tokens.length === 0) {
        GlobalNotification.success({
          content: TAPi18n.__('wallet.tokens.autoScan.noTokensFound'),
          duration: 2
        });
        return null;
      }

      updateBalances();

      GlobalNotification.success({
        content: TAPi18n.__('wallet.tokens.addedToken', {
          token: tokens.length + ' tokens'
        }),
        duration: 2
      });

      return null;
    });
  },
  /**
    Edit Token

    @event click .wallet-box.tokens
    */
  'click .wallet-box.tokens': function(e) {
    e.preventDefault();

    // Open a modal
    EthElements.Modal.question(
      {
        template: 'views_modals_addToken',
        data: this,
        ok: addToken.bind(this),
        cancel: true
      },
      {
        class: 'modals-add-token'
      }
    );
  }
});
