/**
Template Controllers

@module Templates
*/

/**
The account create template

@class [template] views_account_create
@constructor
*/

Template['views_account_create'].created = function(){
    TemplateVar.set('multisigSignees', 2);
    TemplateVar.set('multisigSignatures', 2);
};


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
        // var template = Template.instance();

        // Tracker.afterFlush(function(){
        //     // set the default signee numbers
        //     TemplateVar.set(template,'multisigSignees', template.$('button[data-name="multisigSignees"]').attr('data-value'));
        // });

        return TemplateVar.get('selectedSection') === section;
    },
    /**
    Return the number of signees

    @method (multisigSigneesValue)
    */
    'multisigSigneesValue': function(section){
        return TemplateVar.get('multisigSignees');
    },
    /**
    Return the number of signees

    @method (multisigSignaturesValue)
    */
    'multisigSignaturesValue': function(section){
        return TemplateVar.get('multisigSignatures');
    },
    /**
    Return the number of signees fields

    @method (signees)
    @return {Array} e.g. [1,2,3,4]
    */
    'signees': function(){
        if (TemplateVar.get('multisigSignatures') > TemplateVar.get('multisigSignees'))
            TemplateVar.set('multisigSignees', TemplateVar.get('multisigSignatures'));

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
    Change the number of signatures

    @event click span[name="multisigSignatures"] .simple-modal button
    */
    'click span[name="multisigSignatures"] .simple-modal button': function(e){
        TemplateVar.set('multisigSignatures',  $(e.currentTarget).data('value'));
    },
    /**
    Change the number of signees

    @event click span[name="multisigSignees"] .simple-modal button
    */
    'click span[name="multisigSignees"] .simple-modal button': function(e){
        TemplateVar.set('multisigSignees',  $(e.currentTarget).data('value'));
    }
});



