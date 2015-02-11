/**
Template Controllers

@module Templates
*/

/**
The account create template

@class [template] views_account_create
@constructor
*/


Template['views_account_create'].rendered = function(){
    // focus the input
    this.$('input[name="accountName"]').focus();
};


Template['views_account_create'].helpers({
    /**
    Return TRUE, if the current section is selected

    @method (showSection)
    */
    'showSection': function(section){
        return TemplateVar.get('selectedSection') === section;
    },
    /**
    Return the signees fields

    @method (signees)
    */
    'signees': function(){
        return _.range(TemplateVar.get('multisigSignees'));
    },
    /**
    Get the number of required multisignatures

    @method (multisigSignatures)
    */
    'multisigSignatures': function() {
        return [{
            value: '1',
            text: '1'
        },
        {
            value: '2',
            text: '2'
        },
        {
            value: '3',
            text: '3'
        },
        {
            value: '4',
            text: '4'
        },
        {
            value: '5',
            text: '5'
        },
        {
            value: '6',
            text: '6'
        },
        {
            value: '7',
            text: '7'
        },
        {
            value: '8',
            text: '8'
        }];
    },
    /**
    Get the daily limit units

    @method (dailyLimitUnits)
    */
    'dailyLimitUnits': function(section){
        return [{
            value: 'percent',
            text: '%'
        },
        {
            value: 'eth',
            text: 'ether'
        }];
    },
    /**
    Get the daily limit times

    @method (dailyLimitTimes)
    */
    'dailyLimitTimes': function(section){
        return [{
            value: 'day',
            text: 'day'
        },
        {
            value: 'week',
            text: 'week'
        },
        {
            value: 'month',
            text: 'month'
        },
        {
            value: 'year',
            text: 'year'
        }];
    }
});

Template['views_account_create'].events({
    /**
    Select the current section, based on the radio inputs value.

    @event change input[type="radio"]
    */
    'change input[type="radio"]': function(e){
        TemplateVar.set('selectedSection', e.currentTarget.value);
    },
    /**
    Change the numberof signees

    @event click span[name="multisigSignees"] .simple-modal button
    */
    'click span[name="multisigSignees"] .simple-modal button': function(e){
        TemplateVar.set('multisigSignees',  $(e.currentTarget).data('value'));
    }
});



