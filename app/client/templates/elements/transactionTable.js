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
var blocksForConfirmation = 120;

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 20;

Template['elements_transactions_table'].onCreated(function(){
    this._properties = {
        cursor: {}
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
            items = [],
            searchQuery = TemplateVar.get('search'),
            limit = TemplateVar.get('limit'),
            selector = this.transactionIds ? {_id: {$in: this.transactionIds}} : {};

        // if search
        if(searchQuery) {
            var pattern = new RegExp('^.*'+ searchQuery.replace(/ +/g,'.*') +'.*$','i');
            template._properties.cursor = Transactions.find(selector, {sort: {timestamp: -1, blockNumber: -1}});
            items = template._properties.cursor.fetch();
            items = _.filter(items, function(item){
                // search from address
                if(pattern.test(item.from))
                    return item;

                // search to address
                if(pattern.test(item.to))
                    return item;

                // search value
                if(pattern.test(Helpers.formatBalance(item.value, '0,0.00[000000]')))
                    return item;

                // search date
                if(pattern.test(moment.unix(item.timestamp).format('LLLL')))
                    return item;

                return false;
            });
            items = items.slice(0, defaultLimit * 4);
            return items;

        } else {
            template._properties.cursor = Transactions.find(selector, {sort: {timestamp: -1, blockNumber: -1}, limit: limit});
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
        return (!TemplateVar.get('search') && template._properties.cursor.count() > TemplateVar.get('limit'));
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
    Checks if, from the perspective of the selected account
    the transaction was incoming or outgoing.

    @method (incomingTx)
    @param {String} account     The _id of the current account
    */
    'incomingTx': function(account){
        return ((account && this.from !== Accounts.findOne(account).address) ||
                (!account && Accounts.findOne({$or: [{address: this.from, address: this.to}]})));
    },
    /**
    Returns the correct text for this transaction

    @method (transactionType)
    @return {String}
    */
    'transactionType': function(){
        var to = Accounts.findOne({address: this.to}),
            from = Accounts.findOne({address: this.from});

        if(to && from)
            return TAPi18n.__('wallet.transactions.types.betweenWallets');
        else if(to)
            return TAPi18n.__('wallet.transactions.types.received');
        else if(from)
            return TAPi18n.__('wallet.transactions.types.sent');
    },
    /**
    Returns the from now time, if less than 23 hours

    @method (fromNowTime)
    @return {String}
    */
    'fromNowTime': function(){
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
        if(!this.blockNumber)
            return {
                confirmations: 0,
                percent: 0
            };

        var currentBlockNumber = Blockchain.findOne().blockNumber,
            confirmations = currentBlockNumber - this.blockNumber + 1;
        return (this.blockNumber > currentBlockNumber - blocksForConfirmation && (currentBlockNumber - blocksForConfirmation) > 0)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation-1)) * 100
            }
            : false;
    }
});


/**
The transaction row template

@class [template] elements_transactions_row_tofrom
@constructor
*/


Template['elements_transactions_row_tofrom'].helpers({
    /**
    Get the account and return the account or address of "from" or "to" property

    @method (getAccount)
    */
    'getAccount': function(){
        return Accounts.findOne({address: this.address}) || {address: this.address};
    }
});

