/**
Template Controllers

@module Templates
*/


/**
The transaction info template

@class [template] views_modals_transactionInfo
@constructor
*/



Template['views_modals_crosstransactionInfo'].helpers({
    /**
    Returns the current transaction

    @method (transaction)
    @return {Object} the current transaction
    */
    'transaction': function() {
        // console.log('this: ', this);
        return this;
    },
    /**
    Calculates the confirmations of this tx

    @method (confirmations)
    @return {Number} the number of confirmations
    */
    'confirmations': function(){
        return (EthBlocks.latest && this.blockNumber)
            ? EthBlocks.latest.number + 1 - this.blockNumber : 0;
    },
    /**
    Token value

    @method (tokenValue)
    */
    'tokenValue': function() {
        var token = Tokens.findOne(this.tokenId);

        return (token) ? Helpers.formatNumberByDecimals(this.value, token.decimals) +' '+ token.symbol : this.value;
    },
    /**
    Gas Price per million

    @method (gasPricePerMillion)
    */
    'gasPricePerMillion': function() {
        return this.gasPrice * 1000000;
    }
});

Template['views_modals_crosstransactionInfo'].events({
    'click .ok-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
});
