Template['views_modals_lockBtcInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
    TemplateVar.set(template, 'passwdType', 'Enter btc wallet\'s password');
    TemplateVar.set(template, 'wanPasswdType', 'Enter wan account\'s password');
});


Template['views_modals_lockBtcInfo'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {

        let password_input_wan = document.getElementById('crosschain-psd-wan').value;

        if(!password_input_wan) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'Empty wan password, please enter one',
                duration: 2
            });
        }

        let password_input = document.getElementById('crosschain-psd').value;

        if(!password_input) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'Empty btc password, please enter one',
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

        this.trans.btcPassword = password_input;
        this.trans.wanPassword = password_input_wan;

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        if (this.chain === 'BTC') {
            console.log('BTC chain: ', this.chain);

            mist.BTC2WBTC().lockBtc('BTC', this.trans, function (err,data) {
                if (err) {
                    console.log('err: ', err);
                    Helpers.showError(err);
                    EthElements.Modal.hide();
                } else {
                    console.log('data: ', data);
                    EthElements.Modal.hide();
                    Session.set('clickButton', 1);
                }
            });
        } else {
            console.log('WAN chain: ', this.chain);

            // mist.WETH2ETH().sendLockTrans(this.trans, password_input, this.secretX, function (err,data) {
            //     if (err) {
            //         Helpers.showError(err);
            //         EthElements.Modal.hide();
            //     } else {
            //         EthElements.Modal.hide();
            //         Session.set('clickButton', 1);
            //     }
            // });
        }

    }
});
