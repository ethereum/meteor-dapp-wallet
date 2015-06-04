/**
Template Controllers

@module Templates
*/

/**
The add user template

@class [template] views_send
@constructor
*/

/**
The query and sort option for all account queries

Set in the created callback.

@property accountQuery
*/
var accountQuery;

/**
The query and sort option for all account queries

Set in the created callback.

@property accountSort
*/
var accountSort;

/**
The the factor by which the gas price should be changeable.

@property toPowerFactor
*/
var toPowerFactor = 1.1

/**
The estimated gas

@property estimatedGas
*/
var estimatedGas = 23000;
if(Accounts.findOne({type: 'account'}))
    web3.eth.estimateGas({from: Accounts.findOne({type: 'account'}).address, to: Accounts.findOne({type: 'account'}).address, value: 1}, function(e, res){
        if(!e && res)
            estimatedGas = res;
    });

/**
Calculates the gas price.

@method calculateGasPrice
@return {Number}
*/
var calculateGasPrice = function(fee, ether){
    var suggestedGasPrice = web3.fromWei(new BigNumber(LastBlock.findOne('latest').gasPrice, 10), ether || LocalStore.get('etherUnit'));
    return suggestedGasPrice.times(estimatedGas).times(new BigNumber(toPowerFactor).toPower(fee));
}

// Set basic variables
Template['views_send'].onCreated(function(){
    var template = this;

    // set account queries
    accountQuery = {$or: [{owners: {$in: _.pluck(Accounts.find({type: 'account'}).fetch(), 'address')}}, {type: 'account'}]};
    accountSort = {sort: {type: -1, balance: -1}};

    // set the default fee
    TemplateVar.set('feeMultiplicator', 0);
    TemplateVar.set('amount', 0);

    // change the amount when the currency unit is changed
    this.autorun(function(c){
        var unit = LocalStore.get('etherUnit');

        if(!c.firstRun) {
            TemplateVar.set('amount', web3.toWei(template.find('input[name="amount"]').value.replace(',','.'), unit));
        }
    });
});

Template['views_send'].onRendered(function(){
    // focus address input field
    if(!this.data || !this.data.address)
        this.$('input[name="to"]').focus();
    else {
        this.find('input[name="to"]').value = this.data.address;
        this.$('input[name="to"]').trigger('change');
    }
});


Template['views_send'].helpers({
    /**
    Get all current accounts

    @method (fromAccounts)
    */
    'fromAccounts': function(){
        return Accounts.find(accountQuery, accountSort);
    },
    /**
    Get the current unit.

    @method unit
    */
    'unit': function(){
        return LocalStore.get('etherUnit');
    },
    /**
    Return the to address

    @method (toAddress)
    */
    'toAddress': function(){
        return TemplateVar.get('toAddress');
    },
    /**
    Return the currently selected fee multicalculator value

    @method (feeMultiplicator)
    */
    'feeMultiplicator': function(){
        return TemplateVar.get('feeMultiplicator');
    },
    /**
    Return the currently selected fee value calculate with gas price

    @method (fee)
    */
    'fee': function(){
        if(_.isFinite(TemplateVar.get('feeMultiplicator')))
            return numeral(calculateGasPrice(TemplateVar.get('feeMultiplicator')).toString(10)).format('0,0.[000000000000]');
    },
    /**
    Return the current sepecified amount (finney)

    @method (amount)
    */
    'amount': function(){
        var amount = web3.fromWei(TemplateVar.get('amount'), LocalStore.get('etherUnit'));
        return (_.isFinite(amount))
            ? numeral(amount).format('0,0.[000000]') + ' '+ LocalStore.get('etherUnit')
            : 0 + ' '+ LocalStore.get('etherUnit');
    },
    /**
    Return the currently selected fee + amount

    @method (total)
    */
    'total': function(ether){
        var amount = web3.fromWei(new BigNumber(TemplateVar.get('amount') || 0, 10), ether || LocalStore.get('etherUnit'));
        if(_.isFinite(TemplateVar.get('feeMultiplicator')))
            return numeral(calculateGasPrice(TemplateVar.get('feeMultiplicator'), ether || LocalStore.get('etherUnit')).plus(amount).toString(10)).format('0,0.[00000000]');
    },
    /**
    Returns the right time text for the "sendText".

    @method (timeText)
    */
    'timeText': function(){
        return TAPi18n.__('wallet.send.texts.timeTexts.'+ ((Number(TemplateVar.get('feeMultiplicator')) + 5) / 2).toFixed(0));
    }
});


Template['views_send'].events({
    /**
    Set the "to" address while typing
    
    @event keyup input[name="to"]
    */
    'keyup input[name="to"]': function(e){
        TemplateVar.set('toAddress', e.currentTarget.value);
    },
    /**
    Set the amount while typing
    
    @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
    */
    'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(e){
        TemplateVar.set('amount', web3.toWei(e.currentTarget.value.replace(',','.'), LocalStore.get('etherUnit')));
    },
    /**
    Change the selected fee
    
    @event change input[name="fee"], input input[name="fee"]
    */
    'change input[name="fee"], input input[name="fee"]': function(e){
        TemplateVar.set('feeMultiplicator', Number(e.currentTarget.value));
    },
    /**
    Submit the form and send the transaction!
    
    @event submit form
    */
    'submit form': function(e, template){
        var amount = TemplateVar.get('amount'),
            to = template.find('input[name="to"]').value,
            gasPrice = new BigNumber(LastBlock.findOne('latest').gasPrice, 10).times(new BigNumber(toPowerFactor).toPower(TemplateVar.get('feeMultiplicator'))).toFixed(0),
            selectedAccount = Accounts.findOne({address: template.find('select[name="select-accounts"]').value});

        if(selectedAccount) {

            if(selectedAccount.balance === '0')
                return GlobalNotification.warning({
                    content: 'i18n:wallet.accounts.error.emptyWallet',
                    duration: 2
                });

            if(!web3.isAddress(to))
                return GlobalNotification.warning({
                    content: 'i18n:wallet.accounts.error.noReceiver',
                    duration: 2
                });
            else
                to = '0x'+ to.replace('0x','');

            if(!amount)
                return GlobalNotification.warning({
                    content: 'i18n:wallet.accounts.error.noAmount',
                    duration: 2
                });
            
            // simple transaction
            if(selectedAccount.type === 'account') {

                web3.eth.sendTransaction({
                    from: selectedAccount.address,
                    to: to,
                    value: amount,
                    gasPrice: gasPrice,
                    gas: estimatedGas + 100 // add 100 to be safe
                }, function(error, txHash){
                    console.log(error, txHash);
                    if(!error) {
                        console.log('SEND simple');


                        txId = Helpers.makeId('tx', txHash);


                        Transactions.insert({
                            _id: txId,
                            value: amount,
                            from: selectedAccount.address,
                            to: to,
                            timestamp: moment().unix(),
                            transactionHash: txHash,
                            // blockNumber: null,
                            // blockHash: null,
                            // transactionIndex: null,
                            // logIndex: null
                        });

                        Router.go('/');
                    } else {
                        GlobalNotification.error({
                            content: error.message,
                            duration: 8
                        });
                    }
                });

            } else if(selectedAccount.type === 'wallet') {

                contracts[selectedAccount._id].execute.sendTransaction(to, amount, '', {
                    from: selectedAccount.owners[0],
                    gasPrice: gasPrice,
                    gas: 1204633 + 500000 // add 100 to be safe
                }, function(error, txHash){
                    console.log(error, txHash);
                    if(!error) {
                        console.log('SEND from contract', amount);

                        // txId = Helpers.makeId('tx', txHash);

                        // // TODO: remove after we have pending logs?
                        // Transactions.insert({
                        //     _id: txId,
                        //     value: amount,
                        //     from: selectedAccount.address,
                        //     to: to,
                        //     timestamp: moment().unix(),
                        //     transactionHash: txHash,
                        //     // blockNumber: null,
                        //     // blockHash: null,
                        //     // transactionIndex: null,
                        //     // logIndex: null
                        // });

                        Router.go('/');

                    } else {
                        GlobalNotification.error({
                            content: error.message,
                            duration: 8
                        });
                    }
                });
            }
        }
    }
});