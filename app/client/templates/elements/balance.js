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
    text: 'ETHER',
    value: 'ether'
},
{
    text: 'FINNEY', //(µΞ)
    value: 'finney'
},
{
    text: 'BTC',
    value: 'btc'
},
{
    text: 'USD',
    value: 'usd'
},
{
    text: 'EUR',
    value: 'eur'
}];


Template['elements_balance'].onCreated(function(){
    this._intervalId = null;
});


Template['elements_balance'].helpers({
    /**
    Gets currently selected unit

    @method (convertedBalance)
    */
    'convertedBalance': function(){
        var balance = TemplateVar.get('balance');

        if(balance){
            return (EthTools.getUnit() === 'btc')
                ? EthTools.formatBalance(TemplateVar.get('balance'), '0,0.00[000000]')
                : EthTools.formatBalance(TemplateVar.get('balance'), '0,0.00');
        }
    },
    /**
    Get the current balance and count it up/down to the new balance.

    @method (getBalance)
    */
    'getBalance': function(){
        var data = this,
            template = Template.instance(),
            newBalance = (_.isFinite(this.balance)) ? this.balance : '0';

        // transform to BigNumber
        newBalance = new BigNumber(newBalance, 10);

        Meteor.clearInterval(template._intervalId);

        template._intervalId = Meteor.setInterval(function(){
            var oldBalance = TemplateVar.get(template, 'balance') || 0,
                calcBalance = newBalance.minus(oldBalance).dividedBy(10).floor();

            if(oldBalance &&
               !oldBalance.equals(newBalance) &&
               (calcBalance.greaterThan(10000000000) || (calcBalance.lessThan(0) && calcBalance.lessThan(-10000000000))))
                TemplateVar.set(template, 'balance', oldBalance.plus(calcBalance));
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
    'selectedUnit': function(returnText){
        var unit = _.find(units, function(unit){
            return unit.value === EthTools.getUnit();
        });

        if(unit)
            return (returnText === true) ? unit.text : unit.value;
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
        EthTools.setUnit(value);
    }
});
