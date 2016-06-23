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
Template.registerHelper('isMist', function(){
    return (typeof mist !== 'undefined');
});

/**
Check if in mist and in mist mode

@method (isMistMode)
**/
Template.registerHelper('isMistMode', function(){
    return (typeof mist !== 'undefined' && mist.mode === 'mist');
});

/**
Check if currenct unit is an ether unit

@method (isEtherUnit)
**/
Template.registerHelper('isEtherUnit', function(){
    var unit = EthTools.getUnit();
    return !(unit === 'usd' || unit === 'eur' || unit === 'btc');
});


/**
Check if wallet has vulnerabilities

@method (isVulnerable)
**/
Template.registerHelper('isVulnerable', function(){
    return !!_.find(this.vulnerabilities || [], function(vul){
        return vul;
    });
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
Returns a list of accounts and wallets sorted by balance

@method (latestBlock)
**/
Template.registerHelper('selectAccounts', function(){
    var accounts = EthAccounts.find({}, {sort: {name: 1}}).fetch();
    accounts = _.union(Wallets.find({owners: {$in: _.pluck(accounts, 'address')}, address: {$exists: true}}, {sort: {name: 1}}).fetch(), accounts);
    accounts.sort(Helpers.sortByBalance);
    return accounts;
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
Format a number based on decimal numbers

    {{formatNumberByDecimals tokenAmount decimals}}

@method formatNumberByDecimals
@param {Number} number
@param {Number} decimals
*/
Template.registerHelper('formatNumberByDecimals', Helpers.formatNumberByDecimals);

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


/**
Formats a given transactions balance

    {{formatTransactionBalance value exchangeRates "ether"}}

@method formatTransactionBalance
@param {String} value  the value to format
@param {Object} exchangeRates  the exchange rates to use
@param {String} unit  the unit to format to
@return {String} The formated value
**/
Template.registerHelper('formatTransactionBalance', Helpers.formatTransactionBalance);


/** 
Formats address to a CaseChecksum

@method toChecksumAddress
@param {String} address             The address
@return {String} checksumAddress    The returned, checksummed address
**/
Template.registerHelper('toChecksumAddress', web3.toChecksumAddress);



/** 
Takes a camelcase and shows it with spaces

@method toSentence
@param {string} camelCase    A name in CamelCase or snake_case format
@return {string} sentence    The same name with spaces
**/
Template.registerHelper('toSentence', Helpers.toSentence);

