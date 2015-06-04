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
var blocksForConfirmation = ethereumConfig.requiredConfirmations;

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 10;

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
            collection = window[this.collection] || Transactions,
            selector = this.transactionIds ? {_id: {$in: this.transactionIds}} : {};

        // check if it has operation
        if(this.collection === 'PendingConfirmations') {
            selector.operation = {$exists: true};
            selector.confirmedOwners = {$ne: []};
        }

        // if search
        if(searchQuery) {
            var pattern = new RegExp('^.*'+ searchQuery.replace(/ +/g,'.*') +'.*$','i');
            template._properties.cursor = collection.find(selector, {sort: {timestamp: -1, blockNumber: -1}});
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
            from = Accounts.findOne({address: this.from}),
            initiator = Accounts.findOne({address: this.initiator});

        if(from)
            from = '<a href="/account/'+ from.address +'">'+ from.name +'</a>';
        initiator = (initiator)
            ? '<a href="/account/'+ initiator.address +'">'+ initiator.name +'</a>'
            : this.initiator;

        if(this.type === 'pendingConfirmation')
            return new Spacebars.SafeString(TAPi18n.__('wallet.transactions.types.pendingConfirmations', {initiator: initiator, from: from}));
        else if(to && from)
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
        if(!this.blockNumber)
            return {
                confirmations: 0,
                percent: 0
            };

        var currentBlockNumber = LastBlock.findOne('latest').blockNumber,
            confirmations = currentBlockNumber - (this.blockNumber - 1);
        return (blocksForConfirmation >= confirmations && confirmations >= 0)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation)) * 100
            }
            : false;
    },
    /**
    Return the number of owner confirmations

    @method (ownerConfirmationCount)
    */
    'ownerConfirmationCount': function(){
        var account = Accounts.findOne({address: this.from});

        if(account && this.confirmedOwners)
            return this.confirmedOwners.length +'/'+ account.requiredSignatures;
    },
    /**
    Get the owners of the current pending transactions wallet.

    @method (owners)
    */
    'owners': function(){
        var account = Accounts.findOne({address: this.from});
        return (account) ? account.owners : [];
    },
    /**
    Check if the current owner is confirmed

    @method (ownerIsConfirmed)
    */
    'ownerIsConfirmed': function(){
        var owner = String(this);
        return (_.contains(Template.parentData(1).confirmedOwners, owner));
    },
    /**
    Check if the current owner has already approved the transaction

    @method (approved)
    */
    'approved': function(){
        if(!this.confirmedOwners)
            return;

        return Accounts.findOne({address: {$in: this.confirmedOwners}});
    }
});


Template['elements_transactions_row'].events({
    /**
    Reject or Approve a pending transactions

    @event click click button.approve, click button.reject
    */
    'click button.approve, click button.reject': function(e){
        var account = Accounts.findOne({address: this.from});
        if(account && !$(e.currentTarget).hasClass('selected')) {
            var owner = account.owners[0];

            var type = ($(e.currentTarget).hasClass('approve'))
                ? 'confirm'
                : 'revoke';


            contracts[account._id][type].sendTransaction(this.operation, {from: owner, gas: 1204633 + 900000}, function(e, hash){
                if(!e) {
                    console.log(type, hash);
                    
                    PendingConfirmations.update(this._id, {$set: {
                        sending: owner
                    }});
                }
            });
        }
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

