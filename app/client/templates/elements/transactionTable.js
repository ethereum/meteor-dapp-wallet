/**
Template Controllers

@module Templates
*/


/**
The transaction row template

@class [template] elements_transactions_table
@constructor
*/

/**
Block required until a transaction is confirmed.

@property blocksForConfirmation
@type Number
*/
var blocksForConfirmation = 12;

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 20;

Template['elements_transactions_table'].onCreated(function(){
    this._properties = {
        origSelector: this.data.items.matcher._selector
    };

    TemplateVar.set('limit', this.data.limit || defaultLimit);
});

Template['elements_transactions_table'].helpers({
    /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
    'items': function(){
        var template = Template.instance(),
            searchQuery = TemplateVar.get('search'),
            items = this.items;

        // if search
        if(searchQuery) {
            var pattern = new RegExp('^.*'+ searchQuery.replace(/ +/g,'.*') +'.*$','i');
            items = this.items.collection.find({$and: [template._properties.origSelector, {$or: [{dateString: {$regex: pattern }}, {value: {$regex: pattern }}, {from: {$regex: pattern }}]}]}, {sort: {timestamp: -1}});
        } else
            items = this.items.collection.find(template._properties.origSelector, {sort: {timestamp: -1}});

        // set limit
        items.limit = TemplateVar.get('limit');

        // TODO, doesn't recount
        console.log(items.count());

        return items.fetch(); // need fetch or throws an error
    },
    /**
    Check if there are more transactions to load

    @method (hasMore)
    @return {Boolean}
    */
    'hasMore': function(){
        // make reactive to the search as well
        TemplateVar.get('search');

        this.items.limit = null;
        return (this.items.count() > TemplateVar.get('limit'));
    }
});

Template['elements_transactions_table'].events({
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
The transaction row template

@class [template] elements_transactions_row
@constructor
*/


Template['elements_transactions_row'].helpers({
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
        var currentBlockNumber = Blockchain.findOne().blockNumber,
            confirmations = currentBlockNumber - this.blockNumber;
        return (this.blockNumber > currentBlockNumber - blocksForConfirmation)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation-1)) * 100
            }
            : false;
    },
    /**
    Gets the transactions account

    @method (account)
    */
    'account': function() {
        return Accounts.findOne(this.account);
    }
});