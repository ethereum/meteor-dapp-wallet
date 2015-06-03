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
    '10s': new ReactiveTimer(10)
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
    return prefix +'_'+ hash.replace('0x','').substr(0,10);
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
Check if the given wallet is a watch only wallet, by checking if we are one of owners in the wallet.

@method isWatchOnly
@param {String} id the id of the wallet to check
*/
Helpers.isWatchOnly = function(id) {
    return !Accounts.findOne({_id: id, owners: {$in: _.pluck(Accounts.find({type: 'account'}).fetch(), 'address')}});
};

/**
Shows the offline mesage

@method displayOffline
**/
// Helpers.displayOffline = function(){
//     return GlobalNotification.warning({
//         content: 'i18n:app.offline',
//         okText: TAPi18n.__('buttons.tryToReconnect'),
//         ok: function(){
//             Meteor.reconnect();
//         }
//     });
// };

/**
Displays an error as global notification

@method displayError
@param {Object} error The error object
@param {Boolean} accounts will show the accounts errors
@return {Boolean}
**/
// Helpers.displayError = function(error, accounts) {
//     var duration = 8;

//     if(error) {

//         if(error.reason){
//             // hack to make account errors still work
//             if(accounts) {
//                 GlobalNotification.error({
//                     content: 'i18n:accounts.error.' + error.reason.toLowerCase().replace(/[ ]+/g, ''),
//                     duration: duration
//                 });

//             } else {
//                 GlobalNotification.error({
//                     content: 'i18n:'+ error.reason,
//                     duration: duration
//                 });
//             }
//         } else if(error.message) {
//             GlobalNotification.error({
//                 content: error.message,
//                 duration: duration
//             });
//         } else {
//             GlobalNotification.error({
//                 content: error,
//                 duration: duration
//             });
//         }

//         return true;

//     } else
//         return false;
// };


/**
Get form values and build a parameters object out of it.

@method formValuesToParameters
@param {Element} elements   DOM-Elements elements, selects, inputs and textareas, to get values from. Must have a name tag
@return {Object} An object with parameters to pass to the API Controller e.g.:

    {
        key1: 'value1',
        key2: 'value2'
    }
**/
// Helpers.formValuesToParameters = function(elements) {
//     var parameters = {};

//     $(elements).each(function(){
//         var $element = $(this),
//             name = $element.attr('name'),
//             value = $element.val();

//         // add only values wich are not null or empty
//         if(name && !_.isEmpty(value) && value !== 'null' && value !== 'NULL') {
//             if(_.isFinite(value))
//                 parameters[name] = parseInt(value);
//             else if(_.isBoolean(value))
//                 parameters[name] = (value === 'true' || value === 'True' || value === 'TRUE') ? true : false;
//             else if($element.attr('type') === 'radio')
//                 parameters[name] = ($element.is(':checked')) ? true : false;
//             else if($element.attr('type') === 'checkbox')
//                 parameters[name] = ($element.is(':checked')) ? true : false;
//             else
//                 parameters[name] = value;
//         }
//         $element = null;
//     });

//     return parameters;
// };


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
@param {String} time         The timstamp, can be string or unix format
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
Formats a given number

    Helpers.formatNumber(10000, "0.0[000]")

@method formatNumber
@param {Number|String|BigNumber} number the number to format
@param {String} format           the format string e.g. "0.0[000]" see http://numeraljs.com for more.
@return {String} The formated time
**/
Helpers.formatNumber = function(number, format){
    if(format instanceof Spacebars.kw)
        format = null;

    if(number instanceof BigNumber)
        number = number.toString(10);

    format = format || '0,0.0[0000]';

    if(!_.isFinite(number))
        number = numeral().unformat(number);

    if(_.isFinite(number))
        return numeral(number).format(format);
};


/**
Formats a given number toa unit balance

    Helpers.formatBalance(10000, "0.0[000]")

@method formatBalance
@param {Number|String|BigNumber} number the number to format
@param {String} format           the format string e.g. "0.0[000]" see http://numeraljs.com for more.
@return {String} The formated balance including the unit
**/
Helpers.formatBalance = function(number, format){
    number = web3.fromWei(number, LocalStore.get('etherUnit'));

    return Helpers.formatNumber(number, format) +' '+ LocalStore.get('etherUnit');
};