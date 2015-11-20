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

@property selectableUnits
*/
selectableUnits = [{
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


Template['elements_selectableUnit'].helpers({
    /**
    Gets currently selected unit

    @method (selectedUnit)
    */
    'selectedUnit': function(returnText){
        var unit = _.find(selectableUnits, function(unit){
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
        return selectableUnits;
    }
});

Template['elements_selectableUnit'].events({
    /**
    Select the current section, based on the radio inputs value.

    @event change .inline-form
    */
    'change .inline-form': function(e, template, value){
        EthTools.setUnit(value);
    }
});
