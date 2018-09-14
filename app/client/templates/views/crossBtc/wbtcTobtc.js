/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_wbtcTobtc
 @constructor
 */

const defaultGasprice = 180000000000;

// Set basic variables
Template['views_wbtcTobtc'].onCreated(function(){
    var template = this;

    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'coverCharge', 0);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    // btc address
    let ethaddress = [];
    let addressList = Session.get('btcAddressList') ? Session.get('btcAddressList').address : [];

    if (addressList.length >0) {
        TemplateVar.set(template, 'to', addressList[0]);

        _.each(addressList, function (value, index) {
            ethaddress.push({address: value})
        });

        TemplateVar.set(template, 'addressList', ethaddress);
    }


    // wbtc balance
    mist.BTC2WBTC().listWbtcBalance('BTC', (err, result) => {

        if (!err) {
            let result_list = [];

            _.each(result, function (value, index) {

                if (new BigNumber(value).gt(0)) {
                    result_list.push({name: index, address: index, balance: value});
                }
            });

            if (result_list.length > 0) {
                TemplateVar.set(template,'wanList',result_list);
                TemplateVar.set(template,'from',result_list[0].address);
            }

        }
    });

    // wbtc => btc storeman
    mist.BTC2WBTC().getStoremanGroups('BTC', function (err,data) {
        EthElements.Modal.hide();

        if (!err) {
            // console.log('WBTC2BTC storeman', data);
            if (data.length > 0) {
                TemplateVar.set(template,'storeman',data[0].wanAddress);
                TemplateVar.set(template,'txFeeRatio',data[0].txFeeRatio);

                TemplateVar.set(template,'storemanGroup',data);
            }
        } else {
            Session.set('clickButton', 1);
        }
    });

    // get wan2coin ratio
    mist.ETH2WETH().getCoin2WanRatio('ETH', function (err,data) {
        if (!err) {
            data ? TemplateVar.set(template,'wan2CoinRatio',data) : TemplateVar.set(template,'wan2CoinRatio',20);
        }
    });

});


Template['views_wbtcTobtc'].helpers({
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

});


Template['views_wbtcTobtc'].events({

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


    /**
     Submit the form and send the transaction!
     @event submit form
     */
    'submit form': function(e, template){

        let from = TemplateVar.get('from'),
            storeman = TemplateVar.get('storeman'),
            txFeeRatio = TemplateVar.get('txFeeRatio'),
            to = TemplateVar.get('to'),
            amount = TemplateVar.get('amount'),
            valueFee = TemplateVar.get('coverCharge');

        if (!from && !storeman && !valueFee) {
            EthElements.Modal.hide();
            Session.set('clickButton', 1);
        }

        if(!from) {
            return GlobalNotification.warning({
                content: 'No eligible FROM account',
                duration: 2
            });
        }

        if(!storeman) {
            return GlobalNotification.warning({
                content: 'No eligible Storeman account',
                duration: 2
            });
        }

        if(!to) {
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.noReceiver',
                duration: 2
            });
        }


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

        // const amountSymbol = amount.toString().split('.')[1];
        // if (amountSymbol && amountSymbol.length >=19) {
        //     return GlobalNotification.warning({
        //         content: 'Amount not valid',
        //         duration: 2
        //     });
        // }


        mist.WETH2ETH().getBalance(from.toLowerCase(), function (err,wanBalance) {

            // error
            if (err) {
                return GlobalNotification.warning({
                    content: 'get wan address balance error',
                    duration: 2
                });
            }


            // valueFee > wanBalance
            if((new BigNumber(EthTools.toWei(valueFee), 10)).gt(new BigNumber(wanBalance, 10)))
                return GlobalNotification.warning({
                    content: 'Insufficient WAN balance in your FROM account',
                    duration: 2
                });



            let trans = {
                wanAddress: from, amount: amount.toString(10), storeman: {wanAddress: storeman, txFeeRatio: txFeeRatio},
                btcAddress: to, value: valueFee
            };

            if (!err) {
                Session.set('isShowModal', true);

                EthElements.Modal.question({
                    template: 'views_modals_lockBtcInfo',
                    data: {
                        from: from,
                        to: to,
                        amount: amount,
                        trans: trans,
                        storeman: storeman,
                        valueFee: valueFee,
                        chain: 'WAN',
                        symbol: 'WBTC'
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
