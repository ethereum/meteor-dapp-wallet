/**
 The default gas to provide for estimates. This is set manually,
 so that invalid data etsimates this value and we can later set it down and show a warning,
 when the user actually wants to send the dummy data.
 @property defaultEstimateGas
 */
var defaultEstimateGas = 50000000;


/**
 Get the data field of either the byte or source code textarea, depending on the selectedType
 @method getDataField
 */
var getDataField = function(){
	// make reactive to the show/hide of the textarea
	TemplateVar.getFrom('.compile-contract','byteTextareaShown');



	// send tokens
	var selectedToken = TemplateVar.get('selectedToken');

	if(selectedToken && selectedToken !== 'ether') {
		var mainRecipient = TemplateVar.getFrom('div.dapp-address-input input.to', 'value');
		var amount = TemplateVar.get('amount') || '0';
		var token = Tokens.findOne({address: selectedToken});
		var tokenInstance = TokenContract.at(selectedToken);
		var txData = tokenInstance.transfer.getData( mainRecipient, amount,  {});

		return txData;
	}
};


/**
 Gas estimation callback
 @method estimationCallback
 */
var estimationCallback = function(e, res){
	var template = this;

	console.log('Estimated gas: ', res, e);

	if(!e && res) {
		TemplateVar.set(template, 'estimatedGas', res);

		// show note if its defaultEstimateGas, as the data is not executeable
		if(res === defaultEstimateGas)
			TemplateVar.set(template, 'codeNotExecutable', true);
		else
			TemplateVar.set(template, 'codeNotExecutable', false);
	}
};


// Set basic variables
Template['views_otaRefund'].onCreated(function(){

	// SET THE DEFAULT VARIABLES
	TemplateVar.set('amount', '0');
	TemplateVar.set('estimatedGas', 300000);
	TemplateVar.set('sendAll', false);

	// Deploy contract
	if(FlowRouter.getRouteName() === 'deployContract') {
		TemplateVar.set('selectedAction', 'deploy-contract');
		TemplateVar.set('selectedToken', 'ether');

		// Send funds
	} else {
		TemplateVar.set('selectedAction', 'send-funds');
		TemplateVar.set('selectedToken', FlowRouter.getParam('token') || 'ether');
	}

});



Template['views_otaRefund'].onRendered(function(){
	var template = this;

	// ->> GAS PRICE ESTIMATION
	template.autorun(function(c){
		var address = TemplateVar.getFrom('.dapp-select-account.send-from', 'value'),
			to = TemplateVar.getFrom('.dapp-address-input .to', 'value'),
			amount = TemplateVar.get('amount') || '0',
			data = getDataField();

		if(_.isString(address))
			address = address.toLowerCase();


		// Ether tx estimation
		if(EthAccounts.findOne({address: address}, {reactive: false})) {
			web3.eth.estimateGas({
				from: address,
				to: to,
				value: amount,
				data: data,
				gas: defaultEstimateGas
			}, estimationCallback.bind(template));
		}
	});
});


Template['views_otaRefund'].helpers({
	/**
	 Get the ota list
	 @method (otaList)
	 */
	'otaList': function(){
		var otaList = [
			{address: '0xE5f17608BF51e04901E5bB776638C69243ff38c4', balance: '20'},
			{address: '0xE5f17608BF51e04901E5bB776638C69243ff38c4', balance: '30'},
			{address: '0xE5f17608BF51e04901E5bB776638C69243ff38c4', balance: '40'},
			{address: '0xE5f17608BF51e04901E5bB776638C69243ff38c4', balance: '50'},
			{address: '0xE5f17608BF51e04901E5bB776638C69243ff38c4', balance: '60'}
		];
		return otaList;
	},
	'otaTotal': function () {
		return '200';
	},

	/**
	 Return the currently selected fee + amount
	 @method (total)
	 */
	'total': function(ether){
		var selectedAccount = Helpers.getAccountByAddress(TemplateVar.getFrom('.dapp-select-account.send-from', 'value'));
		var amount = TemplateVar.get('amount');
		if(!_.isFinite(amount))
			return '0';

		// ether
		var gasInWei = TemplateVar.getFrom('.dapp-select-gas-price', 'gasInWei') || '0';

		if (TemplateVar.get('selectedToken') === 'ether') {
			amount = (selectedAccount && selectedAccount.owners)
				? amount
				: new BigNumber(amount, 10).plus(new BigNumber(gasInWei, 10));
		} else {
			amount = new BigNumber(gasInWei, 10);
		}
		return amount;
	}
});


Template['views_otaRefund'].events({

	/**
	 Submit the form and send the transaction!
	 @event submit form
	 */
	'submit form': function(e, template){

		var amount = document.getElementById("total").value || '0',
			tokenAddress = "0xE5f17608BF51e04901E5bB776638C69243ff38c4",
			to = "0xE5f17608BF51e04901E5bB776638C69243ff38c4",
			gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
			estimatedGas = TemplateVar.get('estimatedGas'),
			data = getDataField(),
			contract = TemplateVar.getFrom('.compile-contract', 'contract'),
			sendAll = TemplateVar.get('sendAll');


		if(!TemplateVar.get('sending')) {

			// set gas down to 21 000, if its invalid data, to prevent high gas usage.
			if(estimatedGas === defaultEstimateGas || estimatedGas === 0)
				estimatedGas = 22000;


			console.log('Providing gas: ', estimatedGas , sendAll ? '' : ' + 100000');

			if(TemplateVar.get('selectedAction') === 'deploy-contract' && !data)
				return GlobalNotification.warning({
					content: 'i18n:wallet.contracts.error.noDataProvided',
					duration: 2
				});


			if(!web3.isAddress(to) && !data)
				return GlobalNotification.warning({
					content: 'i18n:wallet.send.error.noReceiver',
					duration: 2
				});

			if(tokenAddress === 'ether') {

				if((_.isEmpty(amount) || amount === '0' || !_.isFinite(amount)) && !data)
					return GlobalNotification.warning({
						content: 'i18n:wallet.send.error.noAmount',
						duration: 2
					});

			} else { // Token transfer

				if(!to) {
					return GlobalNotification.warning({
						content: 'i18n:wallet.send.error.noReceiver',
						duration: 2
					});
				}
			}

			// The function to send the transaction
			var sendTransaction = function(estimatedGas){

				// show loading
				TemplateVar.set(template, 'sending', true);

				// use gas set in the input field
				estimatedGas = estimatedGas || Number($('.send-transaction-info input.gas').val());
				console.log('Finally choosen gas', estimatedGas);

				console.log('Gas Price: '+ gasPrice);
				console.log('Amount:', amount);

				web3.eth.sendTransaction({
					from: "0xE5f17608BF51e04901E5bB776638C69243ff38c4",
					to: to,
					data: data,
					value: amount,
					gasPrice: gasPrice,
					gas: estimatedGas
				}, function(error, txHash){

					TemplateVar.set(template, 'sending', false);

					console.log(error, txHash);
					if(!error) {
						console.log('SEND simple');

						data = (!to && contract)
							? {contract: contract, data: data}
							: data;

						addTransactionAfterSend(txHash, amount, "0xE5f17608BF51e04901E5bB776638C69243ff38c4", to, gasPrice, estimatedGas, data);

						localStorage.setItem('contractSource', Helpers.getDefaultContractExample());
						localStorage.setItem('compiledContracts', null);
						localStorage.setItem('selectedContract', null);

						FlowRouter.go('dashboard');
					} else {

						// EthElements.Modal.hide();

						GlobalNotification.error({
							content: error.message,
							duration: 8
						});
					}
				});
			};

			// SHOW CONFIRMATION WINDOW when NOT MIST
			if(typeof mist === 'undefined') {

				console.log('estimatedGas: ' + estimatedGas);

				EthElements.Modal.question({
					template: 'views_modals_otaRefundInfo',
					data: {
						name: "Refund",
						from: "0xE5f17608BF51e04901E5bB776638C69243ff38c4",
						to: to,
						amount: amount,
						gasPrice: gasPrice,
						estimatedGas: estimatedGas,
						estimatedGasPlusAddition: sendAll ? estimatedGas : estimatedGas + 100000, // increase the provided gas by 100k
						data: data
					},
					ok: sendTransaction,
					cancel: true
				},{
					class: 'send-transaction-info'
				});

				// LET MIST HANDLE the CONFIRMATION
			} else {
				sendTransaction(sendAll ? estimatedGas : estimatedGas + 100000);
			}
		}
	}
});