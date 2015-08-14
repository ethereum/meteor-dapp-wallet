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
Check if the amount accounts daily limit  and sets the correct text.

@property checkOverDailyLimit
*/
var checkOverDailyLimit = function(address, wei, template){

    // check if under or over dailyLimit
    account = Helpers.getAccountByAddress(address);

    if(account && account.requiredSignatures > 1 && account.dailyLimit && account.dailyLimit !== ethereumConfig.dailyLimitDefault && Number(wei) !== 0) {
        if(Number(account.dailyLimit) < Number(wei))
            TemplateVar.set('dailyLimitText', new Spacebars.SafeString(TAPi18n.__('wallet.send.texts.overDailyLimit', {limit: EthTools.formatBalance(account.dailyLimit), count: account.requiredSignatures - 1})));
        else
            TemplateVar.set('dailyLimitText', new Spacebars.SafeString(TAPi18n.__('wallet.send.texts.underDailyLimit', {limit: EthTools.formatBalance(account.dailyLimit)})));
    } else
        TemplateVar.set('dailyLimitText', false);
};



// Set basic variables
Template['views_send'].onCreated(function(){
    var template = this;

    // set account queries
    accountQuery = {owners: {$in: _.pluck(EthAccounts.find({}).fetch(), 'address')}, address: {$exists: true}};
    accountSort = {sort: {balance: -1}};

    // set the default fee
    TemplateVar.set('amount', 0);
    TemplateVar.set('estimatedGas', 0);

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
    if(!this.data || !this.data.address)
        this.$('input[name="to"]').focus();
    else {
        this.find('input[name="to"]').value = this.data.address;
        this.$('input[name="to"]').trigger('change');
    }

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
                gas: 3000000 // TODO remove, once issue #1590 is fixed
            }, function(e, res){
                if(!e && res) {
                    TemplateVar.set(template, 'estimatedGas', res);
                    console.log('Estimated gas: ', res);
                }
            });
        } else if(wallet = Wallets.findOne({address: address}, {reactive: false})) {
            if(contracts['ct_'+ wallet._id])
                contracts['ct_'+ wallet._id].execute.estimateGas(to, amount, data || '',{
                    from: wallet.owners[0],
                    gas: 3000000 // TODO remove, once issue #1590 is fixed
                }, function(e, res){
                    if(!e && res) {
                        TemplateVar.set(template, 'estimatedGas', res);
                        console.log('Estimated gas: ', res);
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
    Set the amount while typing
    
    @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
    */
    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(e, template){
        var wei = EthTools.toWei(e.currentTarget.value.replace(',','.'));
        TemplateVar.set('amount', wei || '0');

        checkOverDailyLimit(template.find('select[name="dapp-select-account"]').value, wei, template);
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
            selectedAccount = Helpers.getAccountByAddress(template.find('select[name="dapp-select-account"]').value);


        if(selectedAccount && !TemplateVar.get('sending')) {

            console.log('Providing gas: ', estimatedGas ,' + 100000');


            if(selectedAccount.balance === '0')
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.emptyWallet',
                    duration: 2
                });


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

            if(!web3.isAddress(to) && !data)
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.noReceiver',
                    duration: 2
                });



            EthElements.Modal.question({
                template: 'views_modals_sendTransactionInfo',
                data: {
                    from: selectedAccount.address,
                    to: to,
                    amount: amount,
                    gasPrice: gasPrice,
                    estimatedGas: estimatedGas,
                    data: data
                },
                ok: function(){

                    TemplateVar.set(template, 'sending', true);

                    // CONTRACT TX
                    if(contracts['ct_'+ selectedAccount._id]) {

                        contracts['ct_'+ selectedAccount._id].execute.sendTransaction(to, amount, data || '', {
                            from: selectedAccount.owners[0],
                            gasPrice: gasPrice,
                            gas: estimatedGas + 100000 // should be 36094
                        }, function(error, txHash){

                            TemplateVar.set(template, 'sending', false);

                            console.log(error, txHash);
                            if(!error) {
                                console.log('SEND from contract', amount);

                                // txId = Helpers.makeId('tx', txHash);

                                // // TODO: remove after we have pending logs?
                                // Transactions.insert({
                                //     _id: txId,
                                //     value: amount,
                                //     from: selectedAccount.address,
                                //     to: to,
                                //     timestamp: moment().unix(),
                                //     transactionHash: txHash,
                                //     // blockNumber: null,
                                //     // blockHash: null,
                                //     // transactionIndex: null,
                                //     // logIndex: null
                                // });

                                Router.go('/');

                            } else {
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
                            gas: estimatedGas + 100000 // add 50000 to be safe // should be 22423
                        }, function(error, txHash){

                            TemplateVar.set(template, 'sending', false);

                            console.log(error, txHash);
                            if(!error) {
                                console.log('SEND simple');


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
                                    // blockNumber: null,
                                    // blockHash: null,
                                    // transactionIndex: null,
                                    // logIndex: null
                                }});

                                // add to Account
                                EthAccounts.update(selectedAccount._id, {$addToSet: {
                                    transactions: txId
                                }});

                                Router.go('/');
                            } else {
                                GlobalNotification.error({
                                    content: error.message,
                                    duration: 8
                                });
                            }
                        });
                    }
                },
                cancel: true
            },{
                class: 'send-transaction-info'
            });
        }
    }
});