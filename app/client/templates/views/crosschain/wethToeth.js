/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_wethToeth
 @constructor
 */

const defaultGasprice = 180000000000;

// Set basic variables
Template['views_wethToeth'].onCreated(function(){
    var template = this;

    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'feeMultiplicator', 0);
    TemplateVar.set(template, 'options', false);
    TemplateVar.set(template, 'coverCharge', 0);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    let ethaddress = [];
    let addressList = Session.get('addressList') ? Session.get('addressList') : [];
    if (addressList.length >0) {
        TemplateVar.set(template, 'to', addressList[0]);
        _.each(addressList, function (value, index) {
            ethaddress.push({address: value})
        });

        TemplateVar.set(template, 'addressList', ethaddress);
    }

    // wan accounts token balance
    let wanAddressList = Session.get('wanAddressList');

    mist.WETH2ETH().getMultiTokenBalance(wanAddressList, (err, result) => {
        TemplateVar.set(template,'wethBalance',result);

        if (!err) {
            let result_list = [];

            _.each(result, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');

                if (new BigNumber(balance).gt(0)) {
                    // let accounts = EthAccounts.findOne({balance:{$ne:"0"}, address: index});
                    // result_list.push({name: accounts.name ? accounts.name : index, address: index, balance: balance})

                    result_list.push({name: index, address: index, balance: balance})
                }
            });

            if (result_list.length > 0) {
                TemplateVar.set(template,'wanList',result_list);
                TemplateVar.set(template,'from',result_list[0].address);
            }

        }
    });

    // weth => eth storeman
    mist.WETH2ETH().getStoremanGroups(function (err,data) {
        EthElements.Modal.hide();

        if (!err) {
            // console.log('WETH2ETH storeman', data);
            if (data.length > 0) {
                TemplateVar.set(template,'storeman',data[0].wanAddress);
                TemplateVar.set(template,'txFeeRatio',data[0].txFeeRatio);

                TemplateVar.set(template,'storemanGroup',data);
            }
        } else {
            Session.set('clickButton', 1);
        }
    });

    // get wan chain gas price
    mist.WETH2ETH().getGasPrice('WAN', function (err,data) {
        if (!err) {
            // console.log('WAN gasPrice', data);
            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
            TemplateVar.set(template,'estimatedGas', data.LockGas);
            TemplateVar.set(template,'defaultGasPrice', data.gasPrice);
            TemplateVar.set(template,'gasPrice', data.gasPrice);

            // console.log('fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));
            var number = new BigNumber(data.LockGas * data.gasPrice);
            // console.log('formatBalance', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));

            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));
        }
    });

    // get wan2coin ratio
    mist.ETH2WETH().getCoin2WanRatio('ETH', function (err,data) {
        if (!err) {
            data ? TemplateVar.set(template,'wan2CoinRatio',data) : TemplateVar.set(template,'wan2CoinRatio',20);
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

                let outboundQuota = web3.fromWei(value.outboundQuota, 'ether');
                let quota = web3.fromWei(value.quota, 'ether');
                let deposit = web3.fromWei(value.deposit, 'ether');
                let used = ((outboundQuota/ quota) * 100).toString() + '%';

                result.push({deposit: deposit, outboundQuota: outboundQuota, used: used})
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

        let txFeeratio = TemplateVar.get('txFeeRatio');
        let wan2CoinRatio  = TemplateVar.get('wan2CoinRatio');
        let exp     = new BigNumber(10);
        let v       = new BigNumber(amount);
        let wei     = v.mul(exp.pow(18));

        const DEFAULT_PRECISE = 10000;
        let coverCharge = wei.mul(wan2CoinRatio).mul(txFeeratio).div(DEFAULT_PRECISE).div(DEFAULT_PRECISE);
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
        let value = event.target.value;
        let storeman = value.split('&&')[0];
        let txFeeRatio = value.split('&&')[1];

        TemplateVar.set('storeman', storeman);
        TemplateVar.set('txFeeRatio', txFeeRatio);
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
        let newFeeRate = new BigNumber(feeRate).div(10).add(1);
        let newGasPrice = new BigNumber(TemplateVar.get('defaultGasPrice')).mul(newFeeRate);

        // return the fee
        let number = TemplateVar.get('estimatedGas') * newGasPrice;
        let fee = EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether');

        TemplateVar.set('gasPrice', newGasPrice);
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
            chooseGasPrice = TemplateVar.get('gasPrice').toString(),
            estimatedGas = TemplateVar.get('estimatedGas').toString();

        if (parseInt(gasPrice) < defaultGasprice) {
            gasPrice = defaultGasprice.toString();
        }

        if (!from && !storeman && !fee && !valueFee) {
            EthElements.Modal.hide();
            Session.set('clickButton', 1);
        }

        if(!from) {
            return GlobalNotification.warning({
                content: 'No eligible FROM account',
                duration: 2
            });
        }

        // console.log('storeman', storeman);
        if(!storeman) {
            return GlobalNotification.warning({
                content: 'No eligible Storeman account',
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
                content: 'Please enter a valid amount',
                duration: 2
            });
        }

        if(amount.eq(new BigNumber(0))) {
            return GlobalNotification.warning({
                content: 'Please enter a valid amount',
                duration: 2
            });
        }

        const amountSymbol = amount.toString().split('.')[1];
        if (amountSymbol && amountSymbol.length >=19) {
            return GlobalNotification.warning({
                content: 'Amount not valid',
                duration: 2
            });
        }

        let wethBalance = TemplateVar.get('wethBalance')[from.toLowerCase()];
        // let wanBalance = await Helpers.promisefy(mist.WETH2ETH().getBalance, [from.toLowerCase()], mist.WETH2ETH());

        mist.WETH2ETH().getBalance(from.toLowerCase(), function (err,wanBalance) {
            if (!err) {
                if(new BigNumber(EthTools.toWei(amount), 10).gt(new BigNumber(wethBalance, 10)))
                    return GlobalNotification.warning({
                        content: 'Insufficient WETH balance in your FROM account',
                        duration: 2
                    });

                // console.log('fee: ', new BigNumber(EthTools.toWei(fee), 10));
                // console.log('valueFee: ', new BigNumber(EthTools.toWei(valueFee), 10));
                // console.log('valueFee: ', new BigNumber(EthTools.toWei(fee), 10).add(new BigNumber(EthTools.toWei(valueFee), 10)));
                if((new BigNumber(EthTools.toWei(fee), 10).add(new BigNumber(EthTools.toWei(valueFee), 10))).gt(new BigNumber(wanBalance, 10)))
                    return GlobalNotification.warning({
                        content: 'Insufficient WAN balance in your FROM account',
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
                        Session.set('isShowModal', true);

                        EthElements.Modal.question({
                            template: 'views_modals_unlockTransactionInfo',
                            data: {
                                from: from,
                                to: to,
                                amount: amount,
                                gasPrice: gasPrice,
                                chooseGasPrice: chooseGasPrice,
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
                            class: 'send-transaction-info',
                            closeable: false,
                        });
                    } else {
                        Helpers.showError(err);
                    }

                });

            }
        });
    }
});
