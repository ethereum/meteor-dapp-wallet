/**
Template Controllers

@module Templates
*/

/**
The template to display account information.

@class [template] views_account
@constructor
*/


Template['views_account'].onRendered(function(){
    if(this.data) {
        var qrcodesvg = new Qrcodesvg( this.data.address, 'qrcode', 150, {"ecclevel" : 1});
        qrcodesvg.draw({"method": "classic", "fill-colors":["#555","#555","#666"]}, {"stroke-width":1});
    }
});


Template['views_account'].helpers({
    /**
    Get the pending confirmations of this account.

    @method (pendingConfirmations)
    */
    'pendingConfirmations': function(){
        return _.pluck(PendingConfirmations.find({operation: {$exists: true}, confirmedOwners: {$ne: []}, from: this.address}).fetch(), '_id');
    },
    /**
    Show dailyLimit section

    @method (showDailyLimit)
    */
    'showDailyLimit': function(){
        return (this.dailyLimit && this.dailyLimit !== ethereumConfig.dailyLimitDefault);
    },
    /**
    Show requiredSignatures section

    @method (showRequiredSignatures)
    */
    'showRequiredSignatures': function(){
        return (this.requiredSignatures && this.requiredSignatures != 1);
    },
    /**
    Link the owner either to send or to the account itself.

    @method (ownerLink)
    */
    'ownerLink': function(){
        var owner = String(this);
        if(Helpers.getAccountByAddress(owner))
            return Router.routes['account'].path({address: owner});
        else
            return Router.routes['sendTo'].path({address: owner});
    }
});

Template['views_account'].events({
    /**
    Clicking the delete button will show delete modal

    @event click button.delete
    */
    'click button.delete': function(e, template){
        Router.current().render('dapp_modal', {
            to: 'modal',
            // data: {
            //     closeable: false
            // }
        });
        Router.current().render('dapp_modal_question', {
            to: 'modalContent',
            data: {
                text: new Spacebars.SafeString(TAPi18n.__('wallet.accounts.modal.deleteText') + 
                    '<br><input type="text" class="deletionConfirmation">'),
                ok: function(){
                    console.log(template.data, $('input.deletionConfirmation').value);
                    if(Wallets.findOne(template.data._id).name === $('input.deletionConfirmation').val()) {
                        Wallets.remove(template.data._id);
                        Router.go('/');
                        return true;
                    }
                },
                cancel: true
            }
        });
    },
    /**
    Clicking the name, will make it editable

    @event click .edit-name
    */
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
        if(!e.keyCode || e.keyCode === 13) {

            // Save new name
            Wallets.update(this._id, {$set: {
                name: $(e.currentTarget).text()
            }});
            EthAccounts.update(this._id, {$set: {
                name: $(e.currentTarget).text()
            }});

            // make it non-editable
            $(e.currentTarget).attr('contenteditable', null);
        }
    }
});
