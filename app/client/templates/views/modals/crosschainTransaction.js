Template['views_modals_sendcrosschainReleaseX'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
});


Template['views_modals_sendcrosschainReleaseX'].events({
    'click .cancel-cross': function () {
        EthElements.Modal.hide();
    },
    'click .ok-cross': async function () {
        // console.log('data trans: ', this.trans);
        let password_input = document.getElementById('releaseX-psd').value;

        if(!password_input) {
            EthElements.Modal.hide();

            return GlobalNotification.warning({
                content: 'the password empty',
                duration: 2
            });
        }

        // releaseX
        if (this.transType === 'releaseX') {
            try {

                TemplateVar.set('isButton', true);

                sendRefundTransData = await Helpers.promisefy(
                    mist.ETH2WETH().sendRefundTrans,
                    [this.trans, password_input],
                    mist.ETH2WETH()
                );

                EthElements.Modal.hide();

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
        // revoke
        else {
            try {

                TemplateVar.set('isButton', true);

                sendRevokeTransData = await Helpers.promisefy(
                    mist.ETH2WETH().sendRevokeTrans,
                    [trans, password_input],
                    mist.ETH2WETH()
                );

                EthElements.Modal.hide();

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

    }
});
