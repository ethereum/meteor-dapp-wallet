/**
Modal to add watch contracts.

@class [template] views_modals_addCustomContract
@constructor
*/


Template['views_modals_addCustomContract'].onRendered(function(){
    this.$('input[name="address"]').focus();
});


Template['views_modals_addCustomContract'].events({
    /**
    Change Address

    @event change input[name="address"], input input[name="address"]
    */
    'blur input[name="address"]': function(e, template) {
        let address = e.currentTarget.value;

        Helpers.getENSName(address, (err, name, returnedAddr) => {
            if (address.toLowerCase() == returnedAddr)
                template.$('input.name').val(name).change();            
        });
    }
})