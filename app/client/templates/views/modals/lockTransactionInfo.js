Template['views_modals_unlockTransactionInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
    TemplateVar.set(template, 'passwdType', 'enter the from account\'s password');
});


Template['views_modals_unlockTransactionInfo'].events({
    'click .cancel-cross': function () {
        Session.set('isShowModal', false);

        EthElements.Modal.hide();
    },
    'click .ok-cross': function () {
        // console.log('data trans: ', this.trans);
        let password_input = document.getElementById('crosschain-psd').value;

        // console.log('password: ', password_input);

        if(!password_input) {
            EthElements.Modal.hide();
            return GlobalNotification.warning({
                content: 'Empty password, please enter one',
                duration: 2
            });
        }

        TemplateVar.set('isButton', true);
        Session.set('isShowModal', false);

        if (this.chain === 'ETH') {
            console.log('ETH chain: ', this.chain);

            mist.ETH2WETH().sendLockTrans(this.trans, password_input, this.secretX, function (err,data) {
                if (err) {
                    Helpers.showError(err);
                    EthElements.Modal.hide();
                } else {
                    EthElements.Modal.hide();
                    Session.set('clickButton', 1);
                }
            });
        } else {
            console.log('WAN chain: ', this.chain);

            mist.WETH2ETH().sendLockTrans(this.trans, password_input, this.secretX, function (err,data) {
                if (err) {
                    Helpers.showError(err);
                    EthElements.Modal.hide();
                } else {
                    EthElements.Modal.hide();
                    Session.set('clickButton', 1);
                }
            });
        }

    }
});
