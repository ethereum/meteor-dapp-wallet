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
            CustomContracts.update({address: newDocument.address.toLowerCase()}, {$addToSet: {
                contractEvents: newDocument._id
            }});

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