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
        added: function(document) {
            var wallet = Helpers.getAccountByAddress(document.from);
            if(wallet && wallet.requiredSignatures > document.confirmedOwners.length) {
                var removed = false;
                var contract = contracts['ct_'+ wallet._id];

                _.each(wallet.owners, function(owner){
                    contract.hasConfirmed(document.operation, owner, function(e, res){
                        if(!removed && !e) {
                            if(res) {
                                PendingConfirmations.update(document._id, {$addToSet: {confirmedOwners: owner}});
                            } else {
                                PendingConfirmations.update(document._id, {$pull: {confirmedOwners: owner}});
                            }
                            
                            var pendingConf = PendingConfirmations.findOne(document._id);

                            if(!pendingConf.confirmedOwners.length || Number(wallet.requiredSignatures) === pendingConf.confirmedOwners.length) {
                                PendingConfirmations.remove(document._id);
                                removed = true;
                            }
                        }
                    });
                });
            }
        },
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