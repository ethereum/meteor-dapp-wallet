/**
Template Controllers

@module Templates
*/

/**
The balance template

@class [template] elements_balance
@constructor
*/

/**
The available units

@property units
*/
var units = [{
    text: 'finney', //(µΞ)
    value: 'finney'
},{
    text: 'ether',
    value: 'ether'
}];


Template['elements_balance'].created = function(){
    this._intervalId = null;
};


Template['elements_balance'].helpers({
    /**
    Gets currently selected unit

    @method (convertedBalance)
    */
    'convertedBalance': function(){
        return EthTools.fromWei(TemplateVar.get('balance'), LocalStore.get('etherUnit'));
    },
    /**
    Get the current balance and count it up/down to the new balance.

    @method (getBalance)
    */
    'getBalance': function(){
        var data = this,
            template = Template.instance(),
            newBalance = (_.isFinite(this.balance)) ? Number(this.balance) : 0;

        Meteor.clearInterval(template._intervalId);

        template._intervalId = Meteor.setInterval(function(){
            var oldBalance = TemplateVar.get(template, 'balance'),
                calcBalance = Math.floor((newBalance - oldBalance) / 10);

            if(oldBalance &&
               oldBalance !== newBalance &&
               (calcBalance > 10000000000 || (calcBalance < 0 && calcBalance < -10000000000)))
                TemplateVar.set(template, 'balance', oldBalance + calcBalance);
            else {
                TemplateVar.set(template, 'balance', newBalance);
                Meteor.clearInterval(template._intervalId);
            }
        }, 1);
    },
    /**
    Gets currently selected unit

    @method (selectedUnit)
    */
    'selectedUnit': function(){
        var unit = _.find(units, function(unit){
            return unit.value === LocalStore.get('etherUnit');
        });

        if(unit)
            return unit.text;
    },
    /**
    Return the selectable units

    @method (selectedUnit)
    */
    'units': function(){
        return units;
    }
});

Template['elements_balance'].events({
    /**
    Select the current section, based on the radio inputs value.

    @event change .inline-form
    */
    'change .inline-form': function(e, template, value){
        LocalStore.set('etherUnit', value);
    }
});
