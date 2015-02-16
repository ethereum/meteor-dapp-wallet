/**
Template Controllers

@module Templates
*/

/**
The account template

@class [template] elements_account
@constructor
*/

var intervalId = null;


Template['elements_account'].rendered = function(){

    // initiate the geo pattern
    var pattern = GeoPattern.generate(this.data._id);
    this.$('.account-pattern').css('background-image', pattern.toDataUrl());
};


Template['elements_account'].helpers({
    /**
    Get the current account

    @method (account)
    */
    'account': function(){
        return Accounts.findOne(this.account);
    },
    /**
    Get the name

    @method (name)
    */
    'name': function(){
        return this.name || TAPi18n.__('wallet.accounts.defaultName');
    },
    /**
    Get the current balance and count it up/down to the new balance.

    @method (getBalance)
    */
    'getBalance': function(){
        var data = this,
            template = Template.instance(),
            newBalance = (_.isFinite(this.balance)) ? Number(this.balance) : 0;

        Meteor.clearInterval(intervalId);

        intervalId = Meteor.setInterval(function(){
            var oldBalance = TemplateVar.get(template, 'balance'),
                calcBalance = Math.floor((newBalance - oldBalance) / 10);

            if(oldBalance &&
               oldBalance !== newBalance &&
               (calcBalance > 10000000000 || (calcBalance < 0 && calcBalance < -10000000000)))
                TemplateVar.set(template, 'balance', oldBalance + calcBalance);
            else {
                TemplateVar.set(template, 'balance', newBalance);
                Meteor.clearInterval(intervalId);
            }
        }, 1);
    },
    /**
    Wrap the balance

    @method (balance)
    */
    'balance': function(){
        return TemplateVar.get('balance');//this.balance + (TemplateVar.get('balance') - this.balance) /1000;
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
