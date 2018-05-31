/**
Template Controllers

@module Templates
*/

const defaultGasprice = 180000000000;
const defaultEndtime = 14400000;

function resultEach(result) {
    _.each(result, function (value, index) {

        if (Helpers.isNumber(value.time)) {

            let nowTime = new Date().Format('yyyy-MM-dd hh:mm:ss:S');
            let nowTimestamp =  Math.round(new Date(nowTime).getTime());

            // add 4h
            let endTimestamp=parseInt(value.time) + defaultEndtime;

            if (endTimestamp > nowTimestamp) {
                if (value.status === 'refundFinished' || value.status === 'revokeFinished') {
                    value.htlcdate = `<span>${Helpers.timeStamp2String(endTimestamp)}</span>`;
                } else {
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(endTimestamp - nowTimestamp)}</span>`;
                }
            } else {
                if (value.status === 'refundFinished' || value.status === 'revokeFinished') {
                    value.htlcdate = `<span>${Helpers.timeStamp2String(endTimestamp)}</span>`;
                } else {
                    value.htlcdate = "<span style='color: red'>00 h, 00 min</span>";
                }
            }
            value.time = Helpers.timeStamp2String(value.time);
        } else {
            value.htlcdate = `<span>${value.time}</span>`;
        }

    });
}


Template['elements_cross_transactions_table'].onCreated(function(){
    let template = this;

    mist.ETH2WETH().listHistory(this.data.addressList.concat(this.data.wanAddressList), (err, result) => {

        resultEach(result);

        TemplateVar.set(template, 'crosschainList', result);
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ETH2WETH().listHistory(self.data.addressList.concat(self.data.wanAddressList), (err, result) => {

            resultEach(result);

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
                    value.text = '<small>(ETH=>WETH)</small>';
                } else if (value.chain === 'WAN') {
                    value.text = '<small>(WETH=>ETH)</small>';
                }

                let style = 'display: block; font-size: 18px;';

                if (value.status === 'sentHashPending' || value.status === 'sentHashConfirming' ||
                    value.status === 'waitingCross' || value.status === 'waitingCrossConfirming' ||
                    value.status === 'sentXPending' || value.status === 'sentXConfirming' ||
                    value.status === 'sentRevokePending' || value.status === 'sentRevokeConfirming' ) {
                    style += 'color: #1ec89a;';
                    value.state = `<h2 class="crosschain-list" id = ${index} style="${style}">Doing</h2>`;
                } else if (value.status === 'refundFinished' || value.status === 'revokeFinished') {
                    style += 'color: #4b90f7;';
                    value.state = `<h2 class="crosschain-list" id = ${index}  style="${style}">Done</h2>`;
                } else if (value.status === 'waitingX') {
                    style += 'color: #920b1c;';
                    value.state = `<h2 class="crosschain-list" id = ${index} style="${style}">Release X</h2>`;
                } else if (value.status === 'waitingRevoke') {
                    style += 'color: #920b1c;';
                    value.state = `<h2 class="crosschain-list" id = ${index} style="${style}">Revoke</h2>`;
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
                x: show_data.x,
                status: show_data.status,
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

            if (gasPrice < defaultGasprice) {
                gasPrice = defaultGasprice
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

            if (gasPrice < defaultGasprice) {
                gasPrice = defaultGasprice
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


