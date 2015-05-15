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
Get the current selected unit

@method (unit)
**/
Template.registerHelper('unit', function(identity){
    return LocalStore('unit').value;
});

/**
Get all accounts

@method (accounts)
**/
Template.registerHelper('accounts', function(identity){
    return Accounts.find({}, {sort: {type: 1}});
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
Template.registerHelper('formatNumber', Helpers.formatNumber);


/**
Formats a number.

    {{formatBalance myNumber "0,0.0[0000]"}}

@method (formatBalance)
@param {String} number
@param {String} format       the format string
@return {String} The formatted number
**/
Template.registerHelper('formatBalance', Helpers.formatBalance);