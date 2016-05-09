// meant to speed up and make less requests
var customContractsCache = {};
/**
Observe events

@method observeEvents
*/
observeEvents = function(){
    /**
    Observe transactions, listen for new created transactions.

    @class Events({}).observe
    @constructor
    */
    collectionObservers[collectionObservers.length] = Events.find({}).observe({
        /**
        This will observe when events are added and link it to the custom contract.

        @method added
        */
        added: function(newDocument) {
            
            // This creates a temporary cache for the contracts, to reduce the amount of db read and writes            
            var customContract = customContractsCache[newDocument.address.toLowerCase()];

            if (typeof customContract == 'undefined') {
                var customContract = CustomContracts.findOne({address: newDocument.address.toLowerCase()});
                customContractsCache[newDocument.address.toLowerCase()] = customContract; 
            }

            // add to accounts
            if (customContract.contractEvents.indexOf(newDocument._id)<0) {
                // Only if the event isn't there
                CustomContracts.update({address: newDocument.address.toLowerCase()}, {$addToSet: {
                    contractEvents: newDocument._id
                }});  
    
                customContract.contractEvents.push(newDocument._id);    
                customContractsCache[newDocument.address.toLowerCase()] = customContract; 
            }

        },
        /**
        Remove events confirmations from the accounts

        @method removed
        */
        removed: function(document) {
            CustomContracts.update({address: document.address.toLowerCase()}, {$pull: {
                contractEvents: document._id
            }});
        }
    });

};