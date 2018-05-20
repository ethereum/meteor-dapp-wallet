Template['views_modals_sendEthTransactionInfo'].onCreated(function(){
    var template = this;
    TemplateVar.set(template, 'isButton', false);
});

Template['views_modals_sendEthTransactionInfo'].events({
    'click .cancel-cross': function () {
        EthElements.Modal.hide();
    },
    'click .ok-cross': async function () {
        // console.log('Gas Price: '+ gasPrice);

        var txArgs = {
            from: this.from,
            to: this.to,
            value: this.amount,
            gasPrice: this.gasPrice,
            //gas: this.gas
            gas: '21000'
};

        try {

            TemplateVar.set('isButton', true);
            mist.ETH2WETH().sendNormalTransaction(txArgs, "wanglu", 'ETH', function(){
                        EthElements.Modal.hide();
                        Session.set('clickButton', 1);
      
            });
            // await Helpers.promisefy(
            //     mist.ETH2WETH().sendNormalTransaction,
            //     [txArgs, password_input, 'ETH'],
            //     mist.ETH2WETH()
            // );

            // EthElements.Modal.hide();
            // Session.set('clickButton', 1);

        } catch (error) {
            console.log('views_modals_sendEthTransactionInfo error', error);

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
