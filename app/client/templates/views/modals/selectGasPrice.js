/**
 Template Controllers
 @module Templates
 */

/**
 The select gas price template
 @class [template] dapp_selectGasPrice
 @constructor
 */

/**
 The the factor by which the gas price should be changeable.
 @property toPowerFactor
 */
var toPowerFactor = 1.1;

/**
 Calculates the gas * gas price.
 @method calculateGasInWei
 @return {Number}
 */
var calculateGasInWei = function(template, gas, gasPrice, returnGasPrice){
    // Only defaults to 20 shannon if there's no default set => 2.0e+10 = 20gWei
    gasPrice = new BigNumber(gasPrice || 2.0e+12);

    var minGasPrice = new BigNumber(1.8 * 10**gasPrice.e),
        maxGasPrice = new BigNumber(3.0 * 10**gasPrice.e);
    //
    // console.log('defaultGasPrice', gasPrice);
    // console.log('minGasPrice', minGasPrice);
    // console.log('maxGasPrice', maxGasPrice);

    if (gasPrice < minGasPrice) {
        gasPrice = minGasPrice;
    } else if (gasPrice > maxGasPrice) {
        gasPrice = maxGasPrice;
    }


    if(!_.isObject(gasPrice))
        gasPrice = new BigNumber(String(gasPrice), 10);

    if(_.isUndefined(gas)) {
        console.warn('No gas provided for {{> dapp_selectGasPrice}}');
        return new BigNumber(0);
    }

    var feeMultiplicator = Number(TemplateVar.get(template, 'feeMultiplicator'));

    // divide and multiply to round it to the nearest billion wei (1 shannon)
    var billion = new BigNumber(1000000000);

    gasPrice = gasPrice.times(new BigNumber(toPowerFactor).toPower(feeMultiplicator)).dividedBy(billion).round().times(billion);


    return (returnGasPrice)
        ? gasPrice
        : gasPrice.times(gas);
};

Template['modal_selectGasPrice'].onCreated(function(){
    TemplateVar.set('gasInWei', '0');
    TemplateVar.set('gasPrice', '0');
    TemplateVar.set('feeMultiplicator', 0);
    TemplateVar.set('options', false);
});


Template['modal_selectGasPrice'].helpers({
    /**
     Return the currently selected fee value calculate with gas price
     @method (fee)
     */
    'fee': function(){

        if(_.isFinite(TemplateVar.get('feeMultiplicator')) && _.isFinite(this.gas)) {
            var template = Template.instance();

            // console.log('this.gasPrice', this.gasPrice);

            // set the value
            TemplateVar.set('gasInWei', calculateGasInWei(template, this.gas, this.gasPrice).floor().toString(10));
            TemplateVar.set('gasPrice', calculateGasInWei(template, this.gas, this.gasPrice, true).floor().toString(10));

            // return the fee
            var fee = EthTools.formatBalance(calculateGasInWei(template, this.gas, this.gasPrice).toString(10), '0,0.[000000000000000000]', this.unit);

            return fee;

        }
    },

    'feeNum': function () {
        var route = FlowRouter.getRouteName();

        if (route === 'otaRefund') {
            var otaNum = Session.get('otas').length;

            return  ' x ' + otaNum;
        } else {
            return '';
        }
    },

    /**
     Return the current unit
     @method (unit)
     */
    'unit': function(){
        // var unit = this.unit || EthTools.getUnit();
        var unit = this.unit || 'wan';

        if(unit)
            return unit.toUpperCase();
    },
    /**
     Get the correct text, if TAPi18n is available.
     @method i18nText
     */
    'i18nText': function(key){
        if(typeof TAPi18n !== 'undefined'
            && TAPi18n.__('elements.selectGasPrice.'+ key) !== 'elements.selectGasPrice.'+ key) {
            return TAPi18n.__('elements.selectGasPrice.'+ key);
        } else if (typeof this[key] !== 'undefined') {
            return this[key];
        } else {
            return (key === 'high') ? '+' : '-';
        }
    },

    'option': function () {
        return this.option
    }
});

Template['modal_selectGasPrice'].events({
    /**
     Change the selected fee

     @event change input[name="fee"], input input[name="fee"]
     */
    'change input[name="fee"], input input[name="fee"]': function(e){

        TemplateVar.set('feeMultiplicator', Number(e.currentTarget.value));
    },

    'click .options': function () {

        TemplateVar.set('options', !TemplateVar.get('options'));
    }
});