/**
Template Controllers

@module Templates
*/

/**
The select account template

@class [template] elements_selectAccount
@constructor
*/

Template['elements_selectAccount'].onCreated(function(){
    if(this.data && this.data.accounts) {
        TemplateVar.set('selectedAccount', this.data.accounts.fetch()[0].address);
    }
});


Template['elements_selectAccount'].helpers({
    /**
    Return the selected address

    @method (selectedAccount)
    */
    'selectedAccount': function(){
        return TemplateVar.get('selectedAccount');
    },
});

Template['elements_selectAccount'].events({
    /**
    Set the selected address.
    
    @event change select[name="select-accounts"]
    */
    'change select[name="select-accounts"]': function(e){
        TemplateVar.set('selectedAccount', e.currentTarget.value);
    }
});
