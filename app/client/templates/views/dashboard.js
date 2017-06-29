/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/


Template['views_dashboard'].helpers({
    /**
    Get all current wallets

    @method (wallets)
    */
    'wallets': function(disabled){
        var wallets = Wallets.find({disabled: disabled}, {sort: {creationBlock: 1}}).fetch();

        // sort wallets by balance
        wallets.sort(Helpers.sortByBalance);

        return wallets;
    },
    /**
    Get all current accounts

    @method (accounts)
    */
    'accounts': function(){
        // balance need to be present, to show only full inserted accounts (not ones added by mist.requestAccount)
        var accounts = EthAccounts.find({name: {$exists: true}}, {sort: {name: 1}}).fetch();

        accounts.sort(Helpers.sortByBalance);

        return accounts;
    },
    /** 
    Are there any accounts?

    @method (hasAccounts)
    */
    'hasAccounts' : function() {
        return (EthAccounts.find().count() > 0);
    },
    /** 
    Are there any accounts?

    @method (hasAccounts)
    */
    'hasMinimumBalance' : function() {
        
        var enoughBalance = false;
        _.each(_.pluck(EthAccounts.find({}).fetch(), 'balance'), function(bal){
            if(new BigNumber(bal, '10').gt(10000000000000000)) enoughBalance = true;
        });

        return enoughBalance;
    },
    /**
    Get all transactions

    @method (allTransactions)
    */
    'allTransactions': function(){
        return Transactions.find({}, {sort: {timestamp: -1}}).count();
    },
    /**
    Returns an array of pending confirmations, from all accounts
    
    @method (pendingConfirmations)
    @return {Array}
    */
    'pendingConfirmations': function(){
        return _.pluck(PendingConfirmations.find({operation: {$exists: true}, confirmedOwners: {$ne: []}}).fetch(), '_id');
    }
});


Template['views_dashboard'].events({
    /**
    Request to create an account in mist
    
    @event click .create.account
    */
    'click .create.account': function(e){
        e.preventDefault();

        mist.requestAccount(function(e, accounts) {
            if(!e) {
                if(!_.isArray(accounts)) {
                    accounts = [accounts];
                }
                accounts.forEach(function(account){                
                    account = account.toLowerCase();
                    EthAccounts.upsert({address: account}, {$set: {
                        address: account,
                        new: true
                    }});
                });
            }
        });
    }
});