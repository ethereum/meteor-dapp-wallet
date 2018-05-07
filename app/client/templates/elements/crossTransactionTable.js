/**
Template Controllers

@module Templates
*/

Template['elements_cross_transactions_table'].onCreated(function(){
    var template = this;

    // console.log('this.data', this.data);

    mist.ETH2WETH().listHistory(this.data.addressList, (err, result) => {
        TemplateVar.set(template, 'crosschainList', result);
    });

    mist.WETH2ETH().getMultiBalances(this.data.wanAddressList, (err, result) => {
        // console.log('getMultiBalances', result);
        TemplateVar.set(template, 'wanAccounts', result);
    });


    mist.ETH2WETH().getGasPrice('WAN', function (err,data) {
        if (err) {
            Session.set('clickButton', 1);
        } else {
            // console.log('releaseX getGasPrice: ', data);
            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
            TemplateVar.set(template,'RefundGas', data.RefundGas);
            TemplateVar.set(template,'gasPrice', data.gasPrice);

            // console.log('fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));
            var number = new BigNumber(data.RefundGas * data.gasPrice);
            // console.log('formatBalance', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));

            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));
        }
    });


    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ETH2WETH().listHistory(self.data.addressList, (err, result) => {
            // console.log('crosschainList');
            TemplateVar.set(template, 'crosschainList', result);
        });

    }, 2000);
});

Template['elements_cross_transactions_table'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});


Template['elements_cross_transactions_table'].helpers({
    historyList: function () {
        // console.log('historyList');

        const wanAccounts = TemplateVar.get('wanAccounts');

        let result = [];
        if (wanAccounts) {

            _.each(wanAccounts, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');
                const name = index.slice(2, 6) + index.slice(38);
                result.push({name: name, address: index, balance: balance})
            });
        }

        Session.set('wanList', result);


        let crosschainList = [];

        if (TemplateVar.get('crosschainList') && TemplateVar.get('crosschainList').length > 0) {

            _.each(TemplateVar.get('crosschainList'), function (value, index) {
                // console.log('this.data: ', value);
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

        return crosschainList;
    }
});
Template['elements_cross_transactions_table'].events({

    'click .crosschain-list': async function (e) {
        var fee = TemplateVar.get('fee');
        var RefundGas = TemplateVar.get('RefundGas');
        var gasPrice = TemplateVar.get('gasPrice');
        var wanAccounts = TemplateVar.get('wanAccounts');

        var id = e.target.id;
        // console.log('crosschainList: ', TemplateVar.get('crosschainList')[id]);
        var show_data = TemplateVar.get('crosschainList')[id];

        console.log('show_data: ', show_data.status);

        if (show_data.status === 'waitingX') {
            var trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.value.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                gas: RefundGas, gasPrice: gasPrice
            };

            let getRefundTransData = await Helpers.promisefy(mist.ETH2WETH().getRefundTransData, [trans], mist.ETH2WETH());
            let sendRefundTransData = '';
            // console.log('getRefundTransData: ', getRefundTransData);

            let sendTransaction = async function () {
                let password_input = document.getElementById('releaseX-psd').value;

                var wanBalance = wanAccounts[show_data.crossAdress.toLowerCase()];

                if(!password_input) {
                    return GlobalNotification.warning({
                        content: 'the password empty',
                        duration: 2
                    });
                }

                if(new BigNumber(fee, 10).gt(new BigNumber(wanBalance, 10)))
                    return GlobalNotification.warning({
                        content: 'i18n:wallet.send.error.notEnoughFunds',
                        duration: 2
                    });

                try {
                    sendRefundTransData = await Helpers.promisefy(
                        mist.ETH2WETH().sendRefundTrans,
                        [trans, password_input],
                        mist.ETH2WETH()
                    );

                    // console.log('sendRefundTransData result', sendRefundTransData);

                } catch (error) {
                    // console.log('sendLockTransData error', error);

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
            };

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
                    estimatedGas: RefundGas,
                    data: getRefundTransData.refundTransData
                },
                ok: sendTransaction,
                cancel: true
            },{
                class: 'send-transaction-info'
            });
        } else if (show_data.status === 'waitingRevoke') {
            var trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.value.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                gas: RefundGas, gasPrice: gasPrice
            };

            let getRefundTransData = await Helpers.promisefy(mist.ETH2WETH().getRefundTransData, [trans], mist.ETH2WETH());
            let sendRefundTransData = '';
            // console.log('getRefundTransData: ', getRefundTransData);

            let sendTransaction = async function () {
                let password_input = document.getElementById('releaseX-psd').value;

                // console.log('password: ', password_input);

                if(!password_input) {
                    return GlobalNotification.warning({
                        content: 'the password empty',
                        duration: 2
                    });
                }

                try {
                    sendRefundTransData = await Helpers.promisefy(
                        mist.ETH2WETH().sendRefundTrans,
                        [trans, password_input],
                        mist.ETH2WETH()
                    );

                    // console.log('sendRefundTransData result', sendRefundTransData);

                } catch (error) {
                    // console.log('sendLockTransData error', error);

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
            };

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
                    estimatedGas: RefundGas,
                    data: getRefundTransData.refundTransData
                },
                ok: sendTransaction,
                cancel: true
            },{
                class: 'send-transaction-info'
            });
        } else {
            return GlobalNotification.warning({
                content: 'Cant not operate',
                duration: 2
            });
        }

    },
});


