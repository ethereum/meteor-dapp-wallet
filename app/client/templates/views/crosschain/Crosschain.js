/**
 Template Controllers
 @module Templates
 */

Template['views_crosschain'].onCreated(function () {
    let template = this;

    EthElements.Modal.show('views_modals_loading', {closeable: false, class: 'crosschain-loading'});

    mist.ETH2WETH().getAddressList('ETH', function (err, addressList) {
        if (err) {
            console.log('err: ', err);
            Helpers.showError(err);
        } else {
            TemplateVar.set(template,'addressList',addressList);
            Session.set('addressList', addressList);

            mist.ETH2WETH().getAddressList('WAN', function (err, wanAddressList) {
                if (err) {
                    console.log('err: ', err);
                    Helpers.showError(err);
                } else {
                    Session.set('wanAddressList', wanAddressList);

                    TemplateVar.set(template,'wanAddressList',wanAddressList);

                    EthElements.Modal.hide();
                }
            });
        }
    });

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

