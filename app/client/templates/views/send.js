/**
Template Controllers

@module Templates
*/

/**
The add user template

@class [template] views_send
@constructor
*/

/**
The query and sort option for all account queries

Set in the created callback.

@property accountQuery
*/
var accountQuery;

/**
The query and sort option for all account queries

Set in the created callback.

@property accountSort
*/
var accountSort;

/**
An empty object for the instantiated contract

@property contractInstance
*/
var contractInstance = [];

/**
Contract Functiond

@property contractFunctions
*/
var contractFunctions = [];
var abihtml = new AbiHtml();

/**
The default gas to provide for estimates. This is set manually,
so that invalid data etsimates this value and we can later set it down and show a warning,
when the user actually wants to send the dummy data.

@property defaultEstimateGas
*/
var defaultEstimateGas = 5000000;

/**
Check if the amount accounts daily limit  and sets the correct text.

@method checkOverDailyLimit
*/
var checkOverDailyLimit = function(address, wei, template){
    // check if under or over dailyLimit
    account = Helpers.getAccountByAddress(address);

    // check whats left
    var restDailyLimit = new BigNumber(account.dailyLimit || '0', 10).minus(new BigNumber(account.dailyLimitSpent || '0', 10));

    if(account && account.requiredSignatures > 1 && !_.isUndefined(account.dailyLimit) && account.dailyLimit !== ethereumConfig.dailyLimitDefault && Number(wei) !== 0) {
        if(restDailyLimit.lt(new BigNumber(wei, 10)))
            TemplateVar.set('dailyLimitText', new Spacebars.SafeString(TAPi18n.__('wallet.send.texts.overDailyLimit', {limit: EthTools.formatBalance(restDailyLimit.toString(10)), total: EthTools.formatBalance(account.dailyLimit), count: account.requiredSignatures - 1})));
        else
            TemplateVar.set('dailyLimitText', new Spacebars.SafeString(TAPi18n.__('wallet.send.texts.underDailyLimit', {limit: EthTools.formatBalance(restDailyLimit.toString(10)), total: EthTools.formatBalance(account.dailyLimit)})));
    } else
        TemplateVar.set('dailyLimitText', false);
};

/**
Add a pending transaction to the transaction list, after sending

@method addTransaction
*/
var addTransaction = function(txHash, amount, from, to, gasPrice, estimatedGas, data) {
                                
    txId = Helpers.makeId('tx', txHash);


    Transactions.upsert(txId, {$set: {
        value: amount,
        from: selectedAccount.address,
        to: to,
        timestamp: moment().unix(),
        transactionHash: txHash,
        gasPrice: gasPrice,
        gasUsed: estimatedGas,
        fee: String(gasPrice * estimatedGas),
        data: data
    }});

    // add to Account
    EthAccounts.update(selectedAccount._id, {$addToSet: {
        transactions: txId
    }});

    // add from Account
    EthAccounts.update({address: to}, {$addToSet: {
        transactions: txId
    }});
};


// Set basic variables
Template['views_send'].onCreated(function(){
    var template = this;

    // set account queries
    accountQuery = {owners: {$in: _.pluck(EthAccounts.find({}).fetch(), 'address')}, address: {$exists: true}};
    accountSort = {sort: {name: 1}};

    // set the default fee
    TemplateVar.set('amount', 0);
    TemplateVar.set('estimatedGas', 0);
    
    // check if we are still on the correct chain
    Helpers.checkChain(function(error) {
        if(error && (EthAccounts.find().count() > 0)) {
            checkForOriginalWallet();
        }
    });


    // change the amount when the currency unit is changed
    template.autorun(function(c){
        var unit = EthTools.getUnit();

        if(!c.firstRun) {
            TemplateVar.set('amount', EthTools.toWei(template.find('input[name="amount"]').value.replace(',','.'), unit));
        }
    });
});

Template['views_send'].onRendered(function(){
    var template = this;

    // focus address input field
    if(!this.data || !FlowRouter.getParam('address'))
        this.$('input[name="to"]').focus();
    else {
        this.find('input[name="to"]').value = FlowRouter.getParam('address');
        this.$('input[name="to"]').trigger('change');
    }

    // set the from
    var from = FlowRouter.getParam('from');
    if(from)
        TemplateVar.setTo('select[name="dapp-select-account"]', 'value', FlowRouter.getParam('from'));

    

    // GAS PRICE ESTIMATION
    template.autorun(function(c){
        var address = TemplateVar.getFrom('.dapp-select-account', 'value');
        var to = TemplateVar.getFrom('.dapp-address-input', 'value');
        var data = TemplateVar.getFrom('.dapp-data-textarea', 'value');

        // make reactive to the show/hide data
        TemplateVar.get('dataShown');

        if(!c.firstRun) {
            var wei = EthTools.toWei(template.find('input[name="amount"]').value.replace(',','.'));
            checkOverDailyLimit(address, wei, template);
        }

        var amount = TemplateVar.get(template, 'amount');

        // if(!web3.isAddress(to))
        //     to = '0x0000000000000000000000000000000000000000';

        // get gasprice estimation
        if(EthAccounts.findOne({address: address}, {reactive: false})) {
            web3.eth.estimateGas({
                from: address,
                to: to,
                value: amount,
                data: data,
                gas: defaultEstimateGas
            }, function(e, res){
                console.log('Estimated gas: ', res, e);
                if(!e && res) {
                    TemplateVar.set(template, 'estimatedGas', res);

                    // show note if its defaultEstimateGas, as the data is not executeable
                    if(res === defaultEstimateGas)
                        TemplateVar.set(template, 'codeNotExecutable', true);
                    else
                        TemplateVar.set(template, 'codeNotExecutable', false);
                }
            });
        } else if(wallet = Wallets.findOne({address: address}, {reactive: false})) {
            if(contracts['ct_'+ wallet._id])
                contracts['ct_'+ wallet._id].execute.estimateGas(to || '', amount || '', data || '',{
                    from: wallet.owners[0],
                    gas: defaultEstimateGas
                }, function(e, res){
                    console.log('Estimated gas: ', res, e);
                    if(!e && res) {
                        TemplateVar.set(template, 'estimatedGas', res);

                        // show note if its defaultEstimateGas, as the data is not executeable
                        if(res === defaultEstimateGas)
                            TemplateVar.set(template, 'codeNotExecutable', true);
                        else
                            TemplateVar.set(template, 'codeNotExecutable', false);
                        }
                });
        }
    });
});


Template['views_send'].helpers({
    /**
    Get all current accounts

    @method (fromAccounts)
    */
    'fromAccounts': function(){
        return _.union(Wallets.find(accountQuery, accountSort).fetch(), EthAccounts.find({}, accountSort).fetch());
    },
    /**
    Get the current estimatedGas.

    @method estimatedGas
    */
    'estimatedGas': function(){
        return TemplateVar.get('estimatedGas');
    },
    /**
    Return the current sepecified amount (finney)

    @method (amount)
    */
    'amount': function(){
        return EthTools.formatBalance(TemplateVar.get('amount'), '0,0.[000000] UNIT')
    },
    /**
    Return the currently selected fee + amount

    @method (total)
    */
    'total': function(ether){
        if(!_.isFinite(TemplateVar.get('amount')))
            return '0';

        var gasInWei = TemplateVar.getFrom('.dapp-select-gas-price', 'gasInWei') || '0';
        var amount = new BigNumber(TemplateVar.get('amount'), 10).plus(new BigNumber(gasInWei, 10));
        return (ether)
            ? EthTools.formatBalance(amount, '0,0.00[000000] UNIT', ether)
            : EthTools.formatBalance(amount, '0,0.00[000000] UNIT');
    },
    /**
    Returns the right time text for the "sendText".

    @method (timeText)
    */
    'timeText': function(){
        return TAPi18n.__('wallet.send.texts.timeTexts.'+ ((Number(TemplateVar.getFrom('.dapp-select-gas-price', 'feeMultiplicator')) + 5) / 2).toFixed(0));
    },
    /**
    Shows correct explanation for token type

    @method (sendExplanation)
    */
    'sendExplanation': function(e, amount){

        var amount = TemplateVar.get("tokenAmount") || 0;
        var unit = EthTools.getUnit();

       

        var selectedAccount = TemplateVar.getFrom('.dapp-select-account', 'value');
        var address = TemplateVar.get('tokenAddress');
        var tokenId = Helpers.makeId('token', address);
        token = Tokens.findOne(tokenId);
    
        balance = Balances.findOne({token: address, account: selectedAccount});

        if (!balance) balance = {tokenBalance:0};

        var formattedAmount = Helpers.formatNumberDecimals(amount * Math.pow(10, token.decimals), token.decimals);
        var formattedBalance = Helpers.formatNumberDecimals(balance.tokenBalance, token.decimals);

        return Spacebars.SafeString(TAPi18n.__('wallet.send.texts.sendToken', {amount:formattedAmount, name: token.name, balance: formattedBalance , symbol: token.symbol})); 
        
    },
    /**
    Gets currently selected unit

    @method (selectedUnit)
    */
    'selectedToken': function(returnText){
        console.log(returnText)
        // var unit = _.find(units, function(unit){
        //     return unit.value === EthTools.getUnit();
        // });

        // if(unit)
        //     return (returnText === true) ? unit.text : unit.value;
    },
    /**
    Gets currently selected unit

    @method (selectedUnit)
    */
    'showTo': function(returnText){
        return TemplateVar.get("hideTo");
    },
    /**

    */
    'unitsAndTokens' : function(){
        units = [];

        var tokens = Tokens.find({},{sort:{symbol:1}});
        tokens.forEach(function(token){
            var el = { 
                text: token.name.toUpperCase(),
                value: "tk_"+ token.address 
            }
            units.push(el);
        })


        return units;
    },
    /**
    Get all tokens

    @method (tokens)
    */
    'tokens': function(){
        console.log(Tokens.find({},{sort:{symbol:1}}));
        return Tokens.find({},{sort:{symbol:1}});
    },
    /**
    Get Balance of a Coin

    @method (getBalance)
    */
    'formattedCoinBalance': function(e){

        var tokenAddress = this.address;
        var accountAddress = TemplateVar.getFrom('.dapp-select-account', 'value');

        var balance = Balances.findOne({token:tokenAddress, account: accountAddress});
        console.log(balance);
        var token = Tokens.findOne({address:tokenAddress });

        if (balance) {
            var tokenBalance = balance.tokenBalance / Math.pow(10, token.decimals) ;
        } else {
            var tokenBalance = 0 ;
        }
        
        var formattedAmount = Helpers.formatNumberDecimals(tokenBalance * Math.pow(10, token.decimals), token.decimals)

        return formattedAmount + ' ' + token.symbol;

    },
    /**
    Check if to account has code

    @method (accountHasCode)
    */
    'accountHasCode': function(e){
        //0x22a037ffc313beb81cd756151bd504653f7b983d
        //0xa3687db9e245f5ad8a70123f9df0237c11ffc362

        var contract = TemplateVar.getFrom('.dapp-address-input', 'value') || FlowRouter.getParam('address');
        var code = web3.eth.getCode(contract);

        return code != "0x";
    },
    /**
    Get Functions

    @method (tokens)
    */
    'listContractFunctions': function(){
        console.log("remake array");
        return contractFunctions;
    }
});


Template['views_send'].events({
    /**
    Show the extra data field
    
    @event click button.show-data
    */
    'click button.show-data': function(e){
        e.preventDefault();
        TemplateVar.set('showData', true);
    },
    /**
    Show the extra data field
    
    @event click button.hide-data
    */
    'click button.hide-data': function(e){
        e.preventDefault();
        TemplateVar.set('showData', false);
        TemplateVar.set('dataShown', false);
    },
    /**
    Action Switcher
    
    @event click .select-action label
    */
    'click .select-action label': function(e){
        var option = e.currentTarget.getAttribute("for");
        TemplateVar.set("selectAction", option);
        TemplateVar.set('showExecuteContract', false);

        if (option != "upload-contract") {
            
        }

        if (option == "upload-contract" ) {
            TemplateVar.set('savedTo', document.querySelector("input[name='to']").value )
            document.querySelector("input[name='to']").value = "";

            TemplateVar.set('showData', true);
            TemplateVar.set('hideTo', true);
            TemplateVar.set('dataShown', true);
            TemplateVar.set('showSendToken', false);

        } else {
            TemplateVar.set('showData', false);
            TemplateVar.set('dataShown', false);
            TemplateVar.set('hideTo', false);
            TemplateVar.set('showSendToken', false);

            if (document.querySelector("input[name='to']").value == "" && TemplateVar.get('savedTo'))
                document.querySelector("input[name='to']").value = TemplateVar.get('savedTo');
        }

        if (option == "send-token") {
            TemplateVar.set('showSendToken', true)
        } else if (option == "execute-contract") {
            TemplateVar.set('showExecuteContract', true)
        }


    },
    /**
    Set the amount while typing
    
    @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
    */
    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(e, template){
        var wei = EthTools.toWei(e.currentTarget.value.replace(',','.'));
        TemplateVar.set('amount', wei || '0');

        checkOverDailyLimit(template.find('select[name="dapp-select-account"]').value, wei, template);
    },
    /**
    Change the ABI
    
    @event keyup input[name="abi"], change input[name="abi"], input input[name="abi"]
    */
    'keyup input[name="abi"], change input[name="abi"], input input[name="abi"]': function(e, template){
        var ABI = JSON.parse(e.currentTarget.value);
        var address = TemplateVar.getFrom('.dapp-address-input', 'value');
        contractInstance = web3.eth.contract(ABI).at(address);

        // Settable properties to override default behavior
        var properties = {
            events: {
                renderCallback: function() {}
            },
            functions: {
                callButtonText: 'Read',
                transactButtonText: 'Update',
                renderCallback: function(htmlDoc) {
                    console.log("asdasda");
                    document.getElementById('execute-functions').appendChild(htmlDoc)
                }
            }
        }


        // Instantiate library with abi and optional properties
        var abihtml = new AbiHtml(e.currentTarget.value, properties);
        document.getElementById('execute-functions').innerHTML = "";
        contractFunctions = [{"name":"Alice"}, {"name": "Eve"}]
        var functionHtmls = "";

        abihtml.functions.forEach(function(func) {

            console.log(func);
            contractFunctions.push({"name":func.abiItem.name});

            functionHtmls +="<option value='function" + func.abiItem.name + "'>" + func.abiItem.name + "</option>";

            func.generateHtml()
        })

        document.getElementById('select-function').innerHTML = functionHtmls;

        console.log(contractFunctions);

        /*
        [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"receiver","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"sufficient","type":"bool"}],"type":"function"},{"inputs":[{"name":"supply","type":"uint256"}],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"},{"indexed":false,"name":"receiver","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Transfer","type":"event"}]
        */


    },
    /**
    Select function name
    
    @event change select-function
    */
    'keyup change select[name="select-function"]': function(e, template){

        console.log(e.currentTarget.value);    
    },
    /**
    Set the token amount while typing
    
    @event keyup input[name="token-amount"], change input[name="token-amount"], input input[name="token-amount"]
    */
    'keyup input[name="token-amount"], change input[name="token-amount"], input input[name="token-amount"]': function(e, template){

        TemplateVar.set("tokenAmount", e.currentTarget.value);    
    },
    /**
    Selected a token for the first time
    
    @event 'click .select-token
    */
    'click .select-token ': function(e, template){
        $(e.currentTarget).removeClass("unselected");  

        var form = document.getElementsByClassName("account-send-form")[0]
        TemplateVar.set("tokenAddress", form.elements["choose-token"].value) 
    },
    /**
    Submit the form and send the transaction!
    
    @event submit form
    */
    'submit form': function(e, template){

        var amount = TemplateVar.get('amount') || '0',
            to = TemplateVar.getFrom('.dapp-address-input', 'value'),
            data = TemplateVar.getFrom('.dapp-data-textarea', 'value');
            gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
            estimatedGas = TemplateVar.get('estimatedGas'),
            tokenAddress = TemplateVar.get('tokenAddress'),
            selectedAccount = Helpers.getAccountByAddress(template.find('select[name="dapp-select-account"]').value);


            


        if(selectedAccount && !TemplateVar.get('sending')) {

            // set gas down to 21 000, if its invalid data, to prevent high gas usage.
            if(estimatedGas === defaultEstimateGas || estimatedGas === 0)
                estimatedGas = 21000;


            console.log('Providing gas: ', estimatedGas ,' + 100000');


            if(selectedAccount.balance === '0')
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.emptyWallet',
                    duration: 2
                });


            


            if(!web3.isAddress(to) && !data)
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.noReceiver',
                    duration: 2
                });

            if (TemplateVar.get("selectAction") == "send-token") {
                
                var tokenId = Helpers.makeId('token', tokenAddress);
                token = Tokens.findOne(tokenId);
                balance = Balances.findOne({token: tokenAddress, account: template.find('select[name="dapp-select-account"]').value});
                if (!balance) balance = {tokenBalance:0};
                var tokenAmount = TemplateVar.get("tokenAmount")*Math.pow(10, token.decimals) || 0;

                if( tokenAmount > balance.tokenBalance)
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });

            } else {

                if((_.isEmpty(amount) || amount === '0' || !_.isFinite(amount)) && !data)
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.noAmount',
                    duration: 2
                });

                if(new BigNumber(amount, 10).gt(new BigNumber(selectedAccount.balance, 10)))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });
            }
            


            // The function to send the transaction
            var sendTransaction = function(estimatedGas){

                // show loading
                // EthElements.Modal.show('views_modals_loading');

                TemplateVar.set(template, 'sending', true);


                // use gas set in the input field
                estimatedGas = estimatedGas || Number($('.send-transaction-info input.gas').val());
                console.log('Finally choosen gas', estimatedGas);

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

                            addTransaction(txHash, amount, selectedAccount.address, to, gasPrice, estimatedGas, data);

                            FlowRouter.go('dashboard');

                        } else {
                            // EthElements.Modal.hide();

                            GlobalNotification.error({
                                content: error.message,
                                duration: 8
                            });
                        }
                    });

                // TOKEN TRANSACTION
                } else if(TemplateVar.get("selectAction") == "send-token") {

                    var tokenInstance = web3.eth.contract(tokenABI).at(tokenAddress);
                    console.log(tokenInstance);


                    tokenInstance.transfer.sendTransaction(to, tokenAmount,  {
                        from: selectedAccount.address,
                        to: tokenAddress,
                        value: 0,
                        data: data,
                        gasPrice: gasPrice,
                        gas: estimatedGas
                    }, function(error, txHash){

                        TemplateVar.set(template, 'sending', false);

                        console.log(error, txHash);
                        if(!error) {
                            console.log('SEND TOKEN');

                            addTransaction(txHash, amount, selectedAccount.address, to, gasPrice, estimatedGas, data);


                            FlowRouter.go('dashboard');
                            GlobalNotification.warning({
                                content: 'token sent',
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

                            addTransaction(txHash, amount, selectedAccount.address, to, gasPrice, estimatedGas, data);

                            FlowRouter.go('dashboard');
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

            // SHOW CONFIRMATION WINDOW when NOT MIST
            if(typeof mist === 'undefined') {
                EthElements.Modal.question({
                    template: 'views_modals_sendTransactionInfo',
                    data: {
                        from: selectedAccount.address,
                        to: to,
                        amount: amount,
                        gasPrice: gasPrice,
                        estimatedGas: estimatedGas,
                        estimatedGasPlusAddition: estimatedGas + 100000, // increase the provided gas by 100k
                        data: data
                    },
                    ok: sendTransaction,
                    cancel: true
                },{
                    class: 'send-transaction-info'
                });

            // LET MIST HANDLE the CONFIRMATION
            } else {
                sendTransaction(estimatedGas + 100000);
            }
        }
    }
});


