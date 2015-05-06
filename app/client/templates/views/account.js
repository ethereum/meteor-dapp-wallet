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
    var qrcodesvg = new Qrcodesvg( this.data.address, 'qrcode', 150, {"ecclevel" : 1});
    qrcodesvg.draw({"method": "classic", "fill-colors":["#555","#555","#666"]}, {"stroke-width":1});
});


Template['views_account'].helpers({
    /**
    Get the name

    @method (name)
    */
    'name': function(){
        return this.name || TAPi18n.__('wallet.accounts.defaultName');
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
