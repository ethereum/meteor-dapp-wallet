
let InterID;

const accountClipboardEventHandler = function(e){
    e.preventDefault();

    function copyAddress(){

        let copyTextarea = document.querySelector('.copy-eth-address' + e.target.name);

        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(copyTextarea);
        selection.removeAllRanges();
        selection.addRange(range);

        try {
            document.execCommand('copy');

            GlobalNotification.info({
                content: 'i18n:wallet.accounts.addressCopiedToClipboard',
                duration: 3
            });
        } catch (err) {
            GlobalNotification.error({
                content: 'i18n:wallet.accounts.addressNotCopiedToClipboard',
                closeable: false,
                duration: 3
            });
        }
        selection.removeAllRanges();
    }

    copyAddress();
};

Template['elements_account_table_btc'].onCreated(function () {
    let template = this;
    // console.log('addressList: ', this.data);

    mist.BTC2WBTC().getBtcMultiBalances('BTC', (err, result) => {
        TemplateVar.set(template,'btcAccounts',result.address);
        TemplateVar.set(template,'btcBalance',result.balance);
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.BTC2WBTC().getBtcMultiBalances('BTC', (err, result) => {
            let oldAddressList = TemplateVar.get(template, 'btcAccounts');
            let oldResultHex = web3.toHex(oldAddressList);
            let resultHex = web3.toHex(result);

            if(!oldAddressList || oldResultHex !== resultHex) {
                TemplateVar.set(template,'btcAccounts',result.address);
                TemplateVar.set(template,'btcBalance',result.balance);
            }

        });

    }, 10000);


});

Template['elements_account_table_btc'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});

Template['elements_account_table_btc'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'btcAccounts': function(){
        let btcAccounts = TemplateVar.get('btcAccounts');

        let result = [];
        _.each(btcAccounts, function(address){
            result.push({'address': address});
        });

        return result;
    },

});

Template['elements_account_table_btc'].events({
    'click .copy-to-clipboard-button': accountClipboardEventHandler,

    'click .qrcode-button': function(e){
        e.preventDefault();
        let name = e.target.name;

        Session.set('isShowModal', true);

        // Open a modal showing the QR Code
        EthElements.Modal.show({
            template: 'views_modals_qrCode',
            data: {
                address: name,
                ok: true
            }
        }, {
            closeable: false
        });
    },
});
