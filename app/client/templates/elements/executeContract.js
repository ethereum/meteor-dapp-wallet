/**
Creation of executeContract

@class [template] elements_executeContract
@constructor
*/
Template['elements_executeContract'].onCreated(function(){
    var template = this;

    // Set Defaults
    TemplateVar.set('value', '0xdeadbeef');

    TemplateVar.set("toAddress", this.data.to);

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

        var selectedFunction = TemplateVar.get('selectedFunction');

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

        var contractInstance = web3.eth.contract(contractABI).at(TemplateVar.get("toAddress"));
        
        // SET VALUE
        TemplateVar.set('value', contractInstance[selectedFunction.name].getData.apply(null, functionInputs));


        // call constants
        console.log("CONSTANTS")        
        var contractConstants = TemplateVar.get("contractConstants");
        _.each(contractConstants, function(constant){            
            
            var constantReturns = function(e, constantReturned) {
                var returnString = JSON.stringify(i, null, 4);
                var returnObjects = $('.contract-constants .constant-' + constant.name + ' .output');

               
                _.each(returnObjects, function(outputField, index) {
                    $(outputField).html(constantReturned.toString())

                    if(constant.outputs.length>1) 
                        $(outputField).html(constantReturned[index].toString());

                });  
                
                
            };

            var constantInputs = constant.parameters;
            constantInputs.push(constantReturns);

            contractInstance[constant.name].apply(null, constantInputs);
        })

    });


})


Template['elements_executeContract'].onRendered(function(){
    var template = this;
    console.log('onRendered');

    template.$('.abi-input').change();

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
    Get Functions

    @method (tokens)
    */
    'listContractConstants': function(){
        return TemplateVar.get("contractConstants");
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
        var contractConstants = [];

        _.each(ABI, function(e,i){
            if (e.type == "function") {
                e.parameters = [];

                _.each(e.inputs, function(input, i){
                    input = Helpers.makeTemplateFromInput(input, e.name);
                    
                    if (e.constant)
                        e.parameters.push(0);
                })

                if (e.constant){
                    // if it's a constant

                    console.log('e.parameters');
                    console.log(e.parameters);
                    contractConstants.push(e);                    
                } else {
                    //if its a variable
                    contractFunctions.push(e);                
                    TemplateVar.set("selectedFunction", e); 
                }
                
            }
        });


        _.each(contractConstants, function(constant){  
            var parameters = template.$(".contract-constants .constant-input-"+constant.name+" .abi-input");

            constant.parameters = [];
            _.each(parameters, function(parameter){
                // console.log(parameter.value);
                constant.parameters.push(parameter.value);
            })
        })




        TemplateVar.set("contractFunctions", contractFunctions);
        TemplateVar.set("contractConstants", contractConstants);

        // execute the change function after abi loading
        $('.abi-input').change();

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

        // change the inputs and data field
        TemplateVar.set('selectedFunction', selectedFunction);
    },
    /**
    Update input argument
    
    @event change .contract-functions .abi-input, input .contract-functions .abi-input
    */
    'change .abi-input, input .abi-input, click .refresh-inputs': function(e, template){
        e.preventDefault();
        e.stopImmediatePropagation();
        
        var selectedFunction = TemplateVar.get("selectedFunction");

        // create an array with the input fields
        var functionArguments = [];
        var constants = [];
        var contractConstants = TemplateVar.get("contractConstants");

        _.each(template.findAll('.contract-functions .abi-input'), function(input, index){
            // console.log("abi change");
            var parentName = input.getAttribute("data-ref");
            // console.log(index);

            var output = input.value;

            // force 0x at the start
            if(!_.isEmpty(output) &&
               (selectedFunction.inputs[index].typeShort === 'bytes' ||
               selectedFunction.inputs[index].typeShort === 'address'))
                output = '0x'+ output.replace('0x','');

            functionArguments.push(output);  
        })

        _.each(contractConstants, function(constant){  
            var parameters = template.$(".contract-constants .constant-input-"+constant.name+" .abi-input");

            constant.parameters = [];
            _.each(parameters, function(parameter){
                // console.log(parameter.value);
                constant.parameters.push(parameter.value);
            })
        })

        // console.log('contractConstants');
        // console.log(contractConstants);

        TemplateVar.set("contractConstants", contractConstants);
        TemplateVar.set('functionInputs', functionArguments);
    }
})




