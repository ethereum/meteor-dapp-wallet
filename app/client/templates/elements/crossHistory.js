/**
Template Controllers

@module Templates
*/

Template['elements_cross_transactions_table'].onCreated(function(){
    let template = this;

    mist.ETH2WETH().listHistory(this.data.addressList.concat(this.data.wanAddressList), (err, result) => {
        // console.log('crosschainList', result);
        TemplateVar.set(template, 'crosschainList', result);

        _.each(result, function (value, index) {
            let htlcTime = value.time + '<span style="color: red"> + 4h</span>';
            TemplateVar.set(template, 'htlcTime', htlcTime);
        });
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ETH2WETH().listHistory(self.data.addressList.concat(self.data.wanAddressList), (err, result) => {
            // console.log('crosschainList', result);
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
                    value.state = "Revoke";
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
        let id = e.target.id;
        let show_data = TemplateVar.get('crosschainList')[id];
        // console.log('show_data: ', show_data.status);


        let getGasPrice;
        let getGas;
        let gasPrice;
        let transData;
        let trans;
        let transType;
        let coinBalance;

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

            let getRefundTransData;

            if (show_data.chain === 'ETH') {
                // release x in wan
                getRefundTransData = await Helpers.promisefy(mist.ETH2WETH().getRefundTransData, [trans], mist.ETH2WETH());
                coinBalance = await Helpers.promisefy(mist.WETH2ETH().getBalance, [show_data.crossAdress.toLowerCase()], mist.WETH2ETH());

                transData = getRefundTransData.refundTransData;
                // console.log('transData: ', transData);
            } else {
                // release x in eth
                getRefundTransData = await Helpers.promisefy(mist.WETH2ETH().getRefundTransData, [trans], mist.WETH2ETH());
                coinBalance = await Helpers.promisefy(mist.ETH2WETH().getBalance, [show_data.crossAdress.toLowerCase()], mist.ETH2WETH());

                transData = getRefundTransData.refundTransData;
                // console.log('transData: ', transData);
            }
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
                from: show_data.from, amount: show_data.value.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                x: show_data.x,
                gas: getGas, gasPrice: gasPrice
            };

            let getRevokeTransData;

            if (show_data.chain === 'ETH') {
                // revoke x in eth
                console.log('getRevokeTransData ETH: ', show_data.chain);

                getRevokeTransData = await Helpers.promisefy(mist.ETH2WETH().getRevokeTransData, [trans], mist.ETH2WETH());
                coinBalance = await Helpers.promisefy(mist.ETH2WETH().getBalance, [show_data.from.toLowerCase()], mist.ETH2WETH());

                transData = getRevokeTransData.revokeTransData;
            } else {
                // revoke x in wan
                console.log('getRevokeTransData WAN: ', show_data.chain);

                getRevokeTransData = await Helpers.promisefy(mist.WETH2ETH().getRevokeTransData, [trans], mist.WETH2ETH());
                coinBalance = await Helpers.promisefy(mist.WETH2ETH().getBalance, [show_data.from.toLowerCase()], mist.WETH2ETH());

                transData = getRevokeTransData.revokeTransData;
            }

            // console.log('transData: ', transData);
        }

        // other status
        else {
            return GlobalNotification.warning({
                content: 'Cant not operate',
                duration: 2
            });
        }


        let fee = new BigNumber(getGas * gasPrice);

        // console.log('fee: ', fee);
        // console.log('coinBalance: ', new BigNumber(coinBalance, 10));

        if(fee.gt(new BigNumber(coinBalance, 10)))
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
                fee: EthTools.formatBalance(fee, '0,0.00[0000000000000000]', 'ether'),
                gasPrice: gasPrice,
                estimatedGas: getGas,
                data: transData,
                trans: trans,
                transType: transType,
                Chain: show_data.chain,
            },
        },{
            class: 'send-transaction-info'
        });

    },
});


