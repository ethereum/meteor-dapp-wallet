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
Calculates the gas price.

@method calculateGasPrice
@return {Number}
*/
var calculateGasPrice = function(fee, ether){
    var suggestedGasPrice = web3.fromWei(web3.eth.gasPrice, ether || LocalStore.get('etherUnit'));
    return suggestedGasPrice.times(10000).times(new BigNumber(2).toPower(fee));
}


Template['views_send'].onCreated(function(){
    // set the default fee
    TemplateVar.set('selectedFeeMultiplicator', 0);

    TemplateVar.set('amount', 0);

    if(account = Accounts.findOne({},{sort: {type: 1}}))
        TemplateVar.set('fromAddress', account.address);
});

Template['views_send'].onRendered(function(){
    this.$('input[name="to"]').focus();
});


Template['views_send'].helpers({
    /**
    Get all current accounts

    @method (accounts)
    */
    'accounts': function(){
        return Accounts.find({}, {sort: {type: -1}});
    },
    /**
    Get the current unit.

    @method unit
    */
    'unit': function(){
        return LocalStore.get('etherUnit');
    },
    /**
    Return the from address

    @method (fromAddress)
    */
    'fromAddress': function(){
        return TemplateVar.get('fromAddress');
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
        return TemplateVar.get('selectedFeeMultiplicator');
    },
    /**
    Return the currently selected fee value calculate with gas price

    @method (fee)
    */
    'fee': function(){
        if(_.isFinite(TemplateVar.get('selectedFeeMultiplicator')))
            return numeral(calculateGasPrice(TemplateVar.get('selectedFeeMultiplicator')).toString(10)).format('0,0.[000000000000]');
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
        if(_.isFinite(TemplateVar.get('selectedFeeMultiplicator')))
            return numeral(calculateGasPrice(TemplateVar.get('selectedFeeMultiplicator'), ether || LocalStore.get('etherUnit')).plus(amount).toString(10)).format('0,0.[000000000000]');
    },
    /**
    Returns the right time text for the "sendText".

    @method (timeText)
    */
    'timeText': function(){
        return TAPi18n.__('wallet.send.texts.timeTexts.'+ (Number(TemplateVar.get('selectedFeeMultiplicator') * 2)+2));
    }
});


Template['views_send'].events({
    /**
    Set the from address, selected in the select field.
    
    @event change select[name="from"]
    */
    'change select[name="from"]': function(e){
        TemplateVar.set('fromAddress', e.currentTarget.value);
    },
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
        TemplateVar.set('selectedFeeMultiplicator', Number(e.currentTarget.value));
    },
    /**
    Submit the form
    
    @event submit form
    */
    'submit form': function(e){
        console.log(e);
    }
});