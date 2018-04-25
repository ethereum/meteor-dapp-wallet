/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_ethToweth
 @constructor
 */


/**
 The default gas to provide for estimates. This is set manually,
 so that invalid data etsimates this value and we can later set it down and show a warning,
 when the user actually wants to send the dummy data.
 @property defaultEstimateGas
 */
var defaultEstimateGas = 50000000;

var checkWaddress = function (waddress) {
    var value = waddress.replace(/[\s\*\(\)\!\?\#\$\%]+/g, '');

    // add 0x
    if (value.length === 132 && value.indexOf('0x') === -1 && /^[0-9a-f]+$/.test(value.toLowerCase())) {
        value = '0x' + value;
    }

    var regex = /^(0x)?[0-9a-fA-F]{132}$/;

    if (regex.test(value.toLowerCase())) {
        return value
    }

    return;
};


// Set basic variables
Template['views_ethToweth'].onCreated(function(){
    var template = this;

    TemplateVar.set(template,'from',Session.get('ethList')[0].address);
    TemplateVar.set(template, 'amount', 0);
    TemplateVar.set(template, 'feeMultiplicator', 0);
    TemplateVar.set(template, 'options', false);

    mist.ETH2WETH().getStoremanGroups(function (err,data) {
        if (err) {
            TemplateVar.set(template,'storemanGroup', []);
        } else {
            // console.log(data);
            TemplateVar.set(template,'to',data[0].ethAddress);
            TemplateVar.set(template,'storemanGroup',data);
        }
    });

    mist.ETH2WETH().getGasPrice(function (err,data) {
        if (err) {

            TemplateVar.set(template,'gasEstimate', {});
        } else {
            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
            Session.set('crosschainGas', data);
            TemplateVar.set(template,'estimatedGas', data.LockGas);
            TemplateVar.set(template,'gasPrice', data.gasPrice);

            TemplateVar.set(template, 'fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));

            TemplateVar.set(template, 'total', TemplateVar.get(template, 'amount') + TemplateVar.get(template, 'fee'));
        }
    });

});


Template['views_ethToweth'].helpers({
    'ethAccounts': function(){
        // console.log('Session.get(\'ethList\')', Session.get('ethList'));
        return Session.get('ethList');
    },

    'storeman': function () {
        console.log('TemplateVar.get(\'storemanGroup\')', TemplateVar.get('storemanGroup'));
        return TemplateVar.get('storemanGroup');
    },

    'deposit': function () {

        let result = [];
        _.each(TemplateVar.get('storemanGroup'), function (value, index) {
            if (value.ethAddress === TemplateVar.get('to')) {
                let inboundQuota = web3.fromWei(value.inboundQuota, 'ether');
                let quota = web3.fromWei(value.quota, 'ether');
                let deposit = web3.fromWei(value.deposit, 'ether');
                result.push({deposit: deposit, inboundQuota: inboundQuota, quota: quota, done: quota - inboundQuota})
            }
        });

        return result;
    },

    'total': function () {
      return TemplateVar.get('total');
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

    'change .input-amount': function(event){
        event.preventDefault();
        TemplateVar.set('amount', new BigNumber(event.target.value));
        TemplateVar.set('total', TemplateVar.get('amount') + TemplateVar.get('fee'));
    },

    'change #toweth-from': function (event) {
        event.preventDefault();
        TemplateVar.set('from', event.target.value);
    },

    'change #toweth-to': function (event) {
        event.preventDefault();
        TemplateVar.set('to', event.target.value);
    },

    'click .options': function () {
        TemplateVar.set('options', !TemplateVar.get('options'));
    },

    'change input[name="fee"], input input[name="fee"]': function(e){
        let feeRate = Number(e.currentTarget.value);
        let gasPrice = web3.fromWei(TemplateVar.get('gasPrice'), 'ether');

        // return the fee
        var fee = (TemplateVar.get('estimatedGas') * gasPrice) * (1 + feeRate/10);

        TemplateVar.set('feeMultiplicator', feeRate);
        TemplateVar.set('fee', fee);
    },

    /**
     Submit the form and send the transaction!
     @event submit form
     */
    'submit form': function(e, template){
        let from = TemplateVar.get('from'),
            to = TemplateVar.get('to'),
            amount = TemplateVar.get('amount');

        var gasPrice = web3.fromWei(TemplateVar.get('gasPrice'), 'ether'),
            estimatedGas = TemplateVar.get('estimatedGas');

        if(amount === 0) {
            return GlobalNotification.warning({
                content: 'the amount empty',
                duration: 2
            });
        }

        let sendTransaction = function () {
            let password = document.getElementById('crosschain-psd').value;

            if(!password) {
                return GlobalNotification.warning({
                    content: 'the password empty',
                    duration: 2
                });
            }

            console.log('password: ', password);
        };


        EthElements.Modal.question({
            template: 'views_modals_sendcrosschainTransactionInfo',
            data: {
                from: from,
                to: to,
                amount: amount,
                gasPrice: gasPrice,
                estimatedGas: estimatedGas,
                fee: TemplateVar.get('fee')
            },
            ok: sendTransaction,
            cancel: true
        },{
            class: 'send-transaction-info'
        });
    }
});
