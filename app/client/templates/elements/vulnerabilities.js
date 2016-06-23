/**
Template Controllers

@module Templates
*/


Template['elements_vulnerabilities_txorigin'].helpers({
    /**
    Upgrade parameters for the wallet

    @method (customContract)
    */
    'upgradeParams': function(){
        var params = 'name='+this.name;
        if (this.dailyLimit) params += '&dailyLimit='+this.dailyLimit;
        if (this.requiredSignatures) params += '&requiredSignatures='+this.requiredSignatures;
        if (this.owners) {
            params += '&ownersNum='+this.owners.length;
            params += '&owners='+ this.owners.join('_');
        } 

        return params;
    }
});