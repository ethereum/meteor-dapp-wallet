// ADD MIST MENU
updateMistMenu = function(){
    var accounts = _.union(Wallets.find({}, {sort: {name: 1}}).fetch(), EthAccounts.find({}, {sort: {name: 1}}).fetch()),
        balance = 0;

    Meteor.setTimeout(function(){
        var routeName = FlowRouter.current().route.name;

        // add/update mist menu
        if(typeof mist !== 'undefined') {
            mist.menu.clear();
            mist.menu.add('wallets',{
                position: 1,
                name: TAPi18n.__('wallet.app.buttons.wallet'),
                selected: routeName === 'dashboard'
            }, function(){
                FlowRouter.go('/');
            });
            mist.menu.add('send',{
                position: 2,
                name: TAPi18n.__('wallet.app.buttons.send'),
                selected: routeName === 'send' || routeName === 'sendTo'
            }, function(){
                FlowRouter.go('/send');
            });

            _.each(accounts, function(account, index){
                mist.menu.add(account._id,{
                    position: 2 + index,
                    name: account.name,
                    badge: EthTools.formatBalance(account.balance, "0 a", 'ether')+ ' ETH',
                    selected: (location.pathname === '/account/'+ account.address)
                }, function(){
                    FlowRouter.go('/account/'+ account.address);
                });
            });

            // set total balance in header.js
        }
    }, 10);
};

Tracker.autorun(function(){
    var pendingConfirmation = PendingConfirmations.findOne({operation: {$exists: true}});

    if(typeof mist !== 'undefined' && pendingConfirmation) {
        mist.menu.setBadge(TAPi18n.__('wallet.app.texts.pendingConfirmationsBadge'));
    }

});


Meteor.startup(function() {

    // make reactive
    Tracker.autorun(updateMistMenu);

});