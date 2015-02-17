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
        var accounts = _.pluck(Accounts.find({}).fetch(), 'balance');

        accounts = _.reduce(accounts, function(memo, num){ return memo + Number(num); }, 0);

        // update also the meta tag balance
        $('meta[name="ethereum-dapp-info"]').prop('content', numeral(EthTools.fromWei(accounts, LocalStore.get('etherUnit'))).format('0,0.00') + ' '+ LocalStore.get('etherUnit'));

        return accounts;
    }
});