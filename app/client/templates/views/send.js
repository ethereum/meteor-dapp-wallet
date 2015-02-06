/**
Template Controllers

@module Templates
*/

/**
The add user template

@class [template] views_send
@constructor
*/


Template['views_send'].created = function(){
    // set the default fee
    TemplateVar.set('selectedFee', 100);

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
    Return the currently selected fee value

    @method (fee)
    */
    'fee': function(){
        if(_.isFinite(TemplateVar.get('selectedFee')))
            return numeral(TemplateVar.get('selectedFee')).format();
    },
    /**
    Return the currently selected fee + amount

    @method (feePlusAmount)
    */
    'feePlusAmount': function(){
        if(_.isFinite(TemplateVar.get('selectedFee')))
            return numeral((TemplateVar.get('amount') || 0) + TemplateVar.get('selectedFee')).format('0,0.[000000]');
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
    Return the currently selected fee in finney

    @method (feeFormated)
    */
    // 'feeFormated': function(){
    //     switch(TemplateVar.get('selectedFee')) {
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
        TemplateVar.set('selectedFee', Number(e.currentTarget.value));
    },
    /**
    Submit the form
    
    @event submit form
    */
    'submit form': function(e){
        console.log(e);
    }
});