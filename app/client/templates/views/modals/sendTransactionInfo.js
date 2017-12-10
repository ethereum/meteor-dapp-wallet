/**
Template Controllers

@module Templates
*/

/**
The send transaction info template

@class [template] views_modals_sendTransactionInfo
@constructor
*/

// Set basic variables
Template['views_modals_sendTransactionInfo'].helpers({
    /**
    Calculates the fee used for this transaction in ether

    @method (estimatedFee)
    */
    'estimatedFee': function() {
        if(this.estimatedGas && this.gasPrice)
            return EthTools.formatBalance(new BigNumber(this.estimatedGas, 10).times(new BigNumber(this.gasPrice, 10)), '0,0.0[0000000] unit', 'ether');
    }
});