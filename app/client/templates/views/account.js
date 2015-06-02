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
    Get the name

    @method (name)
    */
    'name': function(){
        return this.name || TAPi18n.__('wallet.accounts.defaultName');
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
    Get the owners name

    @method (ownerName)
    */
    'ownerName': function(){
        var owner = String(this);
        if(account = Accounts.findOne({address: owner}))
            return account.name;
        else
            return owner;
    },
    /**
    Link the owner either to send or to the account itself.

    @method (ownerLink)
    */
    'ownerLink': function(){
        var owner = String(this);
        if(Accounts.findOne({address: owner}))
            return Router.routes['account'].path({address: owner});
        else
            return Router.routes['sendTo'].path({address: owner});
    }
});

Template['views_account'].events({
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
            Accounts.update(this._id, {$set: {
                name: $(e.currentTarget).text()
            }});

            // make it non-editable
            $(e.currentTarget).attr('contenteditable', null);
        }
    }
});
