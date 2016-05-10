
var tokenContracts = {};


/**
Creates filters for a wallet contract, to watch for deposits, pending confirmations, or contract creation events.

@method setupContractFilters
@param {Object} newDocument
@param {Boolean} checkFromCreationBlock
*/
var setupContractFilters = function(newDocument){
    var contractInstance = tokenContracts['ct_'+ newDocument._id] = TokenContract.at(newDocument.address);

    if(!contractInstance)
        return;

    var blockToCheckBack = (newDocument.checkpointBlock || 0) - ethereumConfig.rollBackBy;

    // TODO change to 0, when new geth is out!!!!!
    if(blockToCheckBack < 400000)
        blockToCheckBack = 400000;

    if(!contractInstance.tokenEvents)
        contractInstance.tokenEvents = [];

    var events = contractInstance.tokenEvents;

    // delete old events
    _.each(Transactions.find({tokenId: newDocument._id, blockNumber: {$exists: true, $gt: blockToCheckBack}}).fetch(), function(tx){
        if(tx)
            Transactions.remove({_id: tx._id});
    });

    // SETUP FILTERS
    // Helpers.eventLogs('Checking Token Transfers for '+ contractInstance.address +' (_id: '+ newDocument._id +') from block #', blockToCheckBack);


    var filter = contractInstance.allEvents({fromBlock: blockToCheckBack, toBlock: 'latest'});
    events.push(filter);

    // get past logs, to set the new blockNumber
    var currentBlock = EthBlocks.latest.number;
    filter.get(function(error, logs) {
        if(!error) {
            // update last checkpoint block
            Tokens.update({_id: newDocument._id}, {$set: {
                checkpointBlock: (currentBlock || EthBlocks.latest.number) - ethereumConfig.rollBackBy
            }});
        }
    });

    filter.watch(function(error, log){
        if(!error) {
            // Helpers.eventLogs(log);

            if(EthBlocks.latest.number && log.blockNumber > EthBlocks.latest.number) {
                // update last checkpoint block
                Tokens.update({_id: newDocument._id}, {$set: {
                    checkpointBlock: log.blockNumber
                }});
            }

            if(log.event === 'Transfer' &&
               (Helpers.getAccountByAddress(log.args.from) || Helpers.getAccountByAddress(log.args.to))) {
                
                Helpers.eventLogs('Transfer for '+ newDocument.address +' arrived in block: #'+ log.blockNumber, log.args.value.toNumber());

                // add tokenID
                log.tokenId = newDocument._id;

                var txExists = addTransaction(log, log.args.from, log.args.to, log.args.value.toString(10));

                // NOTIFICATION
                if(!txExists || !txExists.blockNumber) {
                    var txId = Helpers.makeId('tx', log.transactionHash);

                    Helpers.showNotification('wallet.transactions.notifications.tokenTransfer', {
                        token: newDocument.name,
                        to: Helpers.getAccountNameByAddress(log.args.to),
                        from: Helpers.getAccountNameByAddress(log.args.from),
                        amount: Helpers.formatNumberByDecimals(log.args.value, newDocument.decimals)
                    }, function() {

                        // on click show tx info
                        EthElements.Modal.show({
                            template: 'views_modals_transactionInfo',
                            data: {
                                _id: txId
                            }
                        },{
                            class: 'transaction-info'
                        });
                    });
                }
            }
        } else {
            console.error('Logs of Token '+ newDocument.name + ' couldn\'t be received', error);
        }
    });
};

/**
Observe tokens

@method observeTokens
*/
observeTokens = function(){

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
                if(!e) {
                    if(code && code.length > 2){
                        Tokens.update(newDocument._id, {$unset: {
                            disabled: ''
                        }});

                        setupContractFilters(newDocument);

                    } else {
                        Tokens.update(newDocument._id, {$set: {
                            disabled: true
                        }});
                    }
                } else {
                    console.log('Couldn\'t check Token code of ', newDocument, e);
                }
            });

        },
        /**
        Remove transactions confirmations from the accounts

        @method removed
        */
        removed: function(document) {
            var contractInstance = tokenContracts['ct_'+ document._id];

            if(!contractInstance)
                return;

            // stop all running events
            _.each(contractInstance.tokenEvents, function(event){
                event.stopWatching();
                contractInstance.tokenEvents.shift();
            });
        }
    });

};