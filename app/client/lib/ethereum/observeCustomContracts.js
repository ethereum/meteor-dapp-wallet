var addLogWatching = function(newDocument){


    var contractInstance = web3.eth.contract(newDocument.jsonInterface).at(newDocument.address);
    var blockToCheckBack = (newDocument.checkpointBlock || 0) - ethereumConfig.rollBackBy;
    
    if(blockToCheckBack < 0)
        blockToCheckBack = 0;

    // console.log('EVENT LOG:  Checking Custom Contract Events for '+ newDocument.address +' (_id: '+ newDocument._id + ') from block # '+ blockToCheckBack);

    // delete the last logs until block -500
    // _.each(Events.find({_id: {$in: newDocument.contractEvents || []}, blockNumber: {$exists: true, $gt: blockToCheckBack}}).fetch(), function(log){
    //     if(log)
    //         Events.remove({_id: log._id});
    // });

    // var filter = contractInstance.allEvents({fromBlock: blockToCheckBack, toBlock: 'latest'});
    
    // get past logs, to set the new blockNumber
    var currentBlock = EthBlocks.latest.number;
    filter.get(function(error, logs) {
        if(!error) {
            // update last checkpoint block
            CustomContracts.update({_id: newDocument._id}, {$set: {
                checkpointBlock: (currentBlock || EthBlocks.latest.number) - ethereumConfig.rollBackBy
            }});
        }
    });

    // filter.watch(function(error, log){
    //     if(!error) {
    //         var id = Helpers.makeId('log', web3.sha3(log.logIndex + 'x' + log.transactionHash + 'x' + log.blockHash));

    //         if(log.removed) {
    //             Events.remove(id);
    //         } else {
    //             web3.eth.getBlock(log.blockHash, function(err, block){
    //                 if(!err) {

    //                     _.each(log.args, function(value, key){
    //                         // if bignumber
    //                         if((_.isObject(value) || value instanceof BigNumber) && value.toFormat) {
    //                             value = value.toString(10);
    //                             log.args[key] = value;
    //                         }
    //                     });

    //                     log.timestamp = block.timestamp;
    //                     Events.upsert(id, log);
    //                 }
    //             });
    //         }
    //     }
    // });
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
            // If the network is not known, check if it has code
            if (typeof newDocument.network == 'undefined') {
                // check if wallet has code
                web3.eth.getCode(newDocument.address, function(e, code) {
                    if(!e && code && code.length > 2 ){
                        // If there is code, then save the network name
                        CustomContracts.update(newDocument._id, {$set: {
                            network: Session.get('network'),
                            disabled: false
                        }});

                        } else if (!e) {
                        // if there's no code, check if the contract has a balance
                        web3.eth.getBalance(newDocument.address, function(e, balance) {
                            if(!e && balance.gt(0)){
                                // If there is a balance, enable it (but don't save the network name)
                                CustomContracts.update(newDocument._id, {$set: {
                                    disabled: false
                                }});
                            } else if (!e) {
                                // If there is no balance, disable it (but don't save the network name)
                                CustomContracts.update(newDocument._id, {$set: {
                                    disabled: true
                                }});
                            } 
                        });                        
                    }
                });
            } else if (newDocument.disabled == (newDocument.network != Session.get('network'))){
                // If the network is known, check if it's enabled/disabled correctly
                CustomContracts.update(newDocument._id, {$set: {
                    disabled: newDocument.network != Session.get('network')
                }}); 
            } 
        }
    });
}