
var addLogWatching = function(){

    var filter = contractInstance.allEvents({fromBlock: blockToCheckBack, toBlock: 'latest'});
    events.push(filter);
    
    // get past logs, to set the new blockNumber
    var currentBlock = EthBlocks.latest.number;
    filter.get(function(error, logs) {
        if(!error) {
            // update last checkpoint block
            Wallets.update({_id: newDocument._id}, {$set: {
                checkpointBlock: (currentBlock || EthBlocks.latest.number) - ethereumConfig.rollBackBy
            }});
        }
    });

    filter.watch(function(error, log){
        Logs.insert(log);
    });
};

/**
Observe custom contacts

@method observeCustomContracts
*/
observeCustomContracts = function(){

    /**
    Observe custom contracts, listen for new created tokens.

    @class CustomContracts({}).observe
    @constructor
    */
    collectionObservers[collectionObservers.length] = CustomContracts.find({}).observe({
        /**
        Will check if the contracts are on the current chain

        @method added
        */
        added: function(newDocument) {

            // check if wallet has code
            web3.eth.getCode(newDocument.address, function(e, code) {
                if(!e) {
                    if(code && code.length > 2){
                        CustomContracts.update(newDocument._id, {$unset: {
                            disabled: ''
                        }});

                        // check for logs
                        // addLogWatching();
                        

                    } else {
                        CustomContracts.update(newDocument._id, {$set: {
                            disabled: true
                        }});
                    }

                } else {
                    console.log('Couldn\'t check Custom Contracts code of ', newDocument, e);
                }
            });
        }
    });
}