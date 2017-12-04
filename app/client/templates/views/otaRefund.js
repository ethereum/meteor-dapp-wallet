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
          otaTotal += parseInt(ota.value);
    });

    TemplateVar.set('amount', otaTotal);
		return otaTotal;
	},

	/**
	 Return the currently selected fee + amount
	 @method (total)
	 */
	'total': function(ether){
		var amount = TemplateVar.get('amount');
		if(!_.isFinite(amount))
			return '0';

		// ether
		var gasInWei = TemplateVar.getFrom('.dapp-select-gas-price', 'gasInWei') || '0';
		amount = new BigNumber(gasInWei, 10);

		return amount;
	}
});


Template['views_otaRefund'].events({

	/**
	 Submit the form and send the transaction!
	 @event submit form
	 */
	'submit form': function(e, template){

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
          estimatedGas = 22000;


    console.log('Providing gas: ', estimatedGas , sendAll ? '' : ' + 100000');

    //otaRefund
    var otaData = {};
    otaData.otas = otaResult;
    otaData.otaNumber = 3;
    otaData.rfAddress =  FlowRouter.getParam('address');
    otaData.gas = estimatedGas;
    otaData.gasPrice = gasPrice;

    // sendTransaction(sendAll ? estimatedGas : estimatedGas + 100000);
    if (typeof mist !== "undefined") {
        mist.refundCoin(otaData, function(err, result){
        	console.log("error:", err);
        	console.log("result:", result);
    });
	}
	}
});