function waitingMoment() {
    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});
    setTimeout(() => {
        Session.set('clickButton', 1);
        EthElements.Modal.hide();
    }, 5000);
}

Template['views_modals_sendcrossBtcReleaseX'].onCreated(function(){
    let template = this;
    TemplateVar.set(template, 'isButton', false);

    if (this.data.transType === 'releaseX') {
        TemplateVar.set(template, 'transType', 'Confirm Transaction');
        TemplateVar.set(template, 'passwdType', "Enter TO account's password");
    } else {
        TemplateVar.set(template, 'transType', 'Cancel Transaction');
        TemplateVar.set(template, 'passwdType', "Enter FROM account's password");
    }

});


Template['views_modals_sendcrossBtcReleaseX'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        let password_input = document.getElementById('releaseX-psd').value;

        if(!password_input) {
            EthElements.Modal.hide();

            return GlobalNotification.warning({
                content: 'Empty password, please enter one',
                duration: 2
            });
        }

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        // releaseX
        if (this.transType === 'releaseX') {

            if (this.Chain === 'BTC') {

                // release x in btc
                console.log('release X Chain 1: ', this.Chain);
                let params = {};
                params.crossAddress = this.trans.cross;
                params.x = this.trans.X;
                params.wanPassword = password_input;

                mist.BTC2WBTC().redeemBtc('BTC', params, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        EthElements.Modal.hide();
                        waitingMoment();
                    }
                });

            } else {
                // release x in wan
                console.log('release X Chain 2: ', this.Chain);

                mist.WETH2ETH().sendRefundTrans(this.trans, password_input, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        EthElements.Modal.hide();
                        waitingMoment();
                    }
                });
            }
        }
        // revoke
        else {

            if (this.Chain === 'BTC') {
                // revoke in btc
                console.log('revoke Chain 1: ', this);

                let params = {};
                params.from = this.trans.from;
                params.HashX = this.trans.HashX;
                params.btcPassword = password_input;

                // mist.BTC2WBTC().revokeBtc('BTC', params, function (err,data) {
                //     if (err) {
                //         Helpers.showError(err);
                //         EthElements.Modal.hide();
                //     } else {
                //         EthElements.Modal.hide();
                //         waitingMoment();
                //     }
                // });
            } else {
                // revoke in wan
                console.log('revoke Chain 2: ', this.Chain);

                mist.WETH2ETH().sendRevokeTrans(this.trans, password_input, this.trans.x, function (err,data) {
                    if (err) {
                        Helpers.showError(err);
                        EthElements.Modal.hide();
                    } else {
                        EthElements.Modal.hide();
                        waitingMoment();
                    }
                });
            }
        }

    }
});
