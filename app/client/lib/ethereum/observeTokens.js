var tokenContracts = {};

/**
Creates subscription for a wallet contract, to watch for deposits, pending confirmations, or contract creation events.

@method setupContractSubscription
@param {Object} newDocument
@param {Boolean} checkFromCreationBlock
*/
var setupContractSubscription = function(newDocument) {
  var contractInstance = (tokenContracts[
    'ct_' + newDocument._id
  ] = Object.assign({}, TokenContract));
  contractInstance.options.address = newDocument.address;
  contractInstance.address = newDocument.address;

  if (!contractInstance) return;

  var blockToCheckBack =
    (newDocument.checkpointBlock || 0) - ethereumConfig.rollBackBy;

  if (blockToCheckBack < 0) {
    blockToCheckBack = 0;
  }

  if (!contractInstance.tokenEvents) contractInstance.tokenEvents = [];

  var events = contractInstance.tokenEvents;

  // delete old events
  _.each(
    Transactions.find({
      tokenId: newDocument._id,
      blockNumber: { $exists: true, $gt: blockToCheckBack }
    }).fetch(),
    function(tx) {
      if (tx) Transactions.remove({ _id: tx._id });
    }
  );

  Helpers.eventLogs(
    'Checking Token Transfers for ' +
      newDocument.address +
      ' (_id: ' +
      newDocument._id +
      ') from block #',
    blockToCheckBack
  );

  var subscription = contractInstance.events.allEvents({
    fromBlock: blockToCheckBack,
    toBlock: 'latest'
  });

  events.push(subscription);

  // get past logs, to set the new blockNumber
  var currentBlock = EthBlocks.latest.number;

  // For some reason, sometimes this contractInstance doesn't
  // have a getPastEvents property so we'll reinit the contract
  var thisContractInstance = contractInstance;
  if (!thisContractInstance.getPastEvents) {
    thisContractInstance = new web3.eth.Contract(
      contractInstance.options.jsonInterface,
      contractInstance.options.address
    );
  }

  thisContractInstance.getPastEvents(
    'allEvents',
    { fromBlock: blockToCheckBack },
    function(error, logs) {
      if (!error) {
        // update last checkpoint block
        Tokens.update(
          { _id: newDocument._id },
          {
            $set: {
              checkpointBlock:
                (currentBlock || EthBlocks.latest.number) -
                ethereumConfig.rollBackBy
            }
          }
        );
      }
    }
  );

  subscription.on('data', function(log) {
    // Helpers.eventLogs(log);

    if (EthBlocks.latest.number && log.blockNumber > EthBlocks.latest.number) {
      // update last checkpoint block
      Tokens.update(
        { _id: newDocument._id },
        {
          $set: {
            checkpointBlock: log.blockNumber
          }
        }
      );
    }

    if (
      log.event === 'Transfer' &&
      (Helpers.getAccountByAddress(log.returnValues.from) ||
        Helpers.getAccountByAddress(log.returnValues.to))
    ) {
      Helpers.eventLogs(
        'Transfer for ' +
          newDocument.address +
          ' arrived in block: #' +
          log.blockNumber,
        Number(log.returnValues.value)
      );

      // add tokenID
      log.tokenId = newDocument._id;

      var txExists = addTransaction(
        log,
        log.returnValues.from,
        log.returnValues.to,
        log.returnValues.value.toString(10)
      );

      // NOTIFICATION
      if (!txExists || !txExists.blockNumber) {
        var txId = Helpers.makeId('tx', log.transactionHash);

        Helpers.showNotification(
          'wallet.transactions.notifications.tokenTransfer',
          {
            token: newDocument.name,
            to: Helpers.getAccountNameByAddress(log.returnValues.to),
            from: Helpers.getAccountNameByAddress(log.returnValues.from),
            amount: Helpers.formatNumberByDecimals(
              log.returnValues.value,
              newDocument.decimals
            )
          },
          function() {
            // on click show tx info
            EthElements.Modal.show(
              {
                template: 'views_modals_transactionInfo',
                data: {
                  _id: txId
                }
              },
              {
                class: 'transaction-info'
              }
            );
          }
        );
      }
    }
  });
};

/**
Observe tokens

@method observeTokens
*/
observeTokens = function() {
  /**
    Observe tokens, listen for new created tokens.

    @class Tokens({}).observe
    @constructor
    */
  collectionObservers[collectionObservers.length] = Tokens.find({}).observe({
    /**
        Will check if the tokens are on the current chain and setup its listeners.

        @method added
        */
    added: function(newDocument) {
      // check if wallet has code
      web3.eth.getCode(newDocument.address, function(e, code) {
        if (!e) {
          if (code && code.length > 2) {
            Tokens.update(newDocument._id, {
              $unset: {
                disabled: ''
              }
            });

            setupContractSubscription(newDocument);
          } else {
            Tokens.update(newDocument._id, {
              $set: {
                disabled: true
              }
            });
          }
        } else {
          console.log("Couldn't check Token code of ", newDocument, e);
        }
      });
    },
    /**
        Remove transactions confirmations from the accounts

        @method removed
        */
    removed: function(document) {
      var contractInstance = tokenContracts['ct_' + document._id];

      if (!contractInstance) return;

      // stop all running events
      _.each(contractInstance.tokenEvents, function(event) {
        event.unsubscribe();
        contractInstance.tokenEvents.shift();
      });
    }
  });
};
