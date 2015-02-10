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
var calculateGasPrice = function(fee){
    var minimunGasSent = 10000;
    var suggestedGasPrice = 0.01;
    return minimunGasSent * suggestedGasPrice * Math.pow(4, fee);
}


Template['views_send'].created = function(){
    // set the default fee
    TemplateVar.set('selectedFeeMultiplicator', 0);

    TemplateVar.set('amount', 0);
};


Template['views_send'].helpers({
    /**
    Return the to publicKey

    @method (toPublicKey)
    */
    'toPublicKey': function(){
        return TemplateVar.get('toPublicKey');
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
            return numeral(calculateGasPrice(TemplateVar.get('selectedFeeMultiplicator'))).format('0,0.[000000]');
    },
    /**
    Return the current sepecified amount (finney)

    @method (amount)
    */
    'amount': function(){
        return (_.isFinite(TemplateVar.get('amount')))
            ? numeral(TemplateVar.get('amount')).format('0,0.[000000]')
            : 0;
    },
    /**
    Calculates the ether amount of the current sepecified amount (finney)

    @method (amountEther)
    */
    'amountEther': function(){
        return (_.isFinite(TemplateVar.get('amount')))
            ? numeral(TemplateVar.get('amount') / 1000).format('0,0.[000000]')
            : 0;
    },
    /**
    Return the currently selected fee + amount

    @method (total)
    */
    'total': function(){
        if(_.isFinite(TemplateVar.get('selectedFeeMultiplicator')))
            return numeral((TemplateVar.get('amount') || 0) + calculateGasPrice(TemplateVar.get('selectedFeeMultiplicator'))).format('0,0.[000000]');
    },
    /**
    Calculates the ether amount of any given finey amount

    @method (inEther)
    */
    'inEther': function(amount){
        if(_.isFinite(amount) || _.isString(amount)) {
            amount = numeral().unformat(amount);
            return numeral(amount / 1000).format('0,0.[000000]')
        }
        return 0;
    },
    /**
    Returns the right time text for the "sendText".

    @method (timeText)
    */
    'timeText': function(){
        return TAPi18n.__('wallet.send.texts.timeTexts.'+ (Number(TemplateVar.get('selectedFeeMultiplicator') * 2)+2));
    }
    /**
    Return the currently selected fee in finney

    @method (feeFormated)
    */
    // 'feeFormated': function(){
    //     switch(TemplateVar.get('selectedFeeMultiplicator')) {
    //         case 1:
    //             return 0;
    //         case 2:
    //             return 100;
    //         case 3:
    //             return 200;
    //         case 4:
    //             return 300;
    //         case 5:
    //             return 400;
    //     };
    //     console.log('hallo');
    // }
});


Template['views_send'].events({
    /**
    Set the to publicKey while typing
    
    @event keyup input[name="to"]
    */
    'keyup input[name="to"]': function(e){
        TemplateVar.set('toPublicKey', e.currentTarget.value);
    },
    /**
    Set the amount while typing
    
    @event keyup input[name="amount"]
    */
    'keyup input[name="amount"]': function(e){
        TemplateVar.set('amount', Number(e.currentTarget.value.replace(',','.')));
        // Tracker.afterFlush(function(){
        //     if(_.isFinite(_.last(e.currentTarget.value)) && e.keyCode !== 8 && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey)
        //         e.currentTarget.value = numeral(e.currentTarget.value).format('0,0[.]000');
        // });
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