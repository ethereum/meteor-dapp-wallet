/**
Observe the latest blocks

@method observeLatestBlocks
*/
observeLatestBlocks = function(){

    // UPDATE latest BLOCKCHAIN DATA (SYNC!)
    web3.eth.getBlock('latest', function(e, block){
        if(!e) {
            web3.eth.getGasPrice(function(e, gasPrice){
                if(!e) {
                    LastBlock.update('latest', {$set: {
                        blockNumber: block.number,
                        blockHash: block.hash,
                        gasPrice: gasPrice.toString(10)
                    }});
                }
            });
        }
    });

    // GET the latest blockchain information
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {
            var block = web3.eth.getBlock(res, function(e, block){
                var oldBlock = Blockchain.findOne({_id: 'bl_'+ (block.number - 1)});
                // console.log('BLOCK', block.number);

                // CHECK for FORK
                if(oldBlock && oldBlock.blockHash !== block.parentHash) {
                    console.log('FORK detected from Block #'+ oldBlock.blockNumber + ' -> #'+ block.number +', rolling back!');
                    // Go through all accounts and re-run
                    _.each(Accounts.find({type: 'wallet'}).fetch(), function(account){
                        // REMOVE ADDRESS for YOUNG ACCOUNTS, so that it tries to get the Created event and correct address again
                        if(account.creationBlock + ethereumConfig.requiredConfirmations >= block.number)
                            delete account.address;

                        setupContractFilters(account);
                    });
                }

                if(!oldBlock)
                    console.log('No previous block found: '+ (block.number - 1));

                // if(oldBlock.blockNumber+1 !== block.number)
                //     console.log('BLOCK number not consecutive from Block #'+ oldBlock.blockNumber + ' -> #'+ block.number);
                
                Blockchain.upsert({_id: 'bl_'+ block.number}, {
                    blockNumber: block.number,
                    blockHash: block.hash
                });

                // drop the 20th block
                if(Blockchain.find().count() > 20) {
                    var count = 0;
                    _.each(Blockchain.find({}, {sort: {blockNumber: -1}}).fetch(), function(bl){
                        count++;
                        if(count > 20)
                            Blockchain.remove({_id: bl._id});
                    });
                }

                // update the current gas price
                web3.eth.getGasPrice(function(e, gasPrice){
                    if(!e) {
                        // update the latest blockchain entry
                        var latestBlock = Blockchain.findOne({}, {sort: {blockNumber: -1}});
                        LastBlock.update('latest', {$set: {
                            blockNumber: latestBlock.blockNumber,
                            blockHash: latestBlock.blockHash,
                            gasPrice: gasPrice.toString(10),
                            checkpoint: latestBlock.blockNumber // TODO set checkoints more smartly
                        }});
                    }
                });

                // UPDATE SIMPLE ACCOUNTS balance
                _.each(Accounts.find({type: 'account'}).fetch(), function(account){
                    web3.eth.getBalance(account.address, function(err, res){
                        Accounts.update(account._id, {$set: {
                            balance: res.toString(10)
                        }});
                    });
                });
            });
        }
    });

};