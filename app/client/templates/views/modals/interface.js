/**
The template to display the ABI.

@class [template] views_modals_interface
@constructor
*/

Template['views_modals_interface'].helpers({
    /**
    Return the ABI in string formart

    @method (jsonInterface)
    */
    'jsonInterface': function() {
        return JSON.stringify(this.jsonInterface, null, 2).replace(/\s+/g,' ');
    }
});

Template['views_modals_interface'].events({
    'focus textarea': function(e, template){
        Tracker.afterFlush(function(){
            template.$('textarea').select();
        });
    }
})