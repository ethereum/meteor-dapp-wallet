/**
Helper functions

@module Helpers
**/

/**
The Helpers class containing helper functions

@class Helpers
@constructor
**/
Helpers = {};

/**
Reruns functions reactively, based on an interval. Use it like so:

    Helpers.rerun['10s'].tick();


@method rerun
**/
Helpers.rerun = {
    '10s': new ReactiveTimer(10),
    '1s': new ReactiveTimer(1)
};

/**
Sort method for accounts and wallets to sort by balance

@method sortByBalance
**/
Helpers.sortByBalance = function(a, b){
    return !b.disabled && new BigNumber(b.balance, 10).gt(new BigNumber(a.balance, 10)) ? 1 : -1;
};

/**
Clear localStorage

@method getLocalStorageSize
**/
Helpers.getLocalStorageSize = function(){

    var size = 0;
    if(localStorage) {
        _.each(Object.keys(localStorage), function(key){
            size += localStorage[key].length * 2 / 1024 / 1024;
        });
    }

    return size;
};

/**
Make a ID out of a given hash and prefix.

@method makeId
@param {String} prefix
@param {String} hash
*/
Helpers.makeId = function(prefix, hash){
    return _.isString(hash) ? prefix +'_'+ hash.replace('0x','').substr(0,10) : null;
};


/**
Format a number based on decimal numbers

@method formatNumberByDecimals
@param {Number} number
@param {Number} decimals
*/
Helpers.formatNumberByDecimals = function(number, decimals){

    var numberFormat = '0,0.';

    for(i=0; i < Number(decimals); i++){
        numberFormat += "0";
    }

    return EthTools.formatNumber(new BigNumber(number, 10).dividedBy(Math.pow(10, decimals)), numberFormat);
};

/**
Display logs in the console for events.

@method eventLogs
*/
Helpers.eventLogs = function(){
    var args = arguments;
    Array.prototype.unshift.call(args, 'EVENT LOG: ');
    console.log.apply(console, args);
}

/**
Check if we are on the correct chain and display an error.

@method checkChain
@param {Function} callback provide a callback, to get notified if successfull or error (will contain an error object as first parameter, if error)
*/
Helpers.checkChain = function(callback){
    web3.eth.getCode(originalContractAddress, function(e, code){
        if(code && code.length <= 2) {

            if(_.isFunction(callback))
                callback('Wrong chain!');

        } else if(_.isFunction(callback))
            callback(null);
    });
};

/**
Check if the given wallet is a watch only wallet, by checking if we are one of owners in the wallet.

@method isWatchOnly
@param {String} id the id of the wallet to check
*/
Helpers.isWatchOnly = function(id) {
    return !Wallets.findOne({_id: id, owners: {$in: _.pluck(EthAccounts.find({}).fetch(), 'address')}});
};

/**
Shows a notification and plays a sound

@method showNotification
@param {String} i18nText
@param {Object} the i18n values passed to the i18n text
*/
Helpers.showNotification = function(i18nText, values, callback) {
    if(Notification.permission === "granted") {
        var notification = new Notification(TAPi18n.__(i18nText +'.title', values), {
            // icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
            body: TAPi18n.__(i18nText +'.text', values),
        });
        
        if(_.isFunction(callback))
            notification.onclick = callback;
    }
    if(typeof mist !== 'undefined')
        mist.sounds.bip();
};

/**
Gets the docuement matching the given addess from the EthAccounts or Wallets collection.

@method getAccountByAddress
@param {String} address
@param {Boolean} reactive
*/
Helpers.getAccountByAddress = function(address, reactive) {
    var options = (reactive === false) ? {reactive: false} : {};
    return EthAccounts.findOne({address: address}, options) || Wallets.findOne({address: address}, options)|| CustomContracts.findOne({address: address}, options);
};

/**
Gets the docuement matching the given query from the EthAccounts or Wallets collection.

@method getAccounts
@param {String} query
@param {Boolean} reactive
*/
Helpers.getAccounts = function(query, reactive) {
    var options = (reactive === false) ? {reactive: false} : {};
    return EthAccounts.find(query, options).fetch().concat(Wallets.find(query, options).fetch());
};

/**
Gets the docuement matching the given addess from the EthAccounts or Wallets collection and returns its name or address.

@method getAccountNameByAddress
@param {String} name or address
*/
Helpers.getAccountNameByAddress = function(address) {
    var doc = Helpers.getAccountByAddress(address);
    return doc ? doc.name : address; 
};

/**
Reactive wrapper for the moment package.

@method moment
@param {String} time    a date object passed to moment function.
@return {Object} the moment js package
**/
Helpers.moment = function(time){

    // react to language changes as well
    TAPi18n.getLanguage();

    if(_.isFinite(time) && moment.unix(time).isValid())
        return moment.unix(time);
    else
        return moment(time);

};


/**
Formats a timestamp to any format given.

    Helpers.formatTime(myTime, "YYYY-MM-DD")

@method formatTime
@param {String} time         The timestamp, can be string or unix format
@param {String} format       the format string, can also be "iso", to format to ISO string, or "fromnow"
@return {String} The formated time
**/
Helpers.formatTime = function(time, format) { //parameters
    
    // make sure not existing values are not Spacebars.kw
    if(format instanceof Spacebars.kw)
        format = null;

    if(time) {

        if(_.isString(format) && !_.isEmpty(format)) {

            if(format.toLowerCase() === 'iso')
                time = Helpers.moment(time).toISOString();
            else if(format.toLowerCase() === 'fromnow') {
                // make reactive updating
                Helpers.rerun['10s'].tick();
                time = Helpers.moment(time).fromNow();
            } else
                time = Helpers.moment(time).format(format);
        }

        return time;

    } else
        return '';
};


/**
Formats an input and prepares it to be a template 
    
    Helpers.createTemplateDataFromInput(abiFunctionInput);

@method createTemplateDataFromInput
@param {object} input           The input object, out of an ABI
@return {object} input          The input object with added variables to make it into a template
**/
Helpers.createTemplateDataFromInput = function (input, parentName){

    input.typeShort = input.type.match(/[a-z]+/i);
    input.typeShort = input.typeShort[0];
    input.bits = input.type.replace(input.typeShort, '');
    input.parentName = parentName;
    
    if(input.typeShort === 'uint' ||
       input.typeShort == 'int' ||
       input.typeShort == 'address' ||
       input.typeShort == 'bool' ||
       input.typeShort == 'bytes') {

        input.template =  'elements_input_'+ input.typeShort;
    } else {
        input.template =  'elements_input_string';
    }

    return input;    
};
