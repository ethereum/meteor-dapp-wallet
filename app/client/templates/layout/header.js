/**
Template Controllers

@module Templates
*/

/**
The header template

@class [template] layout_header
@constructor
*/

Template['layout_header'].helpers({
    'totalBalance': function(){
        var accounts = EthAccounts.find({}).fetch();
        var wallets = Wallets.find({owners: {$in: _.pluck(accounts, 'address')}}).fetch();

        var balance = _.reduce(_.pluck(_.union(accounts, wallets), 'balance'), function(memo, num){ return memo + Number(num); }, 0);

        // set total balance in Mist menu, of no pending confirmation is Present
        if(typeof mist !== 'undefined' && !PendingConfirmations.findOne({operation: {$exists: true}})) {
            mist.menu.setBadge(EthTools.formatBalance(balance, '0 a','ether') + ' ether');
        }

        return balance;
    }
});