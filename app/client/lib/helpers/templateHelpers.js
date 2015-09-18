/**
Helper functions

@module Helpers
**/

/**
Global template helpers

@class TemplateHelpers
@constructor
**/


/**
A simple template helper to log objects in the console.

@method (debug)
**/
Template.registerHelper('debug', function(object){
    console.log(object);
});

/**
Check if in mist

@method (isMist)
**/
Template.registerHelper('isMist', function(object){
    return typeof mist !== 'undefined';
});

/**
Return the current unit

@method (unit)
**/
Template.registerHelper('unit', function(){
    return EthTools.getUnit();
});

/**
Return the latest block

@method (latestBlock)
**/
Template.registerHelper('latestBlock', function(){
    return EthBlocks.latest;
});



/**
Check if the given wallet is a watch only wallet, by checking if we are one of owners in the wallet.

@method (isWatchOnly)
@param {String} id the id of the wallet to check
**/
Template.registerHelper('isWatchOnly', Helpers.isWatchOnly);

/**
Return the right wallet icon

@method (walletIcon)
**/
Template.registerHelper('walletIcon', function(){
    var icon = '';

    if(!_.isUndefined(this.owners)) {
        if(Helpers.isWatchOnly(this._id))
            icon = '<i class="icon-eye" title="Watch only"></i>';
        else
            icon = '<i class="icon-wallet" title="Wallet"></i>';
    } else
        icon = '<i class="icon-key" title="Account"></i>';

    return new Spacebars.SafeString(icon);
});


/**
Get the account name or display the address

@method (accountNameOrAddress)
@param {String} address
*/
Template.registerHelper('accountNameOrAddress', function(address){
    if(account = Helpers.getAccountByAddress(address))
        return account.name;
    else
        return address;
});

/**
Formats a timestamp to any format given.

    {{formatTime myTime "YYYY-MM-DD"}}

@method (formatTime)
@param {String} time         The timstamp, can be string or unix format
@param {String} format       the format string, can also be "iso", to format to ISO string, or "fromnow"
//@param {Boolean} realTime    Whether or not this helper should re-run every 10s
@return {String} The formated time
**/
Template.registerHelper('formatTime', Helpers.formatTime);

