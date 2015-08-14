/**
Template Controllers

@module Templates
*/


/**
The transaction info template

@class [template] views_modals_transactionInfo
@constructor
*/



Template['views_modals_transactionInfo'].helpers({
    /**
    Returns the current transaction

    @method (transaction)
    @return {Object} the current transaction
    */
    'transaction': function() {
        return Transactions.findOne(this._id);
    },
    /**
    Calculates the confirmations of this tx

    @method (confirmations)
    @return {Number} the number of confirmations
    */
    'confirmations': function(){
        return (EthBlocks.latest && this.blockNumber)
            ? EthBlocks.latest.number - this.blockNumber : 0;
    }
});

