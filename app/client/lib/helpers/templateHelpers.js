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
Gets the current users name.

@method (username)
**/
Template.registerHelper('username', function(identity){
    var user = Users.findOne(identity);
    
    // return myself
    if(Whisper.getIdentity().identity === identity) {
        return Whisper.getIdentity().name;
    
    // return username
    } else if (user) {
        return user.name;

    // return anonymous
    } else {
        return 'anonymous';
    }
});

/**
Gets the current identity (name and identity).

@method (currentIdentity)
**/
Template.registerHelper('currentIdentity', function(identity){
    return Whisper.getIdentity();
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


/**
Formats a number.

    {{formatNumber myNumber "0,0.0[0000]"}}

@method (formatNumber)
@param {String} number
@param {String} format       the format string
@return {String} The formatted number
**/
Template.registerHelper('formatNumber', function(number, format){
    if(format instanceof Spacebars.kw)
        format = null;

    if(number instanceof BigNumber)
        number = number.toNumber();

    format = format || '0,0.0[0000]';


    if(!_.isFinite(number))
        number = numeral().unformat(number);

    if(_.isFinite(number))
        return numeral(number).format(format);
});

