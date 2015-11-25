/**
Template Controllers

@module Templates
*/


/**
The execute contract template

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

                func.inputs = _.map(func.inputs, Helpers.createTemplateDataFromInput);

                // console.log(func.name);
                // _.each(func.inputs, function(inputs) {
                //     console.log(inputs);
                // });

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
    }
});

Template['elements_executeContract'].events({
    /**
    Select a contract function
    
    @event 'change .select-contract-function
    */
    'change .select-contract-function': function(e, template){
        TemplateVar.set('executeData', null);

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
    }
});



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
        var args = TemplateVar.get('inputs') || [];

        // add callback
        args.push(function(e, r) {
            if(!e) {
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

                // console.log('Outputs', outputs);

                TemplateVar.set(template, 'outputs', outputs);
            }
        });

        console.log('Inputs', args);

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
        var inputs = Helpers.addInputValue(template.data.inputs, this, e.currentTarget);

        TemplateVar.set('inputs', inputs);
    }
});




/**
The contract function template

@class [template] elements_executeContract_function
@constructor
*/


Template['elements_executeContract_function'].onCreated(function(){
    var template = this;

    // get the function call data, if it has no parameters
    if(template.data.inputs.length === 0)
        TemplateVar.set('executeData', template.data.contractInstance[template.data.name].getData());


    // change the amount when the currency unit is changed
    template.autorun(function(c){
        var unit = EthTools.getUnit();

        if(!c.firstRun) {
            TemplateVar.set('amount', EthTools.toWei(template.find('input[name="amount"]').value.replace(',','.'), unit));
        }
    });
});

Template['elements_executeContract_function'].onRendered(function(){
    // Run all inputs through formatter to catch bools
    this.$('.abi-input').trigger('change');
});

Template['elements_executeContract_function'].events({
    /**
    Set the amount while typing
    
    @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
    */
    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(e, template){
        var wei = EthTools.toWei(e.currentTarget.value.replace(',','.'));
        TemplateVar.set('amount', wei || '0');
    },
    /**
    React on user input on the execute functions

    @event change .abi-input, input .abi-input
    */
    'change .abi-input, input .abi-input': function(e, template) {
        var inputs = Helpers.addInputValue(template.data.inputs, this, e.currentTarget);

        TemplateVar.set('executeData', template.data.contractInstance[template.data.name].getData.apply(null, inputs));
    },
    /**
    Executes a transaction on contract

    @event click .execute
    */
    'click .execute': function(e, template){
        var to = template.data.contractInstance.address,
            gasPrice = 50000000000,
            estimatedGas = 3000000,
            amount = TemplateVar.get('amount') || 0,
            selectedAccount = Helpers.getAccountByAddress(TemplateVar.getFrom('.execute-contract select[name="dapp-select-account"]', 'value')),
            data = TemplateVar.get('executeData');


        if(selectedAccount) {

            console.log('Providing gas: ', estimatedGas ,' + 100000');

            if(selectedAccount.balance === '0')
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.emptyWallet',
                    duration: 2
                });


            // The function to send the transaction
            var sendTransaction = function(estimatedGas){

                TemplateVar.set('sending', true);


                // CONTRACT TX
                if(contracts['ct_'+ selectedAccount._id]) {

                    contracts['ct_'+ selectedAccount._id].execute.sendTransaction(to || '', amount || '', data || '', {
                        from: selectedAccount.owners[0],
                        gasPrice: gasPrice,
                        gas: estimatedGas
                    }, function(error, txHash){

                        TemplateVar.set(template, 'sending', false);

                        console.log(error, txHash);
                        if(!error) {
                            console.log('SEND from contract', amount);

                            addTransactionAfterSend(txHash, amount, selectedAccount.address, to, gasPrice, estimatedGas, data);

                            FlowRouter.go('dashboard');

                        } else {
                            // EthElements.Modal.hide();

                            GlobalNotification.error({
                                content: error.message,
                                duration: 8
                            });
                        }
                    });
                
                // SIMPLE TX
                } else {

                    web3.eth.sendTransaction({
                        from: selectedAccount.address,
                        to: to,
                        data: data,
                        value: amount,
                        gasPrice: gasPrice,
                        gas: estimatedGas
                    }, function(error, txHash){

                        TemplateVar.set(template, 'sending', false);

                        console.log(error, txHash);
                        if(!error) {
                            console.log('SEND simple');

                            addTransactionAfterSend(txHash, amount, selectedAccount.address, to, gasPrice, estimatedGas, data);

                            // FlowRouter.go('dashboard');
                            GlobalNotification.success({
                               content: "The transaction was executed",
                               duration: 2
                            });
                        } else {

                            // EthElements.Modal.hide();

                            GlobalNotification.error({
                                content: error.message,
                                duration: 8
                            });
                        }
                    });
                }   
            };

            sendTransaction(estimatedGas);    
        }
    }
});

