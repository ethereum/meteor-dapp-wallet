Template['views_modals_sendcrosschainTransactionInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
});


Template['views_modals_sendcrosschainTransactionInfo'].events({
    'click .cancel-cross': function () {
        EthElements.Modal.hide();
    },
    'click .ok-cross': async function () {
        // console.log('data trans: ', this.trans);
        let password_input = document.getElementById('crosschain-psd').value;

        // console.log('password: ', password_input);

        if(!password_input) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'the password empty',
                duration: 2
            });
        }

        try {
            TemplateVar.set('isButton', true);

            sendLockTransData = await Helpers.promisefy(
                mist.ETH2WETH().sendLockTrans,
                [this.trans, password_input, this.secretX],
                mist.ETH2WETH()
            );

            EthElements.Modal.hide();

            Session.set('clickButton', 1);

        } catch (error) {
            // console.log('sendLockTransData error', error);
            EthElements.Modal.hide();

            if (error && error.error) {
                return GlobalNotification.warning({
                    content: error.error,
                    duration: 2
                });
            } else {
                return GlobalNotification.warning({
                    content: error,
                    duration: 2
                });
            }

        }

    }
});
