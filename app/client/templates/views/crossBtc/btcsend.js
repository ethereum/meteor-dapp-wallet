/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_btcsend
 @constructor
 */


// Set basic variables
Template['views_btcsend'].onCreated(function(){
    var template = this;

    TemplateVar.set(template, 'amount', 0);

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    mist.BTC2WBTC().getBtcMultiBalances('BTC', (err, result) => {
        EthElements.Modal.hide();

        if (!err) {
            TemplateVar.set(template,'btcAccounts',result.address);
            TemplateVar.set(template,'btcBalance',result.balance);
        } else {
            Session.set('clickButton', 1);
        }
    });

});


Template['views_btcsend'].helpers({

    'additionalAttributes': function() {
        let attr = {};

        if (this.autofocus) {attr.autofocus = true;}
        if (this.disabled) {attr.disabled = true;}

        return attr;
    },

});


Template['views_btcsend'].events({

    /**
     Set the amount while typing
     @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
     */
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

    'change .to': function (event) {
        event.preventDefault();
        TemplateVar.set('to', event.target.value);
    },

    /**
     Submit the form and send the transaction!
     @event submit form
     */
    'submit form': function(e, template){

        let to = TemplateVar.get('to'),
            amount = TemplateVar.get('amount');


        if(!to) {
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.noReceiver',
                duration: 2
            });
        }

        if (TemplateVar.get('btcAccounts').indexOf(to) !== -1) {
            return GlobalNotification.warning({
                content: 'Transaction to your wallet address not allowed',
                duration: 2
            });
        }

        if(!amount) {
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

        if(new BigNumber(amount).gt(new BigNumber(TemplateVar.get('btcBalance'), 10))) {
            return GlobalNotification.warning({
                content: 'Insufficient balance',
                duration: 2
            });
        }


        let trans = {
            amount: amount.toString(10),
            to: to
        };

        Session.set('isShowModal', true);
        EthElements.Modal.question({
            template: 'views_modals_sendBtcTransactionInfo',
            data: {
                to: to,
                amount: amount.toString(10),
                trans: trans,
            },
        },{
            class: 'send-transaction-info',
            closeable: false,
        });

    }
});
