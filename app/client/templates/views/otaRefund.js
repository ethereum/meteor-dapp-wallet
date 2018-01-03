
var defaultMinFee = 5400000000000000;

// Set basic variables
Template['views_otaRefund'].onCreated(function(){

  TemplateVar.set('otas', Session.get('otas'));

	// SET THE DEFAULT VARIABLES
	TemplateVar.set('amount', 0);
	TemplateVar.set('estimatedGas', 300000);
	TemplateVar.set('sendAll', false);

});


Template['views_otaRefund'].helpers({

    'selectAccount': function () {
        var accounts = EthAccounts.find({balance:{$ne:"0"}, address: FlowRouter.getParam('address')}, {sort: {balance: 1}}).fetch();

        TemplateVar.set('accounts', accounts);

        return accounts;
    },

	/**
	 Get the ota list
	 @method (otaList)
	 */
	'otaList': function(){
	    var otas = TemplateVar.get('otas');
	    _.each(otas, function (ota) {
            if(!ota.timeStamp) {
	            ota.timeStamp = Number(ota.meta.created.toString().substr(0, 10));
            }
        });

		return otas;
	},
	'otaTotal': function () {
		var otas = TemplateVar.get('otas');
		var otaTotal = new BigNumber(10);

		_.each(otas, function(ota){
            otaTotal = otaTotal.add(new BigNumber(ota.value));
		});

    	TemplateVar.set('otaTotal', otaTotal);

    	// console.log('otaTotal', otaTotal);
        // console.log('formatBalance', Helpers.transferBanlance(otaTotal, "0,0.00[0000000000000000] UNIT", "wan"));

		return Helpers.transferBanlance(otaTotal, "0,0.00 UNIT", "wan");
	},

	/**
	 Return the currently selected fee + amount
	 @method (total)
	 */
	'total': function(ether){
		var balance = TemplateVar.get('amount');

        if(!_.isFinite(balance))
            return '0';

		// ether
		var gasInWei = TemplateVar.getFrom('.dapp-select-gas-price', 'gasInWei') || '0';
		var amount = new BigNumber(gasInWei, 10);

		return amount;
	}
});


Template['views_otaRefund'].events({

	/**
	 Submit the form and send the transaction!
	 @event submit form
	 */
	'submit form': function(e, template){

        if(!TemplateVar.get('sending')) {

            var gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
                estimatedGas = TemplateVar.get('estimatedGas');

            var accounts = TemplateVar.get('accounts');

            if (accounts.length > 0) {

                var fee = new BigNumber(gasPrice).mul(new BigNumber(estimatedGas)),
                    balance = new BigNumber(accounts[0].balance);

                if (balance.lt(new BigNumber(defaultMinFee))) {
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 8
                    });
                }

                if (balance.lt(fee)) {
                    return GlobalNotification.warning({
                        content: "Your balance is lower than fee, pls change the fee or recharge the account.",
                        duration: 8
                    });
                }
            } else {
                return GlobalNotification.warning({
                    content: 'i18n:wallet.send.error.notEnoughFunds',
                    duration: 8
                });
            }

            var otaResult = [];
            var otaList = TemplateVar.get('otas') || [];

            if (otaList.length >0) {
                _.each(otaList, function(ota){
                    otaResult.push({otaddr: ota._id, otaValue: ota.value});
                });
            }

            //otaRefund
            var otaData = {};
            otaData.otas = otaResult;
            otaData.otaNumber = 8;
            otaData.rfAddress =  FlowRouter.getParam('address');
            otaData.gas = estimatedGas;
            otaData.gasPrice = '0x' + new BigNumber(gasPrice).toString(16);

            var otaRefund = function () {

                console.log('Finally otaRefund choose gas', estimatedGas);

                // show loading
                mist.popWindowEvents(function (bool) {
                    TemplateVar.set(template, 'sending', bool);
                });

                mist.refundCoin(otaData, function(error, txHash){
                    TemplateVar.set(template, 'sending', false);
                    if (!error) {
                        var href = '/account/' + otaData.rfAddress;

                        _.each(otaResult, function (ota, index) {

                            var value;

                            if (ota.otaValue.slice(2) === '0x') {
                                value = parseFloat(parseInt(ota.otaValue, 16));
                            } else {
                                value = parseFloat(ota.otaValue);
                            }

                            addTransactionAfterSend(txHash[index].hash, value, otaData.rfAddress, otaData.rfAddress, otaData.gasPrice.toString(10), otaData.gas, '');
                        });

                        FlowRouter.go(href);

                    } else {
                        console.log("err:", error);

                        // EthElements.Modal.hide();
                        return GlobalNotification.error({
                            content: error,
                            duration: 8
                        });
                    }
                });
            };

            if (typeof mist !== "undefined") {
                otaRefund();
            }
        }
	}
});