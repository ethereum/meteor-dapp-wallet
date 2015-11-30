/**
The template to display the ABI.

@class [template] views_modals_interface
@constructor
*/

Template['views_modals_interface'].helpers({
    /**
    Return the ABI in string formart

    @method (abi)
    */
    'abiString': function() {
        // return JSON.stringify(this.abi);
        return JSON.stringify(this.abiInterface);
    }
});