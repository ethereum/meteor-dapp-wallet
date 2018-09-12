Template['views_modals_sendBtcTransactionInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
});

Template['views_modals_sendBtcTransactionInfo'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        let password_input = document.getElementById('ethTransaction-psd').value;

        if(!password_input) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'Empty password, please enter one',
                duration: 2
            });
        }

        if(password_input.length <8) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'password too short',
                duration: 2
            });
        }

        let txArgs = {
            toAddress: this.to,
            amount: this.amount,
            password: password_input
        };

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        mist.BTC2WBTC().sendBtcToAddress('BTC', txArgs, function (err,data) {
            if (err) {
                Helpers.showError(err);
                EthElements.Modal.hide();
            } else {
                EthElements.Modal.hide();
                Session.set('clickButton', 1);
            }
        });

    }
});
