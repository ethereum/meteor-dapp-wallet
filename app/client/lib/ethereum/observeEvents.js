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
        This will observe the transactions creation and create watchers for outgoing transactions, to see when they are mined.

        @method added
        */
        added: function(newDocument) {
            // add to accounts
            CustomContracts.update({address: newDocument.address}, {$addToSet: {
                contractEvents: newDocument._id
            }});
        },
        /**
        Remove events confirmations from the accounts

        @method removed
        */
        removed: function(document) {
            CustomContracts.update({address: document.address}, {$pull: {
                contractEvents: document._id
            }});
        }
    });

};