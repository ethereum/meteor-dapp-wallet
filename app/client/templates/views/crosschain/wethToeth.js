/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_wethToeth
 @constructor
 */


// Set basic variables
Template['views_wethToeth'].onCreated(function(){
    var template = this;

    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'feeMultiplicator', 0);
    TemplateVar.set(template, 'options', false);
    TemplateVar.set(template, 'coverCharge', 0);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    let ethaddress = [];

    TemplateVar.set(template, 'to', Session.get('addressList')[0]);
    _.each(Session.get('addressList'), function (value, index) {
        ethaddress.push({address: value})
    });

    TemplateVar.set(template, 'addressList', ethaddress);

    // wan accounts token balance
    mist.WETH2ETH().getMultiTokenBalance(Session.get('wanAddressList'), (err, result) => {
        TemplateVar.set(template,'wethBalance',result);

        if (!err) {
            let result_list = [];

            _.each(result, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');
                const name = index.slice(2, 6) + index.slice(38);
                result_list.push({name: name, address: index, balance: balance})
            });

            TemplateVar.set(template,'wanList',result_list);
            TemplateVar.set(template,'from',result_list[0].address);

            // weth => eth storeman
            mist.WETH2ETH().getStoremanGroups(function (err,data) {
                if (err) {
                    TemplateVar.set(template,'storemanGroup', []);
                    Helpers.showError(err);
                } else {
                    // console.log('WETH2ETH storeman', data);
                    TemplateVar.set(template,'storeman',data[0].wanAddress);
                    TemplateVar.set(template,'storemanGroup',data);

                    // get wan chain gas price
                    mist.WETH2ETH().getGasPrice('WAN', function (err,data) {
                        if (err) {
                            TemplateVar.set(template,'gasEstimate', {});
                            Helpers.showError(err);
                        } else {
                            // console.log('WAN gasPrice', data);
                            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
                            TemplateVar.set(template,'estimatedGas', data.LockGas);
                            TemplateVar.set(template,'gasPrice', data.gasPrice);

                            // console.log('fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));
                            var number = new BigNumber(data.LockGas * data.gasPrice);
                            // console.log('formatBalance', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));

                            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));

                            // get wan2coin ratio
                            mist.ETH2WETH().getWan2CoinRatio('ETH', function (err,data) {
                                if (data) {
                                    TemplateVar.set(template,'wan2CoinRatio',data);
                                } else {
                                    TemplateVar.set(template,'wan2CoinRatio',20);
                                }

                                EthElements.Modal.hide();
                            });
                        }
                    });
                }
            });
        } else {
            Helpers.showError(err);
        }

    });

});


Template['views_wethToeth'].helpers({
    'ethAccounts': function(){
        return TemplateVar.get('wanList');
    },

    'addressList': function(){
        return TemplateVar.get('addressList');
    },

    'Deposit': function () {

        let result = [];
        _.each(TemplateVar.get('storemanGroup'), function (value, index) {
            if (value.wanAddress === TemplateVar.get('storeman')) {
                let inboundQuota = web3.fromWei(value.inboundQuota, 'ether');
                let quota = web3.fromWei(value.quota, 'ether');
                let deposit = web3.fromWei(value.deposit, 'ether');
                result.push({deposit: deposit, inboundQuota: inboundQuota, quota: quota, done: quota - inboundQuota})
            }
        });

        return result;
    },

    'i18nText': function(key){
        if(typeof TAPi18n !== 'undefined'
            && TAPi18n.__('elements.selectGasPrice.'+ key) !== 'elements.selectGasPrice.'+ key) {
            return TAPi18n.__('elements.selectGasPrice.'+ key);
        } else if (typeof this[key] !== 'undefined') {
            return this[key];
        } else {
            return (key === 'high') ? '+' : '-';
        }
    },

});


Template['views_wethToeth'].events({

    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(event){
        event.preventDefault();

        let amount = new BigNumber(0);

        let regPos = /^\d+(\.\d+)?$/; //非负浮点数
        let regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数

        if (event.target.value && (regPos.test(event.target.value) || regNeg.test(event.target.value)) ) {
            amount = new BigNumber(event.target.value)
        }

        let txFeeratio = 1;
        let wan2CoinRatio  = TemplateVar.get('wan2CoinRatio');
        let amountWei = web3.toWei(amount);

        let coverCharge = amountWei * wan2CoinRatio * txFeeratio / 1000 / 1000;
        // console.log('coverCharge: ', coverCharge);

        TemplateVar.set('coverCharge', web3.fromWei(coverCharge));
        TemplateVar.set('amount', amount);
    },

    'change #toweth-from': function (event) {
        event.preventDefault();
        TemplateVar.set('from', event.target.value);
    },

    'change #toweth-storeman': function (event) {
        event.preventDefault();
        TemplateVar.set('storeman', event.target.value);
    },

    'change .toweth-to': function (event) {
        event.preventDefault();
        TemplateVar.set('to', event.target.value);
    },

    'click .options': function () {
        TemplateVar.set('options', !TemplateVar.get('options'));
    },

    'change input[name="fee"], input input[name="fee"]': function(e){
        let feeRate = Number(e.currentTarget.value);

        // return the fee
        var number = (TemplateVar.get('estimatedGas') * TemplateVar.get('gasPrice')) * (1 + feeRate/10);
        var fee = EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether');

        TemplateVar.set('feeMultiplicator', feeRate);
        TemplateVar.set('fee', fee);
    },

    /**
     Submit the form and send the transaction!
     @event submit form
     */
    'submit form': function(e, template){
        let from = TemplateVar.get('from'),
            storeman = TemplateVar.get('storeman'),
            to = TemplateVar.get('to'),
            fee = TemplateVar.get('fee'),
            amount = TemplateVar.get('amount'),
            valueFee = TemplateVar.get('coverCharge');

        var gasPrice = TemplateVar.get('gasPrice').toString(),
            estimatedGas = TemplateVar.get('estimatedGas').toString();

        // console.log('storeman', storeman);
        if(!storeman) {
            return GlobalNotification.warning({
                content: 'no storeman',
                duration: 2
            });
        }

        // wan address
        // console.log('to', to);
        if(!to) {
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.noReceiver',
                duration: 2
            });
        }


        // console.log('amount', amount);
        if(! amount) {
            return GlobalNotification.warning({
                content: 'the amount empty',
                duration: 2
            });
        }

        if(amount.eq(new BigNumber(0))) {
            return GlobalNotification.warning({
                content: 'the amount empty',
                duration: 2
            });
        }

        const amountSymbol = amount.toString().split('.')[1];
        if (amountSymbol && amountSymbol.length >=19) {
            return GlobalNotification.warning({
                content: 'check amount you input',
                duration: 2
            });
        }

        let wethBalance = TemplateVar.get('wethBalance')[from.toLowerCase()];
        // let wanBalance = await Helpers.promisefy(mist.WETH2ETH().getBalance, [from.toLowerCase()], mist.WETH2ETH());

        mist.WETH2ETH().getBalance(from.toLowerCase(), function (err,wanBalance) {
            if (!err) {
                if(new BigNumber(EthTools.toWei(amount), 10).gt(new BigNumber(wethBalance, 10)))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });

                // console.log('fee: ', new BigNumber(EthTools.toWei(fee), 10));
                // console.log('valueFee: ', new BigNumber(EthTools.toWei(valueFee), 10));
                // console.log('valueFee: ', new BigNumber(EthTools.toWei(fee), 10).add(new BigNumber(EthTools.toWei(valueFee), 10)));
                if((new BigNumber(EthTools.toWei(fee), 10).add(new BigNumber(EthTools.toWei(valueFee), 10))).gt(new BigNumber(wanBalance, 10)))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });


                let trans = {
                    from: from, amount: amount.toString(10), storemanGroup: storeman,
                    cross: to, gas: estimatedGas, gasPrice: gasPrice, value: valueFee
                };

                // console.log('trans: ', trans);

                mist.WETH2ETH().getLockTransData(trans, function (err,getLockTransData) {
                    // console.log('getLockTransData: ', getLockTransData);

                    if (!err) {
                        EthElements.Modal.question({
                            template: 'views_modals_unlockTransactionInfo',
                            data: {
                                from: from,
                                to: to,
                                amount: amount,
                                gasPrice: gasPrice,
                                estimatedGas: estimatedGas,
                                fee: fee,
                                data: getLockTransData.lockTransData,
                                trans: trans,
                                secretX: getLockTransData.secretX,
                                valueFee: valueFee,
                                chain: 'WAN',
                                symbol: 'WETH'
                            },
                        },{
                            class: 'send-transaction-info'
                        });
                    } else {
                        Helpers.showError(err);
                    }

                });

            }
        });
    }
});
