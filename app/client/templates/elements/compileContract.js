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
    TemplateVar.set('constructorInputs', []);
    TemplateVar.set('selectedType', this.data.onlyByteCode ? 'byte-code' : 'source-code');
    TemplateVar.set('compiledContracts', JSON.parse(localStorage['compiledContracts'] || null));
    TemplateVar.set('selectedContract', JSON.parse(localStorage['selectedContract'] || null));

    // check for the splitter Contract
    var splitContractAddress = '0x1ca4a86bba124426507d1ef67ad271cc5a02820a';
    TemplateVar.set(template, 'hasSplitter', false);
    
    web3.eth.getCode(splitContractAddress, function(e,c) {
        if (!e && c.length > 2)
            TemplateVar.set(template, 'hasSplitter', true);
    })

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


    // re-run the compile data, to assure that remote elements are made reactive
    var runDelayed = new Tracker.Dependency;

    setTimeout(function(){
        runDelayed.changed();
        runDelayed = null;
    }, 1000);

    // update and generate the contract data 
    this.autorun(function() {

        if(runDelayed)
            runDelayed.depend();
        
        // selected contract
        var selectedContract = TemplateVar.get('selectedContract');
        var constructorInputs = _.clone(TemplateVar.get('constructorInputs'));
        var selectedToken = TemplateVar.getFrom('.select-token', 'selectedToken');
        var mainRecipient = TemplateVar.getFrom('div.dapp-address-input input.to', 'value');
        var replayProtectionOn = TemplateVar.get('replay-protection-checkbox');
        var selectedType = TemplateVar.get('selectedType');
        var textareaData = TemplateVar.getFrom('.dapp-data-textarea', 'value');

        if(selectedType === 'source-code' && selectedContract){        
                // add the default web3 sendTransaction arguments
                constructorInputs.push({
                    data: selectedContract.bytecode
                });
        
                // generate new contract code
                TemplateVar.set('value', web3.eth.contract(selectedContract.jsonInterface).new.getData.apply(null, constructorInputs));
                TemplateVar.set('contract', selectedContract);
        
                // Save data to localstorage
                localStorage.setItem('selectedContract', JSON.stringify(selectedContract));
        
        } else {
            var sendData = amount = token = '';

            // Bytecode Data
            if (replayProtectionOn){
                // set up the splitter
                var splitterInterface = [ { "constant": false, "inputs": [ { "name": "recipient", "type": "address" }, { "name": "altChainRecipient", "type": "address" }, { "name": "tokenAddress", "type": "address" }, { "name": "amount", "type": "uint256" } ], "name": "tokenSplit", "outputs": [ { "name": "", "type": "bool" } ], "type": "function" }, { "constant": false, "inputs": [ { "name": "recipient", "type": "address" }, { "name": "altChainRecipient", "type": "address" } ], "name": "etherSplit", "outputs": [ { "name": "", "type": "bool" } ], "type": "function" }];
                var splitterContract = web3.eth.contract(splitterInterface).at(splitContractAddress);
                var altRecipient = TemplateVar.get('replay-protection-to');

                if (!selectedToken || selectedToken == 'ether') { 
                    // send ether with replay protection       
                    sendData = splitterContract.etherSplit.getData( mainRecipient, altRecipient, {});
                } else {
                    // send token with replay protection
                    amount = TemplateVar.getFrom('.amount input[name="amount"]', 'amount') || '0';
                    token = Tokens.findOne({address: selectedToken});                

                    sendData = splitterContract.tokenSplit.getData( mainRecipient, altRecipient, selectedToken, amount,  {});
                }      
            } else {
                if (!selectedToken || selectedToken === 'ether') {
                    // send ether without replay protection        
                    sendData = (TemplateVar.get('show')) ? textareaData : '';
                } else {
                    // send tokens without replay protection
                    amount = TemplateVar.getFrom('.amount input[name="amount"]', 'amount') || '0';
                    token = Tokens.findOne({address: selectedToken});                
                    var tokenInstance = TokenContract.at(selectedToken);
                    sendData = tokenInstance.transfer.getData( mainRecipient, amount,  {});
                } 
            }
            TemplateVar.set("value", sendData);   
        }

    });
});

editor = {};
Template['elements_compileContract'].onRendered(function() {
    var template = this;

    this.aceEditor = ace.edit('contract-source-editor');
    this.aceEditor.setOptions({
        useWorker: false,
        minLines: 10,
        maxLines: 30,
        highlightActiveLine: false
    });
    this.aceEditor.setTheme('ace/theme/tomorrow');
    this.aceEditor.getSession().setMode('ace/mode/typescript');
    this.aceEditor.$blockScrolling = Infinity;
    this.aceEditor.focus();

    var defaultCode = localStorage['contractSource'] || "contract MyContract {\n    /* Constructor */\n    function MyContract() {\n \n    }\n}";

    this.aceEditor.setValue(defaultCode);
    this.aceEditor.selection.selectTo(0);

    editor = this.aceEditor;

    // WATCH FOR CHANGES
    this.aceEditor.getSession().on('change', _.debounce(function(e) {
        var sourceCode = template.aceEditor.getValue();

        localStorage.setItem('contractSource', sourceCode);

        TemplateVar.set(template, 'compiling', true);
        TemplateVar.set(template, 'compileError', false);

        Meteor.setTimeout(function(argument) {
            web3.eth.compile.solidity(sourceCode, function(error, compiledContracts){
                

                // read the fields again
                Tracker.afterFlush(function() {
                    TemplateVar.set(template, 'compiling', false);
                    template.$('.abi-input').trigger('input');
                });

                // clean all error markers
                _.each(editor.session.$backMarkers, function(i) { 
                    editor.session.removeMarker(i.id);
                })

                if(!error) {

                    compiledContracts = _.map(compiledContracts, function(contract, name){
                        var jsonInterface = JSON.parse(contract.interface);
                        
                        // find the constructor function
                        var constructor = _.find(jsonInterface, function(func){
                            return func.type == 'constructor';
                        });

                        // substring the type so that string32 and string16 wont need different templates
                        if(constructor) {
                            
                            constructor.inputs = _.map(constructor.inputs, Helpers.createTemplateDataFromInput)
                        } else {
                            constructor = {
                                inputs: []
                            };
                        }


                        return {
                            name: name,
                            bytecode: contract.bytecode,
                            jsonInterface: jsonInterface,
                            constructorInputs: constructor.inputs
                        };
                    });

                    TemplateVar.set(template, 'selectedContract', null);
                    TemplateVar.set(template, 'compiledContracts', compiledContracts);
                    localStorage.setItem('compiledContracts', JSON.stringify(compiledContracts));


                } else {
                    // Converts error into multiple bits
                    var errorLine = error.toString().split(':');

                    if (errorLine.length < 4) {
                        // If it can't break the error then return all
                        TemplateVar.set(template, 'compileError', error);
                    } else {
                        // Finds a ^____^ pattern
                        var foundPattern = errorLine[5].match(/(\^-*\^)/g);
                        var errorLength = (foundPattern)? foundPattern[0].length : 0;

                        // Hightlights the error
                        var Range = ace.require('ace/range').Range;
                        editor.session.addMarker(new Range(errorLine[2]-1, 0, errorLine[2]-1, 200), "errorMarker");
                        editor.session.addMarker(new Range(errorLine[2]-1, errorLine[3]-1, errorLine[2]-1, Number(errorLine[3]) + errorLength), "errorMarker");

                        // Doesnt compile in solidity either, throw error
                        TemplateVar.set(template, 'compileError', errorLine[5]);  
                    }
                    
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
                if(_.isEmpty(TemplateVar.getFrom('.dapp-data-textarea', 'value'))) {
                    TemplateVar.set('show', false);
                }
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
    },
    /**
    List options on the replay attack selector

    @method (replayAttackOptions)
    */
    'replayAttackOptions' : function(){
        return [{value:"foo", text:"prevent it from being accepted"},{value:"bar", text:"send to this address:"}];
    },
    /**
    return accounts 

    @method replayAttackAccounts
    */
    'replayAttackList' : function() {
        var accounts = EthAccounts.find({balance:"0"}, {sort: {name: 1}}).fetch();
    
        accounts = _.union(Wallets.find({balance:"0", owners: {$in: _.pluck(accounts, 'address')}, address: {$exists: true}}, {sort: {balance: 1}}).fetch(), accounts);
        
        accounts.unshift({address:'ban', name: TAPi18n.__('wallet.send.backToSender')});
        accounts.push({address:'question', name: TAPi18n.__('wallet.send.otherAccount')});
        return accounts;
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
    'click button.hide-data': function(e, template){
        e.preventDefault();
        TemplateVar.setTo('.dapp-data-textarea', 'value', '');
        Tracker.afterFlush(function(){
            TemplateVar.set(template, 'show', false);
        });
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
        // set a contract as selected
        var compiledContracts = TemplateVar.get('compiledContracts');

        _.each(compiledContracts, function(contract){
            contract.selected = contract.name == e.currentTarget.value;
        })

        // get the correct contract
        var selectedContract = _.find(compiledContracts, function(contract){
            return contract.selected;
        })

        // change the inputs and data field
        TemplateVar.set('selectedContract', selectedContract);
        TemplateVar.set('compiledContracts', compiledContracts);
        localStorage.setItem('compiledContracts', JSON.stringify(compiledContracts));

        Tracker.afterFlush(function(){
            // Run all inputs through formatter to catch bools
            template.$('.abi-input').trigger('change');
        });
    },
    /**
    Compile the solidty code, when
    
    @event change abi-input, input .abi-input
    */
    'change .abi-input, input .abi-input': function(e, template){
        var selectedContract = TemplateVar.get("selectedContract");
        var inputs = Helpers.addInputValue(selectedContract.constructorInputs, this, e.currentTarget);

        TemplateVar.set('constructorInputs', inputs);
    },
    /**
    Change the number of signatures

    @event click span[name="multisigSignatures"] .simple-modal button
    */
    'change select.replay-protection-to': function(e){
        var selection = $(e.currentTarget)[0].options[$(e.currentTarget)[0].selectedIndex].value;

        if (selection == 'question') {
            TemplateVar.set('show-address-field',  true);
        } else if (web3.isAddress(selection)){
            TemplateVar.set('replay-protection-to',  selection);
        }  else {
            TemplateVar.set('replay-protection-to',  '');
        } 
    }, 
    /**
    Change the address

    @event click span[name="multisigSignatures"] .simple-modal button
    */
    'blur input.alt-chain-recipient': function(e){
        var value =  e.currentTarget.value;

        if (value=='') {
            TemplateVar.set('show-address-field',  false);
            TemplateVar.set('replay-protection-to',  '');            
        } else if (web3.isAddress(value)) {
            TemplateVar.set('replay-protection-to', value);
        } else {
            TemplateVar.set('replay-protection-to', '');
        }
    },
    /**
    Check the replay protection box

    @event change input[type="checkbox"].replay-protection
    */
    'change input[type="checkbox"].replay-protection': function(e){
        var value = e.currentTarget.checked;
        TemplateVar.set('replay-protection-checkbox', value);
    },
    /**
    Change the data

    @event change textarea.dapp-data-textarea
    */
    'change textarea.dapp-data-textarea': function(e){
        var value = e.currentTarget.value;
        TemplateVar.set('value', value);
    }
});