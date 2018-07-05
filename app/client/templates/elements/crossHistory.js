/**
Template Controllers

@module Templates
*/

const defaultGasprice = 180000000000;

let InterID;

const stateDict = {
    'sentHashPending': 1, 'sentHashConfirming': 2, 'waitingCross': 3, 'waitingCrossConfirming': 4,
    'waitingX': 5,'sentXPending': 6, 'sentXConfirming': 7, 'refundFinished': 8,
    'waitingRevoke': 9,'sentRevokePending': 10, 'sentRevokeConfirming': 11, 'revokeFinished': 12,
    'sentHashFailed': 13,
};

function resultEach(template, result) {
    _.each(result, function (value, index) {
        delete value.meta;

        if (Helpers.isNumber(value.time)) {

            let nowTime = new Date().Format('yyyy-MM-dd hh:mm:ss:S');
            let nowTimestamp =  Math.round(new Date(nowTime).getTime());

            // HTLCtime
            let endTimestamp= value.HTLCtime;
            // lock time
            let lockTimestamp=(parseInt(value.HTLCtime) + parseInt(value.time)) / 2 - 600;

            if (nowTimestamp >= lockTimestamp && nowTimestamp < endTimestamp) {
                value.lockButton = true;
            } else {
                value.lockButton = false;
            }

            if (endTimestamp > nowTimestamp) {

                if (stateDict[value.status] === 8 || stateDict[value.status] === 12 || stateDict[value.status] === 13) {
                    value.htlcdate = `<span>${Helpers.timeStamp2String(endTimestamp)}</span>`;
                } else {
                    value.htlcdate = `<span style="color: #1ec89a">${Helpers.formatDuring(endTimestamp - nowTimestamp)}</span>`;
                }
            } else {

                if (stateDict[value.status] === 8 || stateDict[value.status] === 12 || stateDict[value.status] === 13) {
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

function showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType) {

    Session.set('isShowModal', true);

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
            symbol: show_data.symbol,
            fromText: show_data.fromText,
            toText: show_data.toText
        },
    },{
        class: 'send-transaction-info',
        closeable: false
    });
}


Template['elements_cross_transactions_table'].onCreated(function(){
    let template = this;

    mist.ETH2WETH().listHistory(this.data.addressList.concat(this.data.wanAddressList), (err, result) => {

        resultEach(template, result);

        Session.set('oldCrosschainList', result);
        TemplateVar.set(template, 'crosschainList', result);
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ETH2WETH().listHistory(self.data.addressList.concat(self.data.wanAddressList), (err, result) => {
            resultEach(template, result);

            let oldCrosschainResult = Session.get('oldCrosschainList');
            let oldResultHex = web3.toHex(oldCrosschainResult);
            let resultHex = web3.toHex(result);

            if(!oldCrosschainResult || oldResultHex !== resultHex ) {
                // console.log('update history transaction: ',oldResultHex !== resultHex);
                Session.set('oldCrosschainList', result);
                TemplateVar.set(template, 'crosschainList', result);
            }
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
            let smallStyle = 'display: block; color: #4b90f7;';

            _.each(TemplateVar.get('crosschainList'), function (value, index) {
                if (value.chain === 'ETH') {
                    value.fromText = `<small style="${smallStyle}">ETH</small>`;
                    value.toText = `<small style="${smallStyle}">WAN</small>`;
                    value.symbol = 'ETH';
                } else if (value.chain === 'WAN') {
                    value.fromText = `<small style="${smallStyle}">WAN</small>`;
                    value.toText = `<small style="${smallStyle}">ETH</small>`;
                    value.symbol = 'WETH';
                }

                let style = 'display: block; font-size: 18px; background-color: transparent;';

                // Release
                if (stateDict[value.status] === 5) {
                    if (value.lockButton) {
                        value.operation = `<h2 style="${style}">Cancel</h2>`;
                        value.state = 'To be cancelled in ' + value.htlcdate;
                    } else {
                        style += 'color: #920b1c;';

                        value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Confirm</h2>`;
                        value.state = 'To be confirmed';
                    }
                }
                // Revoke
                else if (stateDict[value.status] === 9) {
                    style += 'color: #920b1c;';
                    value.operation = `<h2 class="crosschain-list" id = ${index} style="${style}">Cancel</h2>`;
                    value.state = 'To be cancelled';
                }
                // Release or Revoke finished
                else if (stateDict[value.status] === 8 || stateDict[value.status] === 12) {
                    if (stateDict[value.status] === 8) {
                        value.state = 'Success';
                    } else {
                        value.state = 'Cancelled';
                    }

                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // locking
                else if (stateDict[value.status] >= 1 && stateDict[value.status] <= 4) {
                    if (stateDict[value.status] === 1) {
                        value.state = 'Pending';
                    } else if (stateDict[value.status] >= 2){
                        value.state = 'Cross-Tx ' + (stateDict[value.status] - 1).toString() +  '/4';
                    }
                    value.operation = `<h2 style="${style}">Confirm</h2>`;
                }
                // Releasing
                else if (stateDict[value.status] >= 6 && stateDict[value.status] <= 7) {
                    value.state = 'Confirming ' + (stateDict[value.status] - 5).toString() +  '/3';
                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // Revoking
                else if (stateDict[value.status] >= 10 && stateDict[value.status] <= 11) {
                    value.state = 'Cancelling ' + (stateDict[value.status] - 9).toString() +  '/3';
                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // Failed
                else if (stateDict[value.status] === 13) {
                    value.state = 'Failed';
                    value.operation = `<h2 style="${style}"></h2>`;
                }
                // normal
                else {
                    value.state = 'Success';
                    value.crossAdress = value.to;
                    value.htlcdate = '--';
                    value.fromText = `<small style="${smallStyle}">ETH</small>`;
                    value.toText = `<small style="${smallStyle}">ETH</small>`;
                    value.operation = `<h2 style="${style}"></h2>`;
                }

                crosschainList.push(value);
            });
        }

        return crosschainList;
    },

});

Template['elements_cross_transactions_table'].events({

    'click .show-detail': function (e) {
        let id = e.target.id;

        Session.set('isShowModal', true);

        let show_data = TemplateVar.get('crosschainList')[id];
        // console.log('show_data: ', show_data);

        if (show_data) {
            if (!show_data.HashX) {
                show_data.HashX = show_data.txhash;
            }

            if (show_data.chain === 'ETH') {
                show_data.symbol = 'ETH';
            } else if (show_data.chain === 'WAN') {
                show_data.symbol = 'WETH';
            }

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
                    symbol: show_data.symbol,
                    status: show_data.state,
                    fromText: show_data.fromText,
                    toText: show_data.toText
                }
            }, {
                closeable: false
            });

        }

    },

    'click .crosschain-list': function (e) {
        let id = e.target.id;
        let show_data = TemplateVar.get('crosschainList')[id];

        let getGas;
        let gasPrice;
        let transData;
        let trans;
        let transType;

        console.log('show_data.status: ', show_data.status);
        // release X
        if (show_data.status === 'waitingX') {

            if (show_data.lockButton) {
                return GlobalNotification.warning({
                    content: 'Transaction locked now, please retry cancellation later',
                    duration: 2
                });
            }

            transType = 'releaseX';

            trans = {
                lockTxHash: show_data.lockTxHash, amount: show_data.value.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                X: show_data.x
            };

            // release X eth => weth
            if (show_data.chain === 'ETH') {
                mist.ETH2WETH().getGasPrice('WAN', function (err,getGasPrice) {
                    if (err) {
                        Helpers.showError(err);
                    } else {
                        getGas = getGasPrice.RefundGas;
                        gasPrice = getGasPrice.gasPrice;

                        if (gasPrice < defaultGasprice) {
                            gasPrice = defaultGasprice
                        }

                        trans.gas = getGas;
                        trans.gasPrice = gasPrice;

                        show_data.symbol = 'ETH';

                        // release x in wan
                        mist.ETH2WETH().getRefundTransData(trans, function (err,getRefundTransData) {
                            if (err) {
                                Helpers.showError(err);
                            } else {
                                mist.WETH2ETH().getBalance(show_data.crossAdress.toLowerCase(), function (err,coinBalance) {
                                    if (err) {
                                        Helpers.showError(err);
                                    } else {
                                        transData = getRefundTransData.refundTransData;
                                        let fee = new BigNumber(getGas * gasPrice);

                                        if(fee.gt(new BigNumber(coinBalance, 10)))
                                            return GlobalNotification.warning({
                                                content: 'i18n:wallet.send.error.notEnoughFunds',
                                                duration: 2
                                            });

                                        showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                                    }
                                });
                            }
                        });

                    }
                })
            }
            // release X weth => eth
            else if (show_data.chain === 'WAN') {
                mist.ETH2WETH().getGasPrice('ETH', function (err,getGasPrice) {
                    if (err) {
                        Helpers.showError(err);
                    } else {
                        getGas = getGasPrice.RefundGas;
                        gasPrice = getGasPrice.gasPrice;

                        trans.gas = getGas;
                        trans.gasPrice = gasPrice;

                        show_data.symbol = 'WETH';

                        // release x in eth
                        mist.WETH2ETH().getRefundTransData(trans, function (err,getRefundTransData) {
                            if (err) {
                                Helpers.showError(err);
                            } else {
                                // coinBalance = await Helpers.promisefy(mist.WETH2ETH().getBalance, [show_data.crossAdress.toLowerCase()], mist.WETH2ETH());
                                mist.ETH2WETH().getBalance(show_data.crossAdress.toLowerCase(), function (err,coinBalance) {
                                    if (err) {
                                        Helpers.showError(err);
                                    } else {
                                        transData = getRefundTransData.refundTransData;
                                        let fee = new BigNumber(getGas * gasPrice);

                                        if(fee.gt(new BigNumber(coinBalance, 10)))
                                            return GlobalNotification.warning({
                                                content: 'i18n:wallet.send.error.notEnoughFunds',
                                                duration: 2
                                            });

                                        showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                                    }
                                });
                            }
                        });

                    }
                })
            }
        }

        // revoke
        else if (show_data.status === 'waitingRevoke') {

            console.log('revoke lockButton', show_data.lockButton);
            if (show_data.lockButton) {
                return GlobalNotification.warning({
                    content: 'This transaction locked, please wait a moment to revoke',
                    duration: 2
                });
            }

            transType = 'revoke';

            trans = {
                from: show_data.from, amount: show_data.value.toString(10),
                storemanGroup: show_data.storeman, cross: show_data.crossAdress,
                X: show_data.x,
            };

            // revoke eth => weth
            if (show_data.chain === 'ETH') {
                mist.ETH2WETH().getGasPrice('ETH', function (err,getGasPrice) {
                    if (err) {
                        Helpers.showError(err);
                    } else {
                        getGas = getGasPrice.RevokeGas;
                        gasPrice = getGasPrice.gasPrice;

                        trans.gas = getGas;
                        trans.gasPrice = gasPrice;

                        // revoke x in eth
                        console.log('getRevokeTransData ETH: ', show_data.chain);

                        mist.ETH2WETH().getRevokeTransData(trans, function (err,getRevokeTransData) {
                            if (err) {
                                Helpers.showError(err);
                            } else {
                                mist.ETH2WETH().getBalance(show_data.from.toLowerCase(), function (err,coinBalance) {
                                    if (err) {
                                        Helpers.showError(err);
                                    } else {
                                        transData = getRevokeTransData.revokeTransData;
                                        let fee = new BigNumber(getGas * gasPrice);

                                        if(fee.gt(new BigNumber(coinBalance, 10)))
                                            return GlobalNotification.warning({
                                                content: 'i18n:wallet.send.error.notEnoughFunds',
                                                duration: 2
                                            });

                                        showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                                    }
                                });
                            }
                        });
                    }
                })

            }
            // revoke weth => eth
            else if (show_data.chain === 'WAN') {
                mist.ETH2WETH().getGasPrice('WAN', function (err,getGasPrice) {
                    if (err) {
                        Helpers.showError(err);
                    } else {
                        getGas = getGasPrice.RevokeGas;
                        gasPrice = getGasPrice.gasPrice;

                        if (gasPrice < defaultGasprice) {
                            gasPrice = defaultGasprice
                        }

                        trans.gas = getGas;
                        trans.gasPrice = gasPrice;

                        // revoke x in wan
                        console.log('getRevokeTransData WAN: ', show_data.chain);

                        mist.WETH2ETH().getRevokeTransData(trans, function (err,getRevokeTransData) {
                            if (err) {
                                Helpers.showError(err);
                            } else {
                                mist.WETH2ETH().getBalance(show_data.from.toLowerCase(), function (err,coinBalance) {
                                    if (err) {
                                        Helpers.showError(err);
                                    } else {
                                        transData = getRevokeTransData.revokeTransData;
                                        let fee = new BigNumber(getGas * gasPrice);

                                        if(fee.gt(new BigNumber(coinBalance, 10)))
                                            return GlobalNotification.warning({
                                                content: 'i18n:wallet.send.error.notEnoughFunds',
                                                duration: 2
                                            });

                                        showQuestion(show_data, fee, gasPrice, getGas, transData, trans, transType);
                                    }
                                });
                            }
                        });
                    }
                })
            }
        }

        // other status
        else {
            return GlobalNotification.warning({
                content: 'Can not operate',
                duration: 2
            });
        }

    },
});


