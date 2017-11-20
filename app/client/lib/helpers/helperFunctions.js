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
Get the default contract example

@method getDefaultContractExample
**/
Helpers.getDefaultContractExample = function(withoutPragma) {
    var source = 'contract MyContract {\n    /* Constructor */\n    function MyContract() public {\n\n    }\n}';

    if (withoutPragma) {
        return source;
    } else {
        var solcVersion;

        // Keep this for now as the Mist-API object will only be availabe from Mist version >= 0.8.9
        // so that older versions that will query code from wallet.ethereum.org won't use broken example code.
        if (typeof mist !== 'undefined' && mist.solidity && mist.solidity.version) {
            solcVersion = mist.solidity.version;
        }
        else {
            solcVersion = '0.4.6';
        }
        return 'pragma solidity ^' + solcVersion + ';\n\n' + source;
    }
}

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
Return an account you own, from a list of accounts

@method getOwnedAccountFrom
@param {Array} accountList array of account addresses
@return {Mixed} the account address of an account owned
**/
Helpers.getOwnedAccountFrom = function(accountList){
    // Load the accounts owned by user and sort by balance
    var accounts = EthAccounts.find({}, {sort: {balance: 1}}).fetch();
    accounts.sort(Helpers.sortByBalance);

    // Looks for them among the wallet account owner
    var fromAccount = _.find(accounts, function(acc){
       return (accountList.indexOf(acc.address)>=0);
    })

    return fromAccount ? fromAccount.address : '';
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
    console.log('EVENT LOG: ', arguments);
}

/**
Check if we are on the correct chain and display an error.

@method checkChain
@param {Function} callback provide a callback, to get notified if successfull or error (will contain an error object as first parameter, if error)
*/
Helpers.checkChain = function(callback){
    // TODO deactivated for now!!! because we are using full contracts
    return callback(null);


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
    if(_.isString(address))
        address = address.toLowerCase();
    return EthAccounts.findOne({address: address}, options) || Wallets.findOne({address: address}, options) || CustomContracts.findOne({address: address}, options);
};

/**
Gets the docuement matching the given query from the EthAccounts or Wallets collection.

@method getAccounts
@param {String} query
@param {Boolean} reactive
*/
Helpers.getAccounts = function(query, reactive) {
    var options = (reactive === false) ? {reactive: false} : {};
    if(_.isString(query.address))
        query.address = query.address.toLowerCase();
    return EthAccounts.find(query, options).fetch().concat(Wallets.find(query, options).fetch());
};

/**
Gets the docuement matching the given addess from the EthAccounts or Wallets collection and returns its name or address.

@method getAccountNameByAddress
@param {String} name or address
*/
Helpers.getAccountNameByAddress = function(address) {
    if (typeof address != 'undefined')
        var doc =  Helpers.getAccountByAddress(address.toLowerCase());

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
Formats a given transactions balance

    Helpers.formatTransactionBalance(tx)

@method formatTransactionBalance
@param {String} value  the value to format
@param {Object} exchangeRates  the exchange rates to use
@param {String} unit  the unit to format to
@return {String} The formated value
**/
Helpers.formatTransactionBalance = function(value, exchangeRates, unit) {

    // make sure not existing values are not Spacebars.kw
    if(unit instanceof Spacebars.kw)
        unit = null;

    var unit = unit || EthTools.getUnit(),
        format = '0,0.00';

    if((unit === 'usd' || unit === 'eur' || unit === 'btc') &&
       exchangeRates && exchangeRates[unit]) {

        if(unit === 'btc')
            format += '[000000]';
        else
            format += '[0]';

        var price = new BigNumber(String(web3.fromWei(value, 'ether')), 10).times(exchangeRates[unit].price);
        return EthTools.formatNumber(price, format) + ' '+ unit.toUpperCase();
    } else {
        return EthTools.formatBalance(value, format + '[0000000000000000] UNIT');
    }
};


/**
Formats an input and prepares it to be a template

    Helpers.createTemplateDataFromInput(abiFunctionInput);

@method createTemplateDataFromInput
@param {object} input           The input object, out of an ABI
@return {object} input          The input object with added variables to make it into a template
**/
Helpers.createTemplateDataFromInput = function (input, key){
    input = _.clone(input);

    input.index = key;
    input.typeShort = input.type.match(/[a-z]+/i);
    input.typeShort = input.typeShort[0];
    input.bits = input.type.replace(input.typeShort, '');
    input.displayName = input.name
        .replace(/([A-Z])/g, ' $1')
        .replace(/([\-\_])/g, '&thinsp;<span class="punctuation">$1</span>&thinsp;');

    if(input.type.indexOf('[') === -1 &&
       (input.typeShort === 'string' ||
        input.typeShort === 'uint' ||
        input.typeShort == 'int' ||
        input.typeShort == 'address' ||
        input.typeShort == 'bool' ||
        input.typeShort == 'bytes')) {

        input.template =  'elements_input_'+ input.typeShort;
    } else {
        input.template =  'elements_input_json';
    }

    return input;
};

/**
Adds the input value from a form field to the inputs array

@method addInputValue
@param {object} inputs          The current inputs
@param {object} currentInput   The current input
@return {Array} array of parameter values
**/
Helpers.addInputValue = function (inputs, currentInput, formField){

    return _.map(inputs, function(input) {
            var value = _.isUndefined(input.value) ? '' : input.value;

            if(currentInput.name === input.name &&
               currentInput.type === input.type &&
               currentInput.index === input.index ) {

                if(input.type.indexOf('[') !== -1) {
                    try {
                        value = JSON.parse(formField.value);
                    } catch(e) {
                        value = [];
                    }

                // force 0x at the start
                } else if(!_.isEmpty(formField.value) &&
                   (input.typeShort === 'bytes' ||
                    input.typeShort === 'address')) {
                    // If it looks like hex, then add 0x before
                    value = /^[0-9a-f]+$/i.test(formField.value.replace('0x','')) ? '0x'+ formField.value.replace('0x','') : null;

                // bool
                } else if(input.typeShort === 'bool') {
                    value = !!formField.checked;
                } else {
                    value = formField.value || '';
                }

                input.value = value;
            }

            return value;
        }) || [];
};

/**
Takes a camelcase and shows it with spaces

@method toSentence
@param {string} camelCase    A name in CamelCase or snake_case format
@return {string} sentence    The same name, sanitized, with spaces
**/
Helpers.toSentence = function (inputString, noHTML) {
    if (typeof inputString == 'undefined') {
      return false;
    } else {
        inputString = inputString.replace(/[^a-z0-9_]/gi, '');
      if (noHTML === true) // only consider explicit true
        return inputString.replace(/([A-Z]+|[0-9]+)/g, ' $1').trim();
      else
        return inputString.replace(/([A-Z]+|[0-9]+)/g, ' $1').trim().replace(/([\_])/g, '<span class="dapp-punctuation">$1</span>');
    }
}


/**
Returns true if Main is the current network.

@method isOnMainNetwork
@return {Bool}
**/
Helpers.isOnMainNetwork = function () {
    return Session.get('network') == 'main';
};

/**
ENS Functions
**/
var sha3 = function(str, opt) {
  return '0x' + web3.sha3(str, opt).replace('0x','');
};

function namehash(name) {
    var node = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (name != '') {
        var labels = name.split(".");
        for(var i = labels.length - 1; i >= 0; i--) {
            node = sha3(node + sha3(labels[i]).slice(2), {encoding: 'hex'});
        }
    }
    return node.toString();
}


var ensContractAbi = [{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"label","type":"bytes32"},{"name":"owner","type":"address"}],"name":"setSubnodeOwner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"ttl","type":"uint64"}],"name":"setTTL","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"ttl","outputs":[{"name":"","type":"uint64"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"owner","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"owner","type":"address"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":true,"name":"label","type":"bytes32"},{"indexed":false,"name":"owner","type":"address"}],"name":"NewOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"resolver","type":"address"}],"name":"NewResolver","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"ttl","type":"uint64"}],"name":"NewTTL","type":"event"}];

var resolverContractAbi = [{"constant":true,"inputs":[{"name":"interfaceID","type":"bytes4"}],"name":"supportsInterface","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"},{"name":"contentTypes","type":"uint256"}],"name":"ABI","outputs":[{"name":"contentType","type":"uint256"},{"name":"data","type":"bytes"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"x","type":"bytes32"},{"name":"y","type":"bytes32"}],"name":"setPubkey","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"content","outputs":[{"name":"ret","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"addr","outputs":[{"name":"ret","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"contentType","type":"uint256"},{"name":"data","type":"bytes"}],"name":"setABI","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"name","outputs":[{"name":"ret","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"name","type":"string"}],"name":"setName","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"hash","type":"bytes32"}],"name":"setContent","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"pubkey","outputs":[{"name":"x","type":"bytes32"},{"name":"y","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"addr","type":"address"}],"name":"setAddr","outputs":[],"payable":false,"type":"function"},{"inputs":[{"name":"ensAddr","type":"address"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"a","type":"address"}],"name":"AddrChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"hash","type":"bytes32"}],"name":"ContentChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"name","type":"string"}],"name":"NameChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":true,"name":"contentType","type":"uint256"}],"name":"ABIChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"},{"indexed":false,"name":"y","type":"bytes32"}],"name":"PubkeyChanged","type":"event"}];

var ensAddress = '0x314159265dd8dbb310642f98f50c066173c1259b';


/**
Returns a string, given an address

@method getENSName
**/
Helpers.getENSName = function(address, callback) {

    if (Session.get('network') !== 'main' ) {
        callback('Cannot retrieve ENS addresses unless fully synced on main chain', null, null);
        return;
    }
    var node = namehash(address.toLowerCase().replace('0x','')+'.addr.reverse');
    var ensContract = web3.eth.contract(ensContractAbi);
    var resolverContract = web3.eth.contract(resolverContractAbi);

    // instantiate ens
    ensContract.at(ensAddress, function(err, ens) {
        // get a resolver address for that name
        ens.resolver(node, function(err, resolverAddress) {
            if (err) callback(err, null, null);
            else if (resolverAddress == 0) callback('no resolver address', null, null);
            else {
                // if you find one, find the name on that resolver
                resolverContract.at(resolverAddress).name(node, function(error, name) {
                    if (err) callback(err, null, null);
                    else if (name == 0) callback('Found resolver but no name', null, null);
                    else {
                        // any address can claim any name, we need to check the name now
                        var node = namehash(name);
                        // get a resolver address for that name
                        ens.resolver(node, function (err, resolverAddress) {
                            if (err) callback(err, null, null);
                            else if (resolverAddress == 0) callback('Name has no resolver', null, null);
                            else {
                                // if you find one, find the addr of that resolver
                                resolverContract.at(resolverAddress).addr(node, function(error, returnAddr) {
                                    if (err) callback(err, null, null);
                                    else if (returnAddr == 0) callback('No address returned', null, null);
                                    else {
                                        callback(error, name, returnAddr);
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    });
}
