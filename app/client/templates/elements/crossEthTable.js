
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

Template['elements_account_table'].onCreated(function () {
    let template = this;
    // console.log('addressList: ', this.data);

    mist.ETH2WETH().getMultiBalances(this.data.addressList, (err, result) => {
        // console.log('getMultiBalances', result);
        TemplateVar.set(template,'ethAccounts',result);
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ETH2WETH().getMultiBalances(self.data.addressList, (err, result) => {
            TemplateVar.set(template,'ethAccounts',result);
        });

    }, 10000);


});

Template['elements_account_table'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});

Template['elements_account_table'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'ethAccounts': function(){

        //eth account list
        const ethAccounts = TemplateVar.get('ethAccounts');

        let result = [];
        if (ethAccounts) {

            _.each(ethAccounts, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');
                const name = index.slice(2, 6) + index.slice(38);
                result.push({name: name, address: index, balance: balance})
            });
        }

        // console.log('ethList: ', result);

        return result;
    },

});

Template['elements_account_table'].events({
    'click .copy-to-clipboard-button': accountClipboardEventHandler,

    'click .qrcode-button': function(e){
        e.preventDefault();

        let name = e.target.name;

        // Open a modal showing the QR Code
        EthElements.Modal.show({
            template: 'views_modals_qrCode',
            data: {
                address: name
            }
        });
    },
});
