/**
Template Controllers

@module Templates
*/


Template['elements_vulnerabilities_txorigin'].helpers({
    /**
    Upgrade parameters for the wallet

    @method (upgradeParams)
    */
    'upgradeParams': function(){
        var params = 'name='+ account.name;
        if (account.dailyLimit) params += '&dailyLimit='+ account.dailyLimit;
        if (account.requiredSignatures) params += '&requiredSignatures='+ account.requiredSignatures;
        if (account.owners) {
            params += '&ownersNum='+ account.owners.length;
            params += '&owners='+ account.owners.join('_');
        } 

        return params;
    },
    /**
    Return the wallet address if its an account

    @method (walletAddress)
    */
    'walletAddress': function(){
        var account = this;
        // if account, get the first vulnerable wallet for that account
        var wallets = _.map(Wallets.find({vulnerabilities: {$exists: true}}).fetch(), function(wal){
            return (!!_.find(wal.vulnerabilities || [], function(vul){
                return vul;
            }))
                ? wal : false;
        });
        var wallet = _.find(wallets, function(wal){
            return _.contains(wal.owners, account.address);
        });

        return (!wallet)
            ? wallet.address
            : '';
    }
});