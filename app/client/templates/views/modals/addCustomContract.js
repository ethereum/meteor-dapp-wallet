/**
Modal to add watch contracts.

@class [template] views_modals_addCustomContract
@constructor
*/


Template['views_modals_addCustomContract'].onRendered(function(){
    this.$('input[name="name"]').focus();
});
