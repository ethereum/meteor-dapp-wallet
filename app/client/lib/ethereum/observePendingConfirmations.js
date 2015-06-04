/**
Observe pending confirmations

@method observeAccounts
*/
observePendingConfirmations = function(){
    /**
    Observe PendingConfirmations 

    @class PendingConfirmations({}).observe
    @constructor
    */
    PendingConfirmations.find({}).observe({
        /**
        Add pending confirmations to the accounts

        @method added
        */
        added: function(document) {
            if(document.operation)
                Accounts.update({address: document.from}, {$addToSet: {
                    pendingConfirmations: document._id
                }});
        },
        /**
        Remove pending confirmations from the accounts

        @method removed
        */
        removed: function(document) {
            Accounts.update({address: document.from}, {$pull: {
                pendingConfirmations: document._id
            }});
        }
    });

    /**
    Observe PendingConfirmations 

    @class PendingConfirmations({}).observe
    @constructor
    */
    PendingConfirmations.find({}).observeChanges({
        /**
        Add pending confirmations to the accounts

        @method changed
        */
        changed: function(id, fields) {
            if(fields.operation) {
                Accounts.update({address: document.from}, {$addToSet: {
                    pendingConfirmations: document._id
                }});
            }
        }
    });
};