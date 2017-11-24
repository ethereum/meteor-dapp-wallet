Meteor.startup(function() {

    if(mist)
    {
        mist.addPermanentCallbacks('requestAccount',function(e, accounts) {
            if(!e) {
                console.log('PermanentCallbacksrequestAccount :' + JSON.stringify(accounts));
                if(!_.isArray(accounts)) {
                    accounts = [accounts];
                }
                accounts.forEach(function(account){
                    addr = account.address.toLowerCase();
                    web3.wan.getWanAddress(addr,function (e, wAddress) {
                        if(!e) {
                            var insert = {
                                type: 'account',
                                address: addr,
                                waddress: wAddress,
                                balance: 0,
                                name: account.name
                            };

                            if(doc) {
                                EthAccounts.updateAll(doc._id, {
                                    $set: insert
                                });
                            } else {
                                EthAccounts.insert(insert);
                            }
                        }

                    });

                });
            }
        })
    }
    // SET default language
    if(Cookie.get('TAPi18next')) {
        TAPi18n.setLanguage(Cookie.get('TAPi18next'));
    } else {
        var userLang = navigator.language || navigator.userLanguage,
        availLang = TAPi18n.getLanguages();

        // set default language
        if (_.isObject(availLang) && availLang[userLang]) {
            TAPi18n.setLanguage(userLang);
        } else if (_.isObject(availLang) && availLang[userLang.substr(0,2)]) {
            TAPi18n.setLanguage(userLang.substr(0,2));
        } else {
            TAPi18n.setLanguage('en');
        }
    }
    // change moment and numeral language, when language changes
    Tracker.autorun(function(){
        if(_.isString(TAPi18n.getLanguage())) {
            var lang = TAPi18n.getLanguage().substr(0,2);
            moment.locale(lang);
            try {
                numeral.language(lang);
            } catch (err) {
                console.warn('numeral.js couldn\'t set number formating: ', err.message);
            }
            EthTools.setLocale(lang);
        }

        // If on the mainnet, this will add the unicorn token by default, only once.
        if (!localStorage['dapp_hasUnicornToken'] && Session.get('network') === 'main'){
            localStorage.setItem('dapp_hasUnicornToken', true);

            // wait 5s, to allow the tokens to be loaded from the localstorage first
            Meteor.setTimeout(function(){
                var unicornToken = '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7';
                tokenId = Helpers.makeId('token', unicornToken);
                Tokens.upsert(tokenId, {$set: {
                    address: unicornToken,
                    name: 'Unicorns',
                    symbol: '🦄',
                    balances: {},
                    decimals: 0
                }});
            }, 5000);
        }
    });


});
