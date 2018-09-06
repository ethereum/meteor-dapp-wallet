/**
 Template Controllers
 @module Templates
 */

let InterID;

 const getAddressList = function(template) {

    mist.ETH2WETH().getAddressList('WAN', function (err, wanAddressList) {
        EthElements.Modal.hide();

        if (!err) {
            let oldWanAddressList = TemplateVar.get(template, 'wanAddressList');

            if(!oldWanAddressList || oldWanAddressList.length !== wanAddressList.length) {
                // console.log('update wanAddressList');

                Session.set('wanAddressList', wanAddressList);
                TemplateVar.set(template,'wanAddressList',wanAddressList);
            }
        }
    });

 };

Template['views_crosschain_btc'].onCreated(function () {
    let template = this;

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    getAddressList(template);

    InterID = Meteor.setInterval(function(){
        if(!Session.get('isShowModal')) {
            getAddressList(template);
        } else {
            console.log('isShowModal: ', Session.get('isShowModal'));
        }
        }, 10000);

});

Template['views_crosschain_btc'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});

Template['views_crosschain_btc'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */

    'wanAddressList': function(){
        return TemplateVar.get('wanAddressList');
    },

});

Template['views_crosschain_btc'].events({

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

