/**
Template Controllers

@module Templates
*/

Template['elements_cross_transactions_table'].onCreated(function(){
    var template = this;

    // console.log('this.data', this.data.crosschainList);
    TemplateVar.set('crosschainList', this.data.crosschainList);

    mist.ETH2WETH().getGasPrice(function (err,data) {
        if (err) {
            Session.set('clickButton', 1);
        } else {
            // console.log(data.LockGas, data.RefundGas, data.RevokeGas, data.gasPrice);
            TemplateVar.set(template,'RefundGas', data.RefundGas);
            TemplateVar.set(template,'gasPrice', data.gasPrice);

            // console.log('fee', data.LockGas * web3.fromWei(data.gasPrice, 'ether'));
            var number = new BigNumber(data.RefundGas * data.gasPrice);
            // console.log('formatBalance', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));

            TemplateVar.set(template, 'fee', EthTools.formatBalance(number, '0,0.00[0000000000000000]', 'ether'));
        }
    });
});

Template['elements_cross_transactions_table'].events({

    'click .crosschain-list': async function (e) {
        var fee = TemplateVar.get('fee');
        var RefundGas = TemplateVar.get('RefundGas');
        var gasPrice = TemplateVar.get('gasPrice');

        var id = e.target.id;
        // console.log('crosschainList: ', TemplateVar.get('crosschainList')[id]);
        var show_data = TemplateVar.get('crosschainList')[id];

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
    },
});


