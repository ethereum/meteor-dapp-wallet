
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
    TemplateVar.set('value', '');

    TemplateVar.set('toAddress', this.data.address);
    TemplateVar.set('sending', false);

    // check address for code
    web3.eth.getCode(template.data.address, function(e, code) {
        if(!e && code.length > 2) {
            TemplateVar.set(template, 'hasCode', true);
        }
    });


    // update the abi
    this.autorun(function(){

    })

    // update and generate the contract data 
    this.autorun(function() {
        console.log('autorun');

        var gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
        estimatedGas = TemplateVar.getFrom('.account-send-form', 'estimatedGas'),
        selectedAccount = TemplateVar.getFrom('.select[name="dapp-select-account"]', 'value');

        console.log('gasPrice: ' + gasPrice +' estimatedGas: '+ estimatedGas);

        // EXECUTE CONTRACT

        console.log('EXECUTE CONTRACT');
        var contractABI = TemplateVar.get('contractABI');

        var selectedFunction = TemplateVar.get('selectedFunction');

        var functionInputs = _.clone(TemplateVar.get('functionInputs'));

        if (TemplateVar.get('executionVisible'))
            var contractInstance = web3.eth.contract(contractABI).at(TemplateVar.get('toAddress'));

        if(selectedFunction) {
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
            
            // SET VALUE
            TemplateVar.set('value', contractInstance[selectedFunction.name].getData.apply(null, functionInputs));
        }
        
        // call constants and get their values
        console.log("CONSTANTS")        
        var contractConstants = TemplateVar.get('contractConstants');
        _.each(contractConstants, function(constant){            
            
            // the return function for the variable argument.
            // will execute a jquery (sorry!) and fill the output fields for the constant
            var constantReturns = function(e, constantReturned) {
                var returnString = JSON.stringify(constantReturned, null, 4);
                var returnObjects = $('.contract-constants .constant-' + constant.name + ' .output');

               
                _.each(returnObjects, function(outputField, index) {
                    var htmlString = constantReturned.toString()

                    if(constant.outputs.length>1) 
                        var htmlString =  constantReturned[index].toString();

                    if (constant.outputs[index].type == 'address') {
                        var identicon = blockies.create({
                                            seed: htmlString,
                                            size: 8,
                                            scale: 8
                                        }).toDataURL();

                        console.log(identicon);
                        var htmlString = '<span class="dapp-identicon dapp-small" style="background-image: url('+identicon+'); position: absolute; top: 5px;"></span> <div style="padding: 10px 0 20px 40px;">' + htmlString + "</div>";
                    };

                    $(outputField).html(htmlString);


                });  
                
                
            };

            var constantInputs = constant.parameters;
            constantInputs.push(constantReturns);

            // executes all the contract constant functions whenever a templatevar changes
            // (which happens when fields are clicked)
            
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
    Get the current selected account

    @method (getContractInfo)
    */
    'getContractInfo': function() {
          return Helpers.getAccountByAddress(TemplateVar.get("toAddress"));
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
    },
    /**
    Get selected contract functions

    @method (selectedContractInputs)
    */
    'visibilityToggleButton' : function(){
        return TemplateVar.get("executionVisible")?  "Hide" : "Show contract info";
    }, 
    /**
    Get all current accounts

    @method (fromAccounts)
    */
    'fromAccounts': function(){
        // set account queries
        accountQuery = {owners: {$in: _.pluck(EthAccounts.find({}).fetch(), 'address')}, address: {$exists: true}};
        accountSort = {sort: {name: 1}};

        return _.union(Wallets.find(accountQuery, accountSort).fetch(), EthAccounts.find({}, accountSort).fetch());
    }
})

Template['elements_executeContract'].events({
    /**
    Change the ABI
    
    @event keyup input[name="abi"], change input[name="abi"], input input[name="abi"]
    */
    'keyup input[name="abi"], change input[name="abi"], click input[name="abi"]': function(e, template){
        
        /* 
        This is executed when the ABI is changed or clicked on. Ideally it should happen automatically without requiring a click, obviously. It reads the ABI and generates templateVars that will create the variables and functions inputs
         */

        var ABIstring = e.currentTarget.value;
        var ABI = JSON.parse(ABIstring);

        console.log('ABI');
        console.log( ABI );

        if (typeof ABI == 'object') {
            // If the ABI is valid

            TemplateVar.set('contractABI', ABI);


            var address = TemplateVar.getFrom('.dapp-address-input', 'value');
            contractInstance = web3.eth.contract(ABI).at(address);

            var contractFunctions = [];
            var contractConstants = [];

            _.each(ABI, function(e,i){
                // Walk throught the abi and extract functions and constants
                if (e.type == 'function') {
                    e.parameters = [];

                    _.each(e.inputs, function(input, i){
                        input = Helpers.createTemplateDataFromInput(input, e.name);
                        // Get the inputs of the functions
                        if (e.constant)
                            e.parameters.push(0);
                    })

                    if (e.constant){
                        // if it's a constant                        
                        contractConstants.push(e);                    
                    } else {
                        //if its a variable
                        contractFunctions.push(e);                
                    }
                    
                }
            });

            // Walk in each contract constant to get the value assync
            _.each(contractConstants, function(constant){  
                // get all the inputs from the constant ABI
                var parameters = template.$('.contract-constants .constant-input-'+ constant.name +' .abi-input');
                // haven't figured out a way to do it without jquery

                constant.parameters = [];
                _.each(parameters, function(parameter){
                    constant.parameters.push(parameter.value);
                })
            })


            TemplateVar.set("contractFunctions", contractFunctions);
            TemplateVar.set("contractConstants", contractConstants);

            // execute the change function after abi loading
            // $('.abi-input').change();

            contractInfo = Helpers.getAccountByAddress(TemplateVar.get("toAddress"));
            
            // If it's valid then saves new ABI
            CustomContracts.update(contractInfo._id, {$set: {
                abi: ABIstring
            }});
        } 

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
    'change .abi-input, input .abi-input': function(e, template){
        /* Things that happen when you click on any ABI input field */

        e.preventDefault();
        e.stopImmediatePropagation();

        var selectedFunction = TemplateVar.get("selectedFunction");

        // create an array with the input fields
        var functionArguments = [];
        var constants = [];
        var contractConstants = TemplateVar.get("contractConstants");

        // Save all current arguments for the contract functions in variables
        _.each(template.findAll('.contract-functions .abi-input'), function(input, index){
            var parentName = input.getAttribute("data-ref");
         
            var output = input.value;

            if(input.type == 'checkbox')
                output = input.checked;

            // force 0x at the start
            if(selectedFunction && !_.isEmpty(output) &&
               (selectedFunction.inputs[index].typeShort === 'bytes' ||
               selectedFunction.inputs[index].typeShort === 'address'))
                output = '0x'+ output.replace('0x','');

            functionArguments.push(output);  
        })

        // Update all the contract constants
        // This only happens when you click on any field, should  
        // probably happen whenever there's a new block also

        _.each(contractConstants, function(constant){  
            var parameters = template.$(".contract-constants .constant-input-"+constant.name+" .abi-input");

            constant.parameters = [];
            _.each(parameters, function(parameter){
                constant.parameters.push(parameter.value);
            })
        })

        TemplateVar.set("contractConstants", contractConstants);
        TemplateVar.set('functionInputs', functionArguments);
    },
    /**
    Click the toggle button

    @event
    */
    'click .toggle-execution': function(){
        TemplateVar.set("executionVisible", !TemplateVar.get("executionVisible"))
    },
    /**
    Click the toggle button

    @event
    */
    'click .execute': function(){
        
        // This should definitely be a separate module, as it repeats a lot of whats on the send page

        console.log('select[name="dapp-select-account"]')
        console.log(TemplateVar.getFrom('select[name="dapp-select-account"]', 'value'))

        var to = TemplateVar.get('toAddress'),
            gasPrice = 50000000000,
            estimatedGas = 3000000,
            amount = 0,
            selectedAccount = Helpers.getAccountByAddress(TemplateVar.getFrom('select[name="dapp-select-account"]', 'value')),
            data =  TemplateVar.get('value');

        if(selectedAccount) {

            console.log('Providing gas: ', estimatedGas ,' + 100000');



            if(selectedAccount.balance === '0')
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.emptyWallet',
                    duration: 2
                });




            // The function to send the transaction
            var sendTransaction = function(estimatedGas){

                // show loading
                // EthElements.Modal.show('views_modals_loading');

                TemplateVar.set('sending', true);


                // use gas set in the input field
                estimatedGas = estimatedGas || Number($('.send-transaction-info input.gas').val());
                console.log('Finally choosen gas', estimatedGas);

                
                // ETHER TX
            console.log('Send Ether');

            // CONTRACT TX
            if(contracts['ct_'+ selectedAccount._id]) {

                contracts['ct_'+ selectedAccount._id].execute.sendTransaction(to || '', amount || '', data || '', {
                    from: selectedAccount.owners[0],
                    gasPrice: gasPrice,
                    gas: estimatedGas
                }, function(error, txHash){

                    // TemplateVar.set('sending', false);

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

                    // TemplateVar.set('sending', false);

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
})




