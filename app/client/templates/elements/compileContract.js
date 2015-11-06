/**
Template Controllers

@module Templates
*/

/**
The compile contract template

Example usage

    {{> elements_compileContract onlyByteCode=true/false codeNotExecutable=true/false}}

@class [template] elements_compileContract
@constructor
*/
Template['elements_compileContract'].onCreated(function() {
    var template = this;

    // set the default
    TemplateVar.set('value', '');
    TemplateVar.set('selectedType', this.data.onlyByteCode ? 'byte-code' : 'source-code');

    // focus the editors
    this.autorun(function(c) {
        // react in the selectedType
        var value = TemplateVar.get('selectedType');

        // focus the editors
        if(!c.firstRun) {
            Tracker.afterFlush(function() {
                if(value === 'byte-code')
                    template.$('.dapp-data-textarea').focus();
                else
                    template.aceEditor.focus();
            });
        }
    });

    // update and generate the contract data 
    this.autorun(function() {
        var selectedContract = TemplateVar.get("selectedContract");
        var constructorInputs = _.clone(TemplateVar.get("constructorInputs"));

        if(!selectedContract)
            return;


        if(!_.isArray(constructorInputs) || _.isEmpty(constructorInputs)) {
            constructorInputs = _.map(selectedContract.constructorInputs, function() {
                return '';
            });
        }

        // add the default web3 sendTransaction arguments
        constructorInputs.push({
            data: selectedContract.bytecode
        });

        // generate new contract code
        TemplateVar.set('value', web3.eth.contract(selectedContract.abi).new.getData.apply(null, constructorInputs));
    });
});

editor = {};
Template['elements_compileContract'].onRendered(function() {
    var template = this;

    this.aceEditor = ace.edit("contract-source-editor");
    this.aceEditor.setOptions({
        useWorker: false,
        minLines: 10,
        maxLines: 30,
        highlightActiveLine: false
    });
    this.aceEditor.setTheme("ace/theme/tomorrow");
    this.aceEditor.getSession().setMode("ace/mode/typescript");
    this.aceEditor.$blockScrolling = Infinity;
    this.aceEditor.focus();

    this.aceEditor.setValue("contract MyContract {\n"+
"    /* Constructor */\n"+
"    function MyContract() {\n"+
" \n"+
"    }\n"+
"}");
    this.aceEditor.selection.selectTo(0);

    editor = this.aceEditor;

    // WATCH FOR CHANGES
    this.aceEditor.getSession().on('change', _.debounce(function(e) {
        var sourceCode = template.aceEditor.getValue();

        TemplateVar.set(template, 'compiling', true);
        TemplateVar.set(template, 'compileError', false);
        // TemplateVar.set(template, 'compiledContracts', false);
        // TemplateVar.set(template, 'selectedContract', false);

        Meteor.setTimeout(function(argument) {
            web3.eth.compile.solidity(sourceCode, function(error, compiledContracts){
                

                // read the fields again
                Tracker.afterFlush(function() {
                    TemplateVar.set(template, 'compiling', false);
                    template.$('.abi-input').trigger('input');
                });


                if(!error) {

                    compiledContracts = _.map(compiledContracts, function(contract, name){
                        var abi = JSON.parse(contract.interface);
                        
                        // find the constructor function
                        var constructor = _.find(abi, function(func){
                            return func.type == 'constructor';
                        });

                        // substring the type so that string32 and string16 wont need different templates
                        if(constructor) {
                            _.each(constructor.inputs, function(input){
                                input.typeShort = input.type.match(/[a-z]+/i);
                                input.typeShort = input.typeShort[0];
                                input.bits = input.type.replace(input.typeShort, '');
                                input.template =  'elements_input_'+ input.typeShort;
                            })
                        } else {
                            constructor = {
                                inputs: []
                            };
                        }

                        var simplifiedContractObject = {
                            name: name,
                            bytecode: contract.bytecode,
                            abi: abi,
                            constructorInputs: constructor.inputs
                        };
                        
                        TemplateVar.set(template, 'selectedContract', simplifiedContractObject); 
                        
                        return simplifiedContractObject;
                    })

                    TemplateVar.set(template, 'compiledContracts', compiledContracts);


                } else {
                    console.log(error);
                    // Doesnt compile in solidity either, throw error
                    TemplateVar.set(template, 'compileError', error);

                    TemplateVar.set(template, 'compiledContracts', false);
                    TemplateVar.set(template, 'selectedContract', false);
                }
            });
            
        }, 100);
    }, 600));
});

Template['elements_compileContract'].onDestroyed(function() {
    if(this.aceEditor)
        this.aceEditor.destroy();
});

Template['elements_compileContract'].helpers({
    /**
    This helper will react to changes of the data context

    @method (reactiveContext)
    */
    'reactiveContext': function() {
        if(this.onlyByteCode) {
            TemplateVar.set('selectedType', 'byte-code');

            Tracker.nonreactive(function(){
                if(_.isEmpty(TemplateVar.getFrom('.dapp-data-textarea', 'value')))
                    TemplateVar.set('show', false);
            });

        } else {
            TemplateVar.set('show', true);
        }
    },
    /**
    Get selected contract functions

    @method (selectedContractInputs)
    */
    'selectedContractInputs' : function(){
        selectedContract = TemplateVar.get('selectedContract');
        return selectedContract ? selectedContract.constructorInputs : [];
    }
});


Template['elements_compileContract'].events({
    /**
    Show the extra data field
    
    @event click button.show-data
    */
    'click button.show-data': function(e){
        e.preventDefault();
        TemplateVar.set('show', true);
    },
    /**
    Show the extra data field
    
    @event click button.hide-data
    */
    'click button.hide-data': function(e){
        e.preventDefault();
        TemplateVar.set('show', false);
    },
    /**
    Textfield switcher
    
    @event click .dapp-segmented-control input
    */
    'click .dapp-segmented-control input': function(e, template){
        TemplateVar.set('selectedType', e.currentTarget.value);
    },
    /**
    Selected a contract function
    
    @event 'change .contract-functions
    */
    'change .compiled-contracts': function(e, template){
        // get the correct contract
        var selectedContract = _.find(TemplateVar.get('compiledContracts'), function(contract){
            return contract.name == e.currentTarget.value;
        })

        // change the inputs and data field
        TemplateVar.set('selectedContract', selectedContract);
    },
    /**
    Compile the solidty code, when
    
    @event change abi-input, input .abi-input
    */
    'change .abi-input, input .abi-input': function(e, template){
        
        var selectedContract = TemplateVar.get("selectedContract");

        // create an array with the input fields
        var contractArguments = [];

        _.each(template.findAll('.abi-input'), function(input, index){
            var output = (selectedContract.constructorInputs[index].typeShort === 'bool') ? input.checked: input.value;

            console.log('output', output);

            // force 0x at the start
            if(!_.isEmpty(output) &&
               (selectedContract.constructorInputs[index].typeShort === 'bytes' ||
               selectedContract.constructorInputs[index].typeShort === 'address'))
                output = '0x'+ output.replace('0x','');

            contractArguments.push(output);
        })

        TemplateVar.set('constructorInputs', contractArguments);
    }
});