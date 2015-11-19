
/**
Add a pending transaction to the transaction list, after sending

@method addTransactionAfterSend
*/
var addTransactionAfterSend = function(txHash, amount, from, to, gasPrice, estimatedGas, data, tokenId) {
                                
    txId = Helpers.makeId('tx', txHash);


    Transactions.upsert(txId, {$set: {
        tokenId: tokenId,
        value: amount,
        from: from,
        to: to,
        timestamp: moment().unix(),
        transactionHash: txHash,
        gasPrice: gasPrice,
        gasUsed: estimatedGas,
        fee: String(gasPrice * estimatedGas),
        data: data
    }});

    // add from Account
    EthAccounts.update({address: from}, {$addToSet: {
        transactions: txId
    }});

    // add to Account
    EthAccounts.update({address: to}, {$addToSet: {
        transactions: txId
    }});
};



/**
Creation of executeContract

@class [template] elements_executeContract
@constructor
*/
Template['elements_executeContract'].onCreated(function(){
    var template = this;

    // Set Defaults
    TemplateVar.set('sending', false);

    // check address for code
    web3.eth.getCode(template.data.address, function(e, code) {
        if(!e && code.length > 2) {
            TemplateVar.set(template, 'hasCode', true);
        }
    });
});


Template['elements_executeContract'].helpers({
    /*
    Reruns when the data context changes

    @method (reactiveContext)
    */
    'reactiveContext': function() {
        console.log(this.abi);

        var contractFunctions = [];
        var contractConstants = [];

        _.each(this.abi, function(func, i){

            // Walk throught the abi and extract functions and constants
            if (func.type == 'function') {
                func.parameters = [];

                _.each(func.inputs, function(input, i){
                    input = Helpers.createTemplateDataFromInput(input, func.name);
                    // Get the inputs of the functions
                    if(func.constant)
                        func.parameters.push(null);
                });

                if(func.constant){
                    // if it's a constant                        
                    contractConstants.push(func);                    
                } else {
                    //if its a variable
                    contractFunctions.push(func);                
                }
                
            }
        });

        TemplateVar.set('contractConstants', contractConstants);
        TemplateVar.set('contractFunctions', contractFunctions);
    },
    /**
    Get selected contract functions

    @method (selectedContractInputs)
    */
    'selectedFunctionInputs' : function(){
        return TemplateVar.get('selectedFunction').inputs;
    }
})

Template['elements_executeContract'].events({
    /**
    Select a contract function
    
    @event 'change .select-contract-function
    */
    'change .select-contract-function': function(e, template){
        // change the inputs and data field
        TemplateVar.set('selectedFunction', _.find(TemplateVar.get('contractFunctions'), function(contract){
            return contract.name === e.currentTarget.value;
        }));
    },
    /**
    Click the show hide button

    @event click .toggle-visibility
    */
    'click .toggle-visibility': function(){
        TemplateVar.set('executionVisible', !TemplateVar.get('executionVisible'))
    },
})




