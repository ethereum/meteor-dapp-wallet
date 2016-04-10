/**
Template Controllers

@module Templates
*/


/**
The event info template

@class [template] views_modals_eventsInfo
@constructor
*/



Template['views_modals_eventInfo'].helpers({
    /**
    Returns the current event

    @method (event)
    @return {Object} the current event
    */
    'event': function() {
        return Events.findOne(this._id);
    },
    /**
    Calculates the confirmations of this tx

    @method (confirmations)
    @return {Number} the number of confirmations
    */
    'confirmations': function(){
        return (EthBlocks.latest && this.blockNumber)
            ? EthBlocks.latest.number + 1 - this.blockNumber : 0;
    },
    /**
    Event return values

    @method (returnValues)
    */
    'returnValues': function() {
        if(this.args) {
            var returnValues = [];
            _.each(this.args, function(value, key){

                // if bignumber
                if((_.isObject(value) || value instanceof BigNumber) && value.toFormat)
                    value = value.toFormat(0);

                returnValues.push({
                    name: key,
                    value: value
                });
            });
            return returnValues;
        } else {
            return [];
        }
    }
});

