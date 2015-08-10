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
        var accounts = _.pluck(_.union(EthAccounts.find({}).fetch(), Wallets.find({}).fetch()), 'balance');

        accounts = _.reduce(accounts, function(memo, num){ return memo + Number(num); }, 0);

        // set total balance in Mist menu, of no pending confirmation is Present
        if(typeof mist !== 'undefined' && !PendingConfirmations.findOne({operation: {$exists: true}})) {
            mist.menu.setBadge(EthTools.formatBalance(accounts, '0 a unit'));
        }

        return accounts;
    }
});