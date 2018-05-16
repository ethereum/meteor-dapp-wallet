/**
Template Controllers

@module Templates
*/

Template['elements_cross_transactions_table'].onCreated(function(){
    let template = this;

    // console.log('this.data', this.data);

    mist.ETH2WETH().listHistory(this.data.addressList, (err, result) => {
        TemplateVar.set(template, 'crosschainList', result);
    });

    mist.WETH2ETH().getMultiBalances(this.data.wanAddressList, (err, result) => {
        // console.log('getMultiBalances', result);
        TemplateVar.set(template, 'wanAccounts', result);
    });

    mist.WETH2ETH().getMultiBalances(this.data.wanAddressList, (err, result) => {
        // console.log('getMultiBalances', result);
        Session.set('wanBalance', result);
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ETH2WETH().listHistory(self.data.addressList, (err, result) => {
            // console.log('crosschainList');
            TemplateVar.set(template, 'crosschainList', result);
        });

    }, 10000);

});

Template['elements_cross_transactions_table'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});


Template['elements_cross_transactions_table'].helpers({
    historyList: function () {

        let crosschainList = [];

        if (TemplateVar.get('crosschainList') && TemplateVar.get('crosschainList').length > 0) {

            _.each(TemplateVar.get('crosschainList'), function (value, index) {
                // console.log('this.data: ', value);

                if (value.chain === 'ETH') {
                    value.text = '(ETH=>WETH)';
                } else if (value.chain === 'WAN') {
                    value.text = '(WETH=>ETH)';
                }

                if (value.status === 'sentHashPending' || value.status === 'sentHashConfirming' ||
                    value.status === 'waitingCross' || value.status === 'waitingCrossConfirming') {
                    value.state = "";
                }else if (value.status === 'waitingX' || value.status === 'sentXPending' ||
                    value.status === 'sentXConfirming' || value.status === 'finishedX') {
                    value.state = "Release X";
                } else if (value.status === 'waitingRevoke' || value.status === 'sentRevokePending' ||
                    value.status === 'sentRevokeConfirming' || value.status === 'finishedRevoke') {
                    value.state = "Refund";
                }
                crosschainList.push(value);
            });
        }

        // console.log('crosschainList: ', crosschainList);

        return crosschainList;
    }
});
Template['elements_cross_transactions_table'].events({

    'click .show-detail': function (e) {
        let id = e.target.id;

        let show_data = TemplateVar.get('crosschainList')[id];
        // console.log('show_data: ', show_data);

        EthElements.Modal.show({
            template: 'views_modals_crosstransactionInfo',
            data: {
                HashX: show_data.HashX,
                chain: show_data.chain,
                crossAdress: show_data.crossAdress,
                from: show_data.from,
                lockTxHash: show_data.lockTxHash,
                refundTxHash: show_data.refundTxHash,
                revokeTxHash: show_data.revokeTxHash,
                storeman: show_data.storeman,
                time: show_data.time,
                to: show_data.to,
                value: show_data.value,
                x: show_data.x
            }
        });

    },

    'click .crosschain-list': async function (e) {
        let wanAccounts = TemplateVar.get('wanAccounts');
        let id = e.target.id;
        let show_data = TemplateVar.get('crosschainList')[id];
        // console.log('show_data: ', show_data.status);


        let getGasPrice;
        let getGas;
        let gasPrice;
        let transData;
        let trans;
        let transType;

        // waitingX
        if (show_data.status === 'waitingX') {
            transType = 'releaseX';
            getGasPrice = await Helpers.promisefy(mist.ETH2WETH().getGasPrice, ['WAN'], mist.ETH2WETH());

            // console.log('releaseX getPrice', getGasPrice);

            getGas = getGasPrice.RefundGas;
            gasPrice = getGasPrice.gasPrice;

            if (gasPrice < 180000000000) {
                gasPrice = 180000000000
            }

            trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.value.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                gas: getGas, gasPrice: gasPrice
            };

            let getRefundTransData = await Helpers.promisefy(mist.ETH2WETH().getRefundTransData, [trans], mist.ETH2WETH());
            transData = getRefundTransData.refundTransData;
            // console.log('transData: ', transData);
        }

        // waitingRevoke
        else if (show_data.status === 'waitingRevoke') {
            transType = 'revoke';
            getGasPrice = await Helpers.promisefy(mist.ETH2WETH().getGasPrice, ['ETH'], mist.ETH2WETH());

            // console.log('revoke getPrice', getGasPrice);

            getGas = getGasPrice.RevokeGas;
            gasPrice = getGasPrice.gasPrice;

            if (gasPrice < 180000000000) {
                gasPrice = 180000000000
            }

            trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.value.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                gas: getGas, gasPrice: gasPrice
            };

            let getRevokeTransData = await Helpers.promisefy(mist.ETH2WETH().getRevokeTransData, [trans], mist.ETH2WETH());
            transData = getRevokeTransData.revokeTransData;
            // console.log('getRevokeTransData: ', transData);
        }

        // other status
        else {
            return GlobalNotification.warning({
                content: 'Cant not operate',
                duration: 2
            });
        }


        let number = new BigNumber(getGas * gasPrice);
        let fee = EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether');
        let wanBalance = wanAccounts[show_data.crossAdress.toLowerCase()];

        // console.log('fee', fee);
        // console.log('wanBalance', wanBalance);

        if(new BigNumber(fee, 10).gt(new BigNumber(wanBalance, 10)))
            return GlobalNotification.warning({
                content: 'i18n:wallet.send.error.notEnoughFunds',
                duration: 2
            });

        // console.log('transData: ', transData);

        EthElements.Modal.question({
            template: 'views_modals_sendcrosschainReleaseX',
            data: {
                from: show_data.from,
                to: show_data.to,
                storeman: show_data.storeman,
                crossAdress: show_data.crossAdress,
                amount: show_data.value,
                fee: fee,
                gasPrice: gasPrice,
                estimatedGas: getGas,
                data: transData,
                trans: trans,
                transType: transType
            },
        },{
            class: 'send-transaction-info'
        });

    },
});


