/**
Template Controllers

@module Templates
*/


/**
The execute contract template

@class [template] elements_executeContract
@constructor
*/

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
    /**
    Reruns when the data context changes

    @method (reactiveContext)
    */
    'reactiveContext': function() {
        var contractInstance = web3.eth.contract(this.abi).at(this.address);

        var contractFunctions = [];
        var contractConstants = [];

        _.each(this.abi, function(func, i){

            // Walk throught the abi and extract functions and constants
            if(func.type == 'function') {
                func.contractInstance = contractInstance;
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
        var selectedFunc = TemplateVar.get('selectedFunction');
        return selectedFunc ? selectedFunc.inputs : [];
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



/**
The contract constants template

@class [template] elements_executeContract_constant
@constructor
*/

/**
Formats the values for display

@method formatOutput
*/
var formatOutput = function(val) {
    if(_.isArray(val))
        return _.map(val, formatOutput);
    else {

        // stringify boolean
        if(_.isBoolean(val))
            val = val ? 'TRUE' : 'FALSE';

        // convert bignumber objects
        val = (_.isObject(val) && val.toString)
            ? val.toString(10)
            : val;

        return val;
    }
};

Template['elements_executeContract_constant'].onCreated(function(){
    var template = this;

    // call the contract functions when data changes and on new blocks
    this.autorun(function() {
        // make reactive to the latest block
        EthBlocks.latest;

        // get args for the constant function
        var args = _.pluck(TemplateVar.get('inputs') || [], 'value');

        // add callback
        args.push(function(e, r) {
            var outputs = [];

            // single return value
            if(template.data.outputs.length === 1) {
                template.data.outputs[0].value = r;
                outputs.push(template.data.outputs[0]);

            // multiple return values
            } else {
                outputs = _.map(template.data.outputs, function(output, i) {
                    output.value = r[i];
                    return output;
                });
            }

            console.log('Outputs', outputs);

            TemplateVar.set(template, 'outputs', outputs);
        });

        template.data.contractInstance[template.data.name].apply(null, args);
    });
});

Template['elements_executeContract_constant'].helpers({
    /**
    Formats the value if its a big number or array

    @method (value)
    */
    'value': function() {
        return _.isArray(this.value) ? formatOutput(this.value) : [formatOutput(this.value)];
    }
});

Template['elements_executeContract_constant'].events({
    /**
    React on user input on the constant functions

    @event change .abi-input, input .abi-input
    */
    'change .abi-input, input .abi-input': function(e, template) {
        var currentInput = this;
        var inputs = _.map(template.data.inputs, function(input) {
            if(currentInput.name === input.name &&
               currentInput.type === input.type)
                input.value = e.currentTarget.value;

            return input;
        });

        TemplateVar.set('inputs', inputs);
    }
});

