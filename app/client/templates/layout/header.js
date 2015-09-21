/**
Template Controllers

@module Templates
*/

/**
The header template

@class [template] layout_header
@constructor
*/

Template['layout_header'].onCreated(function(){
    var template = this;

    // Stop app operation, when the node is syncing
    web3.eth.isSyncing(function(error, syncing) {
        if(!error) {

            if(syncing === true) {
                console.log('Node started syncing, stopping app operation');
                web3.reset(true);

            
            } else if(_.isObject(syncing)) {
                
                syncing.progress = Math.floor(((syncing.currentBlock - syncing.startingBlock) / (syncing.highestBlock - syncing.startingBlock)) * 100);
                syncing.blockDiff = numeral(syncing.highestBlock - syncing.currentBlock).format('0,0');

                TemplateVar.set(template, 'syncing', syncing);
                
            } else {
                console.log('Restart app operation again');

                TemplateVar.set(template, 'syncing', false);

                // re-gain app operation
                connectToNode();
            }
        }
    });
});


Template['layout_header'].helpers({
    'totalBalance': function(){
        var accounts = EthAccounts.find({}).fetch();
        var wallets = Wallets.find({owners: {$in: _.pluck(accounts, 'address')}}).fetch();

        var balance = _.reduce(_.pluck(_.union(accounts, wallets), 'balance'), function(memo, num){ return memo + Number(num); }, 0);

        // set total balance in Mist menu, of no pending confirmation is Present
        if(typeof mist !== 'undefined' && !PendingConfirmations.findOne({operation: {$exists: true}})) {
            mist.menu.setBadge(EthTools.formatBalance(balance, '0.00 a','ether') + ' ether');
        }

        return balance;
    }, 
    'timeSinceBlock': function () {
        var timeSince = moment(EthBlocks.latest.timestamp, "X");
        var now = moment();

        Helpers.rerun["1s"].tick();
        
        return now.diff(timeSince, "seconds");
    }
});