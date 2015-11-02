/**
Creation of executeContract

@class [template] elements_executeContract
@constructor
*/
Template['elements_executeContract'].onCreated(function(){
    var template = this;

    // Set Defaults
    TemplateVar.set('value', '0xdeadbeef');



    // update and generate the contract data 
    this.autorun(function() {
        console.log("autorun");

       var gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
        estimatedGas = TemplateVar.getFrom('.account-send-form', 'estimatedGas'),
        selectedAccount = TemplateVar.getFrom('.select[name="dapp-select-account"]', 'value');

        console.log("gasPrice: " + gasPrice+" estimatedGas: " + estimatedGas);

        // EXECUTE CONTRACT

        console.log('EXECUTE CONTRACT');
        var contractABI = TemplateVar.get('contractABI');
        console.log(contractABI);

        var selectedFunction = TemplateVar.get('selectedFunction');
        console.log(selectedFunction);

        var functionInputs = _.clone(TemplateVar.get('functionInputs'));

        if(!selectedFunction)
            return;

        // If all empty
        if(!_.isArray(functionInputs) || _.isEmpty(functionInputs)) {
            functionInputs = _.map(selectedFunction.functionInputs, function() {
                return '';
            });
        }

        functionInputs.push({
                from: selectedAccount,
                gasPrice: gasPrice,
                gas: estimatedGas
            });

        var contractInstance = web3.eth.contract(contractABI).at(this.to);
        
        console.log(selectedFunction.name);
        console.log(functionInputs);
        
        TemplateVar.set('value', contractInstance[selectedFunction.name].getData.apply(null, functionInputs));

        console.log('VALUE: ');
        console.log(TemplateVar.get('value'));

    });



})

Template['elements_executeContract'].helpers({
    /**
    Returns true if the current selected unit is an ether unit (ether, finney, etc)

    @method (etherUnit)
    */
    'hasCode': function() {
        var code = web3.eth.getCode(this.to);
        // gave up trying to make that async

        return code != '0x'; 
    },
    /**
    Get Functions

    @method (tokens)
    */
    'listContractFunctions': function(){
        return TemplateVar.get("contractFunctions");
    },
    /**
    Get selected contract functions

    @method (selectedContractInputs)
    */
    'selectedFunctionInputs' : function(){
        return TemplateVar.get("selectedFunction").inputs;
    }
})

Template['elements_executeContract'].events({
    /**
    Change the ABI
    
    @event keyup input[name="abi"], change input[name="abi"], input input[name="abi"]
    */
    'keyup input[name="abi"], change input[name="abi"], input input[name="abi"]': function(e, template){
        var ABI = JSON.parse(e.currentTarget.value);

        TemplateVar.set("contractABI", ABI);

        var address = TemplateVar.getFrom('.dapp-address-input', 'value');
        contractInstance = web3.eth.contract(ABI).at(address);

        // console.log(ABI);

        var contractFunctions = [];

        _.each(ABI, function(e,i){
            if (e.type == "function" && !e.constant) {
                _.each(e.inputs, function(input){
                    input.typeShort = input.type.match(/[a-z]+/i);
                    input.typeShort = input.typeShort[0];
                    input.bits = input.type.replace(input.typeShort, '');
                    input.template =  'elements_input_'+ input.typeShort;
                })
                contractFunctions.push(e);

                TemplateVar.set("selectedFunction", e);
            }
        });

        TemplateVar.set("contractFunctions", contractFunctions);

        /* 
        Examples:
        0x15d7a3a5cd34eb54dad230082aebbdba0990a936

        ABI:

[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"issuer","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"issueToken","outputs":[],"type":"function"},{"inputs":[{"name":"_supply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_decimals","type":"uint8"},{"name":"_symbol","type":"string"},{"name":"_issuer","type":"address"}],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]


        */

    },
    /**
    Selected a contract function
    
    @event 'change .contract-functions
    */
    'change .select-contract-function': function(e, template){
        // get the correct contract
        var selectedFunction = _.find(TemplateVar.get('contractFunctions'), function(contract){
            return contract.name == e.currentTarget.value;
        })

        console.log(selectedFunction);
        // change the inputs and data field
        TemplateVar.set('selectedFunction', selectedFunction);
    },
    /**
    Compile the solidty code, when
    
    @event change abi-input, input .abi-input
    */
    'change .abi-input, input .abi-input': function(e, template){
        
        var selectedFunction = TemplateVar.get("selectedFunction");

        // create an array with the input fields
        var functionArguments = [];

        _.each(template.findAll('.abi-input'), function(input, index){
            var output = input.value;

            // force 0x at the start
            if(!_.isEmpty(output) &&
               (selectedFunction.inputs[index].typeShort === 'bytes' ||
               selectedFunction.inputs[index].typeShort === 'address'))
                output = '0x'+ output.replace('0x','');

            functionArguments.push(output);
        })

        TemplateVar.set('functionInputs', functionArguments);
    }
})