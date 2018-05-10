/**
 Template Controllers
 @module Templates
 */

/**
 The add user template
 @class [template] views_ethsend
 @constructor
 */


/**
 The default gas to provide for estimates. This is set manually,
 so that invalid data etsimates this value and we can later set it down and show a warning,
 when the user actually wants to send the dummy data.
 @property defaultEstimateGas
 */
var defaultEstimateGas = 50000000;

var checkAddress = function (waddress) {
    if(!waddress){
        return;
    }

    var value = waddress.replace(/[\s\*\(\)\!\?\#\$\%]+/g, '');

    // add 0x
    if (value.length === 40 && value.indexOf('0x') === -1 && /^[0-9a-f]+$/.test(value.toLowerCase())) {
        value = '0x' + value;
    }

    var regex = /^(0x)?[0-9a-fA-F]{40}$/;

    if (regex.test(value.toLowerCase())) {
        return value
    }

    return;
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
Template['views_ethsend'].onCreated(function(){
    var template = this;


    mist.ETH2WETH().getAddressList('ETH',function (err,data) {
        // console.log(err);
        // console.log(data);

        if (err) {
            TemplateVar.set(template,'ethAccounts', []);
        } else {
            mist.ETH2WETH().getMultiBalances(data, (err, result) => {

                TemplateVar.set(template,'ethAccounts',result);
                _.each(result, function (value, index) {
                    TemplateVar.setTo('select[name="dapp-select-account"].send-from', 'value',index.toLowerCase());
                    return;
                });

            });
        }
    });

});



Template['views_ethsend'].onRendered(function(){
    var template = this;

    this.$('input[name="to"]').focus();

    // ->> GAS PRICE ESTIMATION
    template.autorun(function(c){

        var address = TemplateVar.getFrom('.dapp-select-account.send-from', 'value'),
            to = TemplateVar.getFrom('.dapp-address-input .to', 'value'),
            amount = TemplateVar.get('amount') || '0';

        if(_.isString(address))
            address = address.toLowerCase();

        // Ether tx estimation
        if(EthAccounts.findOne({address: address}, {reactive: false})) {

            web3.eth.estimateGas({
                from: address,
                to: to,
                value: amount,
                data: '',
                gas: defaultEstimateGas
            }, estimationCallback.bind(template));

            // Wallet tx estimation
        } else if(wallet = Wallets.findOne({address: address}, {reactive: false})) {

            if(contracts['ct_'+ wallet._id])
                contracts['ct_'+ wallet._id].execute.estimateGas(to || '', amount || '', data || '',{
                    from: wallet.owners[0],
                    gas: defaultEstimateGas
                }, estimationCallback.bind(template));
        }


    });
});


Template['views_ethsend'].helpers({
    'wanBalance': function () {
        return TemplateVar.get('wanBalance');
    },

    'selectAccount': function () {

        const ethAccounts = TemplateVar.get('ethAccounts');
        // console.log('ethAccounts', ethAccounts);

        let result = [];
        if (ethAccounts) {

            _.each(ethAccounts, function (value, index) {
                console.log("value:"+value+"   index:"+index);
                //const balance =  web3.fromWei(value, 'ether');
                const balance =  value;
                const name = index.slice(2, 6) + index.slice(38);
                result.push({name: name, address: index, balance: balance})
            });
        }

        return result;
    },

    /**
     Return the currently selected fee + amount
     @method (total)
     */
    'total': function(ether){
        var address = TemplateVar.getFrom('.dapp-select-account.send-from', 'value');
        var amount = TemplateVar.get('amount');
        if(!_.isFinite(amount) || !_.isFinite(address))
            return '0';

        // ether
        var gasInWei = TemplateVar.getFrom('.dapp-select-gas-price', 'gasInWei') || '0';

        amount = new BigNumber(amount, 10).plus(new BigNumber(gasInWei, 10));
        return amount;
    },

    /**
     Clear amount from characters
     @method (clearAmountFromChars)
     */
    'clearAmountFromChars': function(amount){
        amount = (~amount.indexOf('.'))
            ? amount.replace(/\,/g,'')
            : amount;

        return amount.replace(/ /g,'');
    }
});


Template['views_ethsend'].events({

    /**
     Set the amount while typing
     @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
     */
    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(e, template){

        var wei = EthTools.toWei(e.currentTarget.value.replace(',','.'));

        TemplateVar.set('amount', wei || '0');

    },

    /**
     Submit the form and send the transaction!
     @event submit form
     */
    'submit form': function(e, template){

        var amount = TemplateVar.get('amount') || '0',
            address = checkAddress(TemplateVar.getFrom('.dapp-select-account.send-from', 'value')),
            to = checkAddress(TemplateVar.getFrom('.dapp-address-input .to', 'value')),
            gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
            estimatedGas = TemplateVar.get('estimatedGas'),
            contract = TemplateVar.getFrom('.compile-contract', 'contract');
        var balance = 0;

        if(!address)
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.emptyWallet',
                duration: 2
            });

        if(!to) {
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.noReceiver',
                duration: 2
            });
        }

        mist.ETH2WETH().getBalance(address,function (err,data) {
            // console.log(err);
            // console.log(data);
            if (err) {
                console.error("getBalance() ",err);
            } else {
                balance = data;
                conditional();
            }

        });

        var conditional = function(){

            if(!TemplateVar.get(template, 'sending')) {

                // set gas down to 21 000, if its invalid data, to prevent high gas usage.
                if(estimatedGas === defaultEstimateGas || estimatedGas === 0)
                    estimatedGas = 100000;

                if(balance === '0' || !web3.isAddress(address))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.emptyWallet',
                        duration: 2
                    });

                if(!web3.isAddress(to))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.noReceiver',
                        duration: 2
                    });

                if(_.isEmpty(amount) || amount === '0' || !_.isFinite(amount))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.noAmount',
                        duration: 2
                    });

                if(new BigNumber(amount, 10).gt(new BigNumber(balance, 10)))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });


                var allBalance = new BigNumber(balance);

                var total = new BigNumber(estimatedGas).mul(new BigNumber(gasPrice)).add(new BigNumber(amount));


                if(allBalance.lt(total))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });

                EthElements.Modal.question({
                    template: 'views_modals_sendEthTransactionInfo',
                    data: {
                        from: address,
                        to: to,
                        amount: amount,
                        gasPrice: gasPrice,
                        estimatedGas: estimatedGas,
                        estimatedGasPlusAddition: estimatedGas, // increase the provided gas by 100k
                        data: "",
                    },
                },{
                    class: 'send-transaction-info'
                });


            }
        }

    }
});
