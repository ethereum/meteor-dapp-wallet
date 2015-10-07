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
    /**
    Calculates the total balance of all accounts + wallets.

    @method (totalBalance)
    @return {String}
    */
    'totalBalance': function(){
        var accounts = EthAccounts.find({}).fetch();
        var wallets = Wallets.find({owners: {$in: _.pluck(accounts, 'address')}}).fetch();

        var balance = _.reduce(_.pluck(_.union(accounts, wallets), 'balance'), function(memo, num){ return memo + Number(num); }, 0);

        // set total balance in Mist menu, of no pending confirmation is Present
        if(typeof mist !== 'undefined' && !PendingConfirmations.findOne({operation: {$exists: true}})) {
            mist.menu.setBadge(EthTools.formatBalance(balance, '0.00 a','ether') + ' ETH');
        }

        return balance;
    },
    /**
    Formats the last block number

    @method (formattedBlockNumber)
    @return {String}
    */
    'formattedBlockNumber': function() {
        return numeral(EthBlocks.latest.number).format('0,0');
    },
    /**
    Formats the time since the last block

    @method (timeSinceBlock)
    */
    'timeSinceBlock': function () {
        var timeSince = moment(EthBlocks.latest.timestamp, "X");
        var now = moment();
        var diff = now.diff(timeSince, "seconds");

        if (diff>60) {
            Helpers.rerun["10s"].tick();
            return timeSince.fromNow(true) + " " + TAPi18n.__('wallet.app.texts.timeSinceBlock');
        } else if (diff<2) {
            Helpers.rerun["1s"].tick();
            return ' <span class="blue">' + TAPi18n.__('wallet.app.texts.blockReceived') + '</span>'
        } else {
            Helpers.rerun["1s"].tick();
            return diff + "s " + TAPi18n.__('wallet.app.texts.timeSinceBlock')
        }
    }
});