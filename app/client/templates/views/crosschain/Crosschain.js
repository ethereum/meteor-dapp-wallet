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

        TemplateVar.set(template,'addressList',addressList);
        Session.set('addressList', addressList);


        // weth => eth
        let wanAddressList = await Helpers.promisefy(
            mist.ETH2WETH().getAddressList,
            ['WAN'],
            mist.WETH2ETH()
        );

        Session.set('wanAddressList', wanAddressList);

        TemplateVar.set(template,'wanAddressList',wanAddressList);

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
    let template = this;
});

Template['views_crosschain'].onRendered(function(){
    let template = this;

});

Template['views_crosschain'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'addressList': function(){
        return TemplateVar.get('addressList');
    },

    'wanAddressList': function(){
        return TemplateVar.get('wanAddressList')
    },

});

Template['views_crosschain'].events({

    /**
     Clicking the name, will make it editable
     @event click .edit-name
     */

    'click .edit-icon': function (e) {

        let edit = document.getElementById('edit-name');
        $(edit).attr('contenteditable','true');

        let text = edit.innerHTML;
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

        let $el = $(e.currentTarget);

        if(!e.keyCode || e.keyCode === 13) {
            let text = $el.text();

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

});

