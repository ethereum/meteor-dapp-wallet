/**
Template Controllers

@module Templates
*/

/**
The account template

@class [template] elements_account
@constructor
*/

Template['elements_account'].rendered = function(){

    // initiate the geo pattern
    var pattern = GeoPattern.generate(this.data.publicKey);
    this.$('.account-pattern').css('background-image', pattern.toDataUrl());
};


Template['elements_account'].helpers({
    /**
    Get the current account

    @method (account)
    */
    'account': function(){
        return {};
    },
});

Template['elements_account'].events({
    /**
    Select the whole text of the input

    @event click input[type="text"]
    */
    // 'click input[type="text"]': function(e){
    //     $(e.currentTarget).focus().select();
    // }
});
