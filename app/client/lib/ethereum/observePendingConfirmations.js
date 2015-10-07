/**
Observe pending confirmations

@method observePendingConfirmations
*/
observePendingConfirmations = function(){
    /**
    Observe PendingConfirmations 

    @class PendingConfirmations({}).observe
    @constructor
    */
    collectionObservers[collectionObservers.length] = PendingConfirmations.find({}).observe({
        /**
        Add pending confirmations to the accounts

        @method added
        */
        // added: function(document) {
        //     if(document.operation && (!document.confirmedOwners || document.confirmedOwners.length > 0))
        //         Accounts.update({address: document.from}, {$addToSet: {
        //             pendingConfirmations: document._id
        //         }});
        // },
        /**
        Remove pending confirmations from the accounts

        @method removed
        */
        // removed: function(document) {
        //     Accounts.update({address: document.from}, {$pull: {
        //         pendingConfirmations: document._id
        //     }});
        // },
        /**
        Add pending confirmations to the accounts

        @method changed
        */
        // changed: function(id, fields) {
        //     var document = PendingConfirmations.findOne(id);

        //     if(fields.operation || (fields.confirmedOwners && fields.confirmedOwners.length > 0)) {
        //         Accounts.update({address: document.from}, {$addToSet: {
        //             pendingConfirmations: document._id
        //         }});
        //     }
        //     if(fields.confirmedOwners && fields.confirmedOwners.length === 0) {
        //         Accounts.update({address: document.from}, {$pull: {
        //             pendingConfirmations: document._id
        //         }});
        //     }
        // }
    });
};