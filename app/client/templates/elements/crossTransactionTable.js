/**
Template Controllers

@module Templates
*/


/**
The transaction row template

@class [template] elements_cross_transactions_table
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

Template['elements_cross_transactions_table'].onCreated(function(){
    this._properties = {
        cursor: {}
    };

    TemplateVar.set('limit', this.data.limit || defaultLimit);
		TemplateVar.set('address', this.data.address || '');
});

Template['elements_cross_transactions_table'].helpers({
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
            selector = {from: TemplateVar.get('address').toLowerCase()};

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
                if(pattern.test(EthTools.formatBalance(item.value, '0,0.00[000000] unit')))
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

Template['elements_cross_transactions_table'].events({

    'click .crosschain-list': function (e) {

        var id = e.target.id;
        console.log('id: ', id);

        // console.log('crosschainList: ');


        var sendTransaction = function () {
          console.log('transaction');
        };

        EthElements.Modal.question({
            template: 'views_modals_sendTransactionInfo',
            data: {
                from: '0x71bc7e3d4c6ea831f2f07934022edbaa8cdcccaa',
                to: '0x71bc7e3d4c6ea831f2f07934022edbaa8cdcccaa',
                amount: 1000,
                gasPrice: 10000,
                estimatedGas: 10000000,
                estimatedGasPlusAddition: 100000
            },
            ok: sendTransaction,
            cancel: true
        },{
            class: 'send-transaction-info'
        });
    },

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


