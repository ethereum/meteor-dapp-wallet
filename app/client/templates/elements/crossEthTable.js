Template['elements_account_table'].onCreated(function () {
    let template = this;
    // console.log('addressList: ', this.data);

    mist.ETH2WETH().getMultiBalances(this.data.addressList, (err, result) => {
        // console.log('getMultiBalances', result);
        TemplateVar.set(template,'ethAccounts',result);
    });

    const self = this;
    InterID = Meteor.setInterval(function(){
        mist.ETH2WETH().getMultiBalances(self.data.addressList, (err, result) => {
            TemplateVar.set(template,'ethAccounts',result);
        });

    }, 10000);


});

Template['elements_account_table'].onDestroyed(function () {
    Meteor.clearInterval(InterID);
});

Template['elements_account_table'].helpers({

    /**
     Get all transactions
     @method (allTransactions)
     */
    'ethAccounts': function(){

        //eth account list
        const ethAccounts = TemplateVar.get('ethAccounts');

        let result = [];
        if (ethAccounts) {

            _.each(ethAccounts, function (value, index) {
                const balance =  web3.fromWei(value, 'ether');
                const name = index.slice(2, 6) + index.slice(38);
                result.push({name: name, address: index, balance: balance})
            });
        }

        // console.log('ethList: ', result);

        return result;
    },
});
