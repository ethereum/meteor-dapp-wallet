/**
Template Controllers

@module Templates
*/

/**
The account create template

@class [template] views_account_create
@constructor
*/


Template['views_account_create'].helpers({
    /**
    Return TRUE, if the current section is selected

    @method (showSection)
    */
    'showSection': function(section){
        return TemplateVar.get('selectedSection') === section;
    },
});

Template['views_account_create'].events({
    /**
    Select the current section, based on the radio inputs value.

    @event change input[type="radio"]
    */
    'change input[type="radio"]': function(e){
        TemplateVar.set('selectedSection', e.currentTarget.value);
    }
});
