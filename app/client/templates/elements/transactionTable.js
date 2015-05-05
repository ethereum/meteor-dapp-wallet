/**
Template Controllers

@module Templates
*/


/**
The transaction row template

@class [template] elements_transactions_row
@constructor
*/


/**
Block required until a transaction is confirmed.

@property blocksForConfirmation
@type Number
*/
var blocksForConfirmation = 12;

Template['elements_transactions_row'].helpers({

});




/**
The transaction row template

@class [template] elements_transactions_row
@constructor
*/


Template['elements_transactions_row'].helpers({
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
        var currentBlockNumber = Blockchain.findOne().blockNumber,
            confirmations = currentBlockNumber - this.blockNumber;
        return (this.blockNumber > currentBlockNumber - blocksForConfirmation)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation-1)) * 100
            }
            : false;
    },
    /**
    Gets the transactions account

    @method (account)
    */
    'account': function() {
        return Accounts.findOne(this.account);
    }
});