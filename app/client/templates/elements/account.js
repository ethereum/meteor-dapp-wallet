/**
Template Controllers

@module Templates
*/

/**
The account template

@class [template] elements_account
@constructor
*/

/**
Block required until a transaction is confirmed.

@property blocksForConfirmation
@type Number
*/
var blocksForConfirmation = 12;




Template['elements_account'].rendered = function(){

    // initiate the geo pattern
    var pattern = GeoPattern.generate(this.data.address);
    this.$('.account-pattern').css('background-image', pattern.toDataUrl());
};


Template['elements_account'].helpers({
    /**
    Get the current account

    @method (account)
    */
    'account': function(){
        return EthAccounts.findOne(this.account) || Wallets.findOne(this.account);
    },
    /**
    Get the name

    @method (name)
    */
    'name': function(){
        return this.name || TAPi18n.__('wallet.accounts.defaultName');
    },
    /**
    Account was just added. Retrun true and eemove the "new" field.

    @method (new)
    */
    'new': function() {
        if(this.new) {
            // remove the "new" field
            var id = this._id;
            Meteor.setTimeout(function() {
                EthAccounts.update(id, {$unset: {new: ''}});
                Wallets.update(id, {$unset: {new: ''}});
            }, 1000);

            return true;
        }
    },
    /**
    Should the wallet show disabled

    @method (creating)
    */
    'creating': function(){
        return (!this.address || this.imported || blocksForConfirmation >= EthBlocks.latest.number - (this.creationBlock - 1));
    },
    /**
    Returns the confirmations

    @method (totalConfirmations)
    */
    'totalConfirmations': blocksForConfirmation,
    /**
    Checks whether the transaction is confirmed ot not.

    @method (unConfirmed)
    */
    'unConfirmed': function() {
        if(!this.creationBlock || this.createdIdentifier)
            return false;

        var currentBlockNumber = EthBlocks.latest.number,
            confirmations = currentBlockNumber - (this.creationBlock - 1);
        return (blocksForConfirmation >= confirmations && confirmations >= 0)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation)) * 100
            }
            : false;
    }
});

Template['elements_account'].events({

});
