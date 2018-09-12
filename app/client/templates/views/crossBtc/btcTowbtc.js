/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_btcTowbtc
 @constructor
 */


// Set basic variables
Template['views_btcTowbtc'].onCreated(function(){
    var template = this;

    TemplateVar.set(template, 'amount', 0);

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

    // btc => wbtc storeman
    mist.BTC2WBTC().getStoremanGroups('BTC', function (err,data) {
        EthElements.Modal.hide();

        if (!err) {
            if (data.length > 0) {
                TemplateVar.set(template, 'storeman', data[0].ethAddress);
                TemplateVar.set(template, 'storemanWan', data[0].wanAddress);
                TemplateVar.set(template, 'storemanGroup', data);
            }
        } else {
            Session.set('clickButton', 1);
        }
    });

});


Template['views_btcTowbtc'].helpers({

    'wanAddressList': function(){
        return TemplateVar.get('wanAddressList');
    },

    'Deposit': function () {

        let result = [];

        // ===== 单位换算问题 =======
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

        return result;
    },

});


Template['views_btcTowbtc'].events({

    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(event){
        event.preventDefault();

        var amount = new BigNumber(0);

        var regPos = /^\d+(\.\d+)?$/; //非负浮点数
        var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数

        if (event.target.value && (regPos.test(event.target.value) || regNeg.test(event.target.value)) ) {
            amount = new BigNumber(event.target.value)
        }

        TemplateVar.set('amount', amount);
    },

    'change #toweth-storeman': function (event) {
        event.preventDefault();
        TemplateVar.set('storeman', event.target.value);
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
        let storeman = TemplateVar.get('storeman'),
            storemanWan = TemplateVar.get('storemanWan'),
            to = TemplateVar.get('to'),
            amount = TemplateVar.get('amount');

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


        mist.BTC2WBTC().getBtcMultiBalances('BTC', (err, result) => {

            if (err) {
                Helpers.showError(err);
            } else {
                let btcAccounts = result.address;
                let btcBalance = new BigNumber(result.balance);

                console.log('btc: ', result);
                if(btcBalance.eq(new BigNumber(0))) {
                    return GlobalNotification.warning({
                        content: 'btc address no balance',
                        duration: 2
                    });
                }

                let trans = {
                    storeman: {wanAddress: storemanWan, ethAddress: storeman},
                    wanAddress: to,
                    amount: amount.toString(10)
                };

                Session.set('isShowModal', true);

                EthElements.Modal.question({
                    template: 'views_modals_lockBtcInfo',
                    data: {
                        to: to,
                        amount: amount,
                        storeman: storeman,
                        symbol: 'BTC',
                        trans: trans,
                        chain: 'BTC'
                    },
                },{
                    class: 'send-transaction-info',
                    closeable: false,
                });

            }

        });

    }
});
