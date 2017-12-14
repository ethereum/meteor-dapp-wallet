/**
 The default gas to provide for estimates. This is set manually,
 so that invalid data etsimates this value and we can later set it down and show a warning,
 when the user actually wants to send the dummy data.
 @property defaultEstimateGas
 */
var defaultEstimateGas = 50000000;


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

        var address = FlowRouter.getRouteName() === 'dashboard' ? FlowRouter.getParam('address') : FlowRouter.getParam('address').toLowerCase();
        var accounts = EthAccounts.find({balance:{$ne:"0"}, address: address}, {sort: {balance: 1}}).fetch();

        TemplateVar.set('accounts', accounts);

        return accounts;
    },

	/**
	 Get the ota list
	 @method (otaList)
	 */
	'otaList': function(){
		return TemplateVar.get('otas');
	},
	'otaTotal': function () {
		var otas = TemplateVar.get('otas');
		var otaTotal = 0;

		_.each(otas, function(ota){
            otaTotal += parseFloat(parseInt(ota.value, 16));
		});

    	TemplateVar.set('otaTotal', otaTotal);
		return otaTotal;
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

		var accounts = TemplateVar.get('accounts');

		if (accounts.length === 0) {
            return GlobalNotification.warning({
                content: "Sorry, your balance is running low.",
                duration: 8
            });
		}

		var gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
			estimatedGas = TemplateVar.get('estimatedGas'),
			sendAll = TemplateVar.get('sendAll');

		var otaResult = [];
		var otaList = TemplateVar.get('otas') || [];

		if (otaList.length >0) {
			_.each(otaList, function(ota){
				otaResult.push({otaddr: ota._id, otaValue: ota.value});
			});
		}

      // set gas down to 21 000, if its invalid data, to prevent high gas usage.
      if(estimatedGas === defaultEstimateGas || estimatedGas === 0)
          estimatedGas = 300000;


    console.log('Providing gas: ', estimatedGas , sendAll ? '' : ' + 100000');

    //otaRefund
    var otaData = {};
    otaData.otas = otaResult;
    otaData.otaNumber = 8;
    otaData.rfAddress =  FlowRouter.getParam('address');
    otaData.gas = estimatedGas;
    otaData.gasPrice = Number(gasPrice);

    // sendTransaction(sendAll ? estimatedGas : estimatedGas + 100000);
    if (typeof mist !== "undefined") {
        mist.refundCoin(otaData, function(error, txHash){

        	if (!error) {

        		var href = '/account/' + otaData.rfAddress;

                FlowRouter.go(href);

                _.each(otaResult, function (ota, index) {
                    console.log('index: ', index);
                    console.log('txHash: ', txHash[index].hash);
                    console.log('otaValue: ', parseInt(ota.otaValue, 16));

                    addTransactionAfterSend(txHash[index].hash, parseInt(ota.otaValue, 16), otaData.rfAddress, otaData.rfAddress, otaData.gasPrice, otaData.gas, '');
                });

        	} else {
        		console.log("err:", error);

        		// EthElements.Modal.hide();
				return GlobalNotification.error({
					content: error,
					duration: 8
				});
        	}
    });
	}
	}
});