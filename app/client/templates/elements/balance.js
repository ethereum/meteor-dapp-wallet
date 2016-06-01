/**
Template Controllers

@module Templates
*/

/**
The balance template

@class [template] elements_balance
@constructor
*/


Template['elements_balance'].onCreated(function(){
    this._intervalId = null;
});


Template['elements_balance'].helpers({
    /**
    Gets currently selected unit

    @method (convertedBalance)
    */
    'convertedBalance': function(){
        var balance = TemplateVar.get('balance');
        
        if (EthTools.getUnit() === 'noether') return 'infinite';

        if(balance){
            if(EthTools.getUnit() === 'usd' || EthTools.getUnit() === 'eur')
                return EthTools.formatBalance(TemplateVar.get('balance'), '0,0.00');
            else if(EthTools.getUnit() === 'ether')
                return EthTools.formatBalance(TemplateVar.get('balance'), (this.showAllDecimals? '0,0.00[0000000000000000]' : '0,0.00') );
            else if(EthTools.getUnit() === 'finney')
                return EthTools.formatBalance(TemplateVar.get('balance'), (this.showAllDecimals? '0,0.00[00000000000000]' : '0,0.00'));
            else
                return EthTools.formatBalance(TemplateVar.get('balance'), '0,0.00[000000]');
        }
    },
    /**
    Get the current balance and count it up/down to the new balance.

    @method (getBalance)
    */
    'getBalance': function(){
        var data = this,
            template = Template.instance(),
            newBalance = (_.isFinite(this.balance)) ? this.balance : '0';

        // transform to BigNumber
        newBalance = new BigNumber(newBalance, 10);

        Meteor.clearInterval(template._intervalId);

        template._intervalId = Meteor.setInterval(function(){
            var oldBalance = TemplateVar.get(template, 'balance') || 0,
                calcBalance = newBalance.minus(oldBalance).dividedBy(10).floor();

            if(oldBalance &&
               !oldBalance.equals(newBalance) &&
               (calcBalance.greaterThan(10000000000) || (calcBalance.lessThan(0) && calcBalance.lessThan(-10000000000))))
                TemplateVar.set(template, 'balance', oldBalance.plus(calcBalance));
            else {
                TemplateVar.set(template, 'balance', newBalance);
                Meteor.clearInterval(template._intervalId);
            }
        }, 1);
    }
});
