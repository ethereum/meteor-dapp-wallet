/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_ethToweth
 @constructor
 */


// Set basic variables
Template['views_ethToweth'].onCreated(function(){
    var template = this;

    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'feeMultiplicator', 0);
    TemplateVar.set(template, 'options', false);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    let wanaddress = [];
    let wanAddressList = Session.get('wanAddressList') ? Session.get('wanAddressList') : [];

    if (wanAddressList.length >0) {
        TemplateVar.set(template, 'to', wanAddressList[0]);
        _.each(wanAddressList, function (value, index) {
            wanaddress.push({address: value})
        });

        TemplateVar.set(template, 'wanAddressList', wanaddress);
    }

    // eth accounts token balance
    let addressList = Session.get('addressList');
    mist.ETH2WETH().getMultiBalances(addressList, (err, result) => {
        if (!err) {
            let result_list = [];

            _.each(result, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');
                const name = 'Account_' + index.slice(2, 6);
                if (new BigNumber(balance).gt(0)) {
                    result_list.push({name: name, address: index, balance: balance})
                }
            });

            if (result_list.length >0) {
                TemplateVar.set(template,'ethList',result_list);
                TemplateVar.set(template,'from',result_list[0].address);
            }
        }
    });

    // eth => weth storeman
    mist.ETH2WETH().getStoremanGroups(function (err,data) {
        EthElements.Modal.hide();

        if (!err) {
            if (data.length > 0) {
                // console.log('ETH2WETH storeman', data);
                TemplateVar.set(template, 'storeman', data[0].ethAddress);
                TemplateVar.set(template, 'storemanGroup', data);
            }
        } else {
            Session.set('clickButton', 1);
        }
    });

    // eth chain  gas price
    mist.ETH2WETH().getGasPrice('ETH', function (err,data) {
        if (!err) {
            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
            TemplateVar.set(template,'estimatedGas', data.LockGas);
            TemplateVar.set(template,'gasPrice', data.gasPrice);

            // console.log('fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));
            let number = new BigNumber(data.LockGas * data.gasPrice);

            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));
            TemplateVar.set(template, 'total', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));
        }
    });

});


Template['views_ethToweth'].helpers({
    'ethAccounts': function(){
        return TemplateVar.get('ethList');
    },

    'wanAddressList': function(){
        return TemplateVar.get('wanAddressList');
    },

    'Deposit': function () {

        let result = [];

        if (TemplateVar.get('storemanGroup')) {
            _.each(TemplateVar.get('storemanGroup'), function (value, index) {
                if (value.ethAddress === TemplateVar.get('storeman')) {
                    let inboundQuota = web3.fromWei(value.inboundQuota, 'ether');
                    let quota = web3.fromWei(value.quota, 'ether');
                    let deposit = web3.fromWei(value.deposit, 'ether');
                    let done = quota - inboundQuota;
                    let used = ((done/ quota) * 100).toString() + '%';

                    result.push({deposit: deposit, inboundQuota: inboundQuota, quota: quota, done: done, used: used})
                }
            });
        }

        // console.log('result: ', result);
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


Template['views_ethToweth'].events({

    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(event){
        event.preventDefault();

        var amount = new BigNumber(0);

        var regPos = /^\d+(\.\d+)?$/; //非负浮点数
        var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数

        if (event.target.value && (regPos.test(event.target.value) || regNeg.test(event.target.value)) ) {
            amount = new BigNumber(event.target.value)
        }

        TemplateVar.set('amount', amount);
        TemplateVar.set('total', amount.add(new BigNumber(TemplateVar.get('fee'))));
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
            total = TemplateVar.get('total');

        let gasPrice = TemplateVar.get('gasPrice').toString(),
            estimatedGas = TemplateVar.get('estimatedGas').toString();

        if (!from && !storeman && !total) {
            EthElements.Modal.hide();
            Session.set('clickButton', 1);
        }

        if(!from) {
            return GlobalNotification.warning({
                content: 'no from account',
                duration: 2
            });
        }

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

        mist.ETH2WETH().getBalance([from.toLowerCase()], function (err,ethBalance) {
            if (err) {
                Helpers.showError(err);
            } else {
                let totalValue = new BigNumber(EthTools.toWei(total));
                let ethValue = new BigNumber(ethBalance, 10);

                // console.log('totalValue: ', totalValue);
                // console.log('ethValue: ', ethValue);
                if(totalValue.gt(ethValue))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });


                let trans = {
                    from: from, amount: amount.toString(10), storemanGroup: storeman,
                    cross: to, gas: estimatedGas, gasPrice: gasPrice
                };
                // console.log('trans: ', trans);

                mist.ETH2WETH().getLockTransData(trans, function (err,getLockTransData) {
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
                                estimatedGas: estimatedGas,
                                fee: fee,
                                data: getLockTransData.lockTransData,
                                trans: trans,
                                secretX: getLockTransData.secretX,
                                chain: 'ETH',
                                symbol: 'ETH'
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
