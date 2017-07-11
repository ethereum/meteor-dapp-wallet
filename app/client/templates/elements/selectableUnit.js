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
},
{
    text: 'GBP',
    value: 'gbp'
},
{
    text: 'BRL',
    value: 'brl'
}];


// Aprils fool
if (moment().format('MM-DD')=='04-01') {
    selectableUnits.push({ text: 'SZABO', value: 'szabo'},
        { text: 'SHANNON', value: 'shannon'},
        { text: 'LOVELACE', value: 'lovelace'},
        { text: 'BABBAGE', value: 'babbage'},
        { text: 'WEI', value: 'wei'},
        { text: 'NOETHER', value: 'noether'})

// Claude's Birthday
} else if (moment().format('MM-DD')=='04-30') {
    selectableUnits.push({ text: 'SHANNON', value: 'shannon'})
// Ada's Birthday
} else if (moment().format('MM-DD')=='12-10') {
    selectableUnits.push({ text: 'LOVELACE', value: 'lovelace'})
// Charles's Birthday
} else if (moment().format('MM-DD')=='12-26') {
    selectableUnits.push({ text: 'BABBAGE', value: 'babbage'})
}


Template['elements_selectableUnit'].helpers({
    /**
    Gets currently selected unit

    @method (selectedUnit)
    */
    'selectedUnit': function(){
        var unit = _.find(selectableUnits, function(unit){
            return unit.value === EthTools.getUnit();
        });

        if(unit)
            return unit.value;
    },
    /**
    Return the selectable units

    @method (selectedUnit)
    */
    'units': function(){
        return selectableUnits;
    },
    /**
    Can select units

    @method (selectedUnit)
    */
    'selectable': function(){
        return Session.get('network') == 'main';
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
