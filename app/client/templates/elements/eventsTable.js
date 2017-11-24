/**
Template Controllers

@module Templates
*/


/**
The transaction row template

@class [template] elements_event_table
@constructor
*/

/**
Block required until a transaction is confirmed.

@property blocksForConfirmation
@type Number
*/
var blocksForConfirmation = ethereumConfig.requiredConfirmations;

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 10;

Template['elements_event_table'].onCreated(function(){
    this._properties = {
        cursor: {}
    };

    TemplateVar.set('limit', this.data.limit || defaultLimit);
});

Template['elements_event_table'].helpers({
    /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
    'items': function(){

        var template = Template.instance(),
            items = [],
            ids = this.ids || [],
            searchQuery = TemplateVar.get('search'),
            limit = TemplateVar.get('limit'),
            collection = Events,
            selector = {_id: {$in: ids.slice(Number((limit+50)*-1))}}; 
            // slice(limit) prevents loading too many objects at once and slowing the machine
        
        // if search
        if(searchQuery) {
            var pattern = new RegExp('^.*'+ searchQuery.replace(/ +/g,'.*') +'.*$','i');
            template._properties.cursor = collection.find(selector, {sort: {timestamp: -1, blockNumber: -1}});
            items = template._properties.cursor.fetch();
            items = _.filter(items, function(item){
                // search from address
                if(pattern.test(item.event))
                    return item;


                // search to address
                if(pattern.test(item.address))
                    return item;

                // search to return values
                if(_.find(item.args, function(value, name){ return pattern.test(value) || pattern.test(name); }))
                    return item;

                return false;
            });
            items = items.slice(0, defaultLimit * 4);
            return items;

        } else {
            template._properties.cursor = collection.find(selector, {sort: {timestamp: -1, blockNumber: -1}, limit: limit});
            return template._properties.cursor.fetch();
        }
    },
    /**
    Check if there are more transactions to load. When searching don't show the show more button.

    @method (hasMore)
    @return {Boolean}
    */
    'hasMore': function(){
        var template = Template.instance();

        template._properties.cursor.limit = null;
        return (!TemplateVar.get('search') && template._properties.cursor.count() >= TemplateVar.get('limit'));
    }
});

Template['elements_event_table'].events({
    'click button.show-more': function(e, template){
        var limit = TemplateVar.get('limit');
        TemplateVar.set('limit', limit + (template.data.limit || defaultLimit));
    },
    'keyup input.filter-transactions': _.debounce(function(e, template){
        if(e.keyCode === 27)
            e.currentTarget.value = '';

        TemplateVar.set(template, 'search', e.currentTarget.value);
    }, 200)
});




/**
The events row template

@class [template] elements_events_row
@constructor
*/

Template['elements_events_row'].helpers({
    /**
    Returns the from now time, if less than 23 hours

    @method (fromNowTime)
    @return {String}
    */
    'fromNowTime': function(){
        Helpers.rerun['10s'].tick();

        var diff = moment().diff(moment.unix(this.timestamp), 'hours');
        return (diff < 23) ? ' '+ moment.unix(this.timestamp).fromNow() : '';
    },
    /**
    Returns the confirmations

    @method (totalConfirmations)
    */
    'totalConfirmations': blocksForConfirmation,
    /**
    Checks whether the transaction is confirmed ot not.

    @method (unConfirmed)
    */
    'unConfirmed': function() {
        if(!this.blockNumber || !EthBlocks.latest.number)
            return {
                confirmations: 0,
                percent: 0
            };

        var currentBlockNumber = EthBlocks.latest.number + 1,
            confirmations = currentBlockNumber - this.blockNumber;
        return (blocksForConfirmation >= confirmations && confirmations >= 0)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation)) * 100
            }
            : false;
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


Template['elements_events_row'].events({
    /**
    Open transaction details on click of the <tr>

    @event click tr
    */
    'click tr:not(.pending)': function(e) {
        var $element = $(e.target);
        if(!$element.is('button') && !$element.is('a')) {
            EthElements.Modal.show({
                template: 'views_modals_eventInfo',
                data: {
                    _id: this._id
                }
            },{
                class: 'transaction-info'
            });
        }
    }
});

