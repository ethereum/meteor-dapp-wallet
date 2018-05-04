/**
 Template Controllers
 @module Templates
 */


Template['views_crosschain'].onCreated(async function () {
    let template = this;

    try {
        // eth => weth
        let addressList = await Helpers.promisefy(
            mist.ETH2WETH().getAddressList,
            ['ETH'],
            mist.ETH2WETH()
        );

        // console.log('addressList: ', addressList);

        mist.ETH2WETH().getMultiBalances(addressList, (err, result) => {
            // console.log(result);
            TemplateVar.set(template,'ethAccounts',result);
        });

        mist.ETH2WETH().listHistory(addressList, (err, result) => {
            // console.log('listHistory', result);
            TemplateVar.set(template,'listHistory',result);
        });

        historyID = Meteor.setInterval(function(){
            let listHistory = TemplateVar.get(template,'listHistory');

            mist.ETH2WETH().listHistory(addressList, (err, result) => {
                if(!listHistory || listHistory.toString() !== result.toString()) {
                    console.log('update history list');
                    TemplateVar.set(template,'listHistory',result);
                }
            });

        }, 2000);


        // weth => eth
        let wanAddressList = await Helpers.promisefy(
            mist.WETH2ETH().getAddressList,
            ['WAN'],
            mist.WETH2ETH()
        );

        mist.WETH2ETH().getMultiBalances(wanAddressList, (err, result) => {
            // console.log('wanAddressList', result);
            TemplateVar.set(template,'wanAccounts',result);
        });

        mist.WETH2ETH().listHistory(wanAddressList, (err, result) => {
            console.log('wanListHistory', result);
            TemplateVar.set(template,'wanListHistory',result);
        });

        // historyID = Meteor.setInterval(function(){
        //     let listHistory = TemplateVar.get(template,'listHistory');
        //
        //     mist.ETH2WETH().listHistory(addressList, (err, result) => {
        //         if(!listHistory || listHistory.toString() !== result.toString()) {
        //             console.log('update history list');
        //             TemplateVar.set(template,'listHistory',result);
        //         }
        //     });
        //
        // }, 2000);

    } catch (error) {
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

});

Template['views_crosschain'].onDestroyed(function () {
    var template = this;
    Meteor.clearInterval(historyID);
});

Template['views_crosschain'].onRendered(function(){
    // console.timeEnd('renderAccountPage');
});

Template['views_crosschain'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'ethAccounts': function(){

        //eth account list
        const ethAccounts = TemplateVar.get('ethAccounts');
        // console.log('ethAccounts', ethAccounts);

        let result = [];
        if (ethAccounts) {

            _.each(ethAccounts, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');
                const name = index.slice(2, 6) + index.slice(38);
                result.push({name: name, address: index, balance: balance})
            });
        }

        Session.set('ethList', result);

        //wan account list
        const wanAccounts = TemplateVar.get('wanAccounts');
        let wanListResult = [];
        if (wanAccounts) {

            _.each(wanAccounts, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');
                const name = index.slice(2, 6) + index.slice(38);
                wanListResult.push({name: name, address: index, balance: balance})
            });
        }

        Session.set('wanList', wanListResult);

        return result;
    },

    'crosschainList': function(){
        return TemplateVar.get('listHistory');
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

});

