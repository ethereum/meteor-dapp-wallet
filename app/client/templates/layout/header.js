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
        var accounts = _.pluck(Accounts.find({disabled: {$exists: false}}).fetch(), 'balance');

        accounts = _.reduce(accounts, function(memo, num){ return memo + Number(num); }, 0);

        // set total balance in Mist menu
        if(typeof mist !== 'undefined') {
            mist.menu.setBadge(Helpers.formatBalance(accounts, '0 a'));
        }

        return accounts;
    }
});