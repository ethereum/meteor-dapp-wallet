Meteor.startup(function() {

    // ADD MIST MENU
    Tracker.autorun(function(){
        var accounts = Accounts.find({}, {sort: {type: 1, balance: -1, name: 1}}).fetch(),
            balance = 0;

        // add/update mist menu
        if(typeof mist !== 'undefined') {
            mist.menu.clear();
            mist.menu.add('wallets',{
                position: 1,
                name: TAPi18n.__('wallet.app.buttons.wallet'),
                // selected: 
            }, function(){
                Router.go('/');
            });
            mist.menu.add('send',{
                position: 2,
                name: TAPi18n.__('wallet.app.buttons.send')
            }, function(){
                Router.go('/send');
            });


            _.each(accounts, function(account, index){
                mist.menu.add(account._id,{
                    position: 2 + index,
                    name: account.name,
                    badge: Helpers.formatBalance(account.balance, "0 a")
                }, function(){
                    Router.go('/account/'+ account.address);
                });
            });

            // set total balance
            mist.menu.setBadge(Helpers.formatBalance(_.reduce(_.pluck(accounts, 'balance'), function(memo, num){ return memo + Number(num); }, 0), '0 a'));

        }



    });

});