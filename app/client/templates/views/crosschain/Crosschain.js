/**
 Template Controllers
 @module Templates
 */

Template['views_crosschain'].onCreated(function () {
    var template = this;
});

Template['views_crosschain'].onDestroyed(function () {
    var template = this;
});

Template['views_crosschain'].onRendered(function(){
    console.timeEnd('renderAccountPage');
});

Template['views_crosschain'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'allTransactions': function(){
        // var allTransactions = Transactions.find({from: FlowRouter.getParam('address').toLowerCase()}, {sort: {timestamp: -1}}).count();
        return [];
    },

});

Template['views_crosschain'].events({

    /**
     Clicking the name, will make it editable
     @event click .edit-name
     */

    'click .edit-icon': function (e) {

        var edit = document.getElementById('edit-name');
        $(edit).attr('contenteditable','true');

        var text = edit.innerHTML;
        edit.focus();
        edit.value = text;
    },

    'click .edit-name': function(e){
        // make it editable
        $(e.currentTarget).attr('contenteditable','true');
    },
    /**
     Prevent enter
     @event keypress .edit-name
     */
    'keypress .edit-name': function(e){

        if(e.keyCode === 13)
            e.preventDefault();
    },
    /**
     Bluring the name, will save it
     @event blur .edit-name, keyup .edit-name
     */
    'blur .edit-name, keyup .edit-name': function(e){

        var $el = $(e.currentTarget);

        if(!e.keyCode || e.keyCode === 13) {
            var text = $el.text();

            if(_.isEmpty(text)) {
                text = TAPi18n.__('wallet.accounts.defaultName');
            }

            // Save new name
            Wallets.update(this._id, {$set: {
                    name: text
                }});
            EthAccounts.update(this._id, {$set: {
                    name: text
                }});
            CustomContracts.update(this._id, {$set: {
                    name: text
                }});

            // make it non-editable
            $el.attr('contenteditable', null);
        }
    },
    /**
     Click to copy the code to the clipboard

     @event click a.create.account
     */
    // 'click .start-to-scan-block-button': accountStartScanEventHandler,
    // 'click .copy-to-clipboard-button': accountClipboardEventHandler,
    // 'click .copy-to-clipboard-wbutton': accountClipboardEventHandler,

    /**
     Tries to copy account token.

     @event copy .copyable-address span
     */
    // 'copy .copyable-address': accountClipboardEventHandler,
    // 'copy .copyable-waddress': accountClipboardEventHandler,



    /**
     Click to reveal QR Code

     @event click a.create.account
     */
    'click .qrcode-button': function(e){
        e.preventDefault();

        var name = e.target.name;
        // console.log('name: ', name);

        // Open a modal showing the QR Code
        EthElements.Modal.show({
            template: 'views_modals_qrCode',
            data: {
                address: name
            }
        });
    },

    'click .transfer': function (e) {

        return GlobalNotification.warning({
            content: "Please make sure you have sufficient balance",
            duration: 2
        });
    },

    'click .refund': function (e) {

        return GlobalNotification.warning({
            content: "Please add WANs to Public Address to pay for Gas.",
            duration: 2
        });
    },


    'click .history': function (e) {
        var wanSendTransaction = function() {
            console.log('aaaa');
        };

        EthElements.Modal.question({
            template: 'views_modals_sendTransactionInfo',
            data: {
                from: '0x00000000',
                to: '0x00000000',
                amount: 1000,
                gasPrice: 1000,
                estimatedGas: 1000,
                estimatedGasPlusAddition: 100000, // increase the provided gas by 100k
                // data: data
            },
            ok: wanSendTransaction,
            cancel: true
        },{
            class: 'send-transaction-info'
        });
    }
});

