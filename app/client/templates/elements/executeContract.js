
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
    TemplateVar.set('value', '0xdeadbeef');

    TemplateVar.set("toAddress", this.data.to);
    TemplateVar.set('sending', false);


    // update the abi
    this.autorun(function(){

    })

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

        if (TemplateVar.get("executionVisible"))
            var contractInstance = web3.eth.contract(contractABI).at(TemplateVar.get("toAddress"));

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
        
            

        
       

        // call constants
        console.log("CONSTANTS")        
        var contractConstants = TemplateVar.get("contractConstants");
        _.each(contractConstants, function(constant){            
            
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
        
        var ABIstring = e.currentTarget.value;
        var ABI = JSON.parse(ABIstring);

        console.log('ABI');
        console.log( ABI );

        if (typeof ABI == 'object') {

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
                        // console.log('e.parameters');
                        // console.log(e.parameters);
                        
                        contractConstants.push(e);                    
                    } else {
                        //if its a variable
                        contractFunctions.push(e);                
                        // TemplateVar.set("selectedFunction", e); 
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
            // $('.abi-input').change();

            contractInfo = Helpers.getAccountByAddress(TemplateVar.get("toAddress"));
            // Save new name
            Wallets.update(contractInfo._id, {$set: {
                interface: ABIstring
            }});
            console.log('saved abi')

            console.log(Wallets.findOne(contractInfo._id));

            console.log(contractInfo)
            // console.log(ABI)

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
            // console.log(input);
            // console.log(input.checked);

            var output = input.value;

            if(input.type == 'checkbox')
                output = input.checked;

            // console.log(output);

            // force 0x at the start
            if(selectedFunction && !_.isEmpty(output) &&
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




