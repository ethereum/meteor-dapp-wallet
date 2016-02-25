Meteor.startup(function() {

    // SET default language
    if(Cookie.get('TAPi18next')) {
        TAPi18n.setLanguage(Cookie.get('TAPi18next'));
    } else {
        var userLang = navigator.language || navigator.userLanguage,
        availLang = TAPi18n.getLanguages();

        // set default language
        if (_.isObject(availLang) && availLang[userLang]) {
            TAPi18n.setLanguage(userLang);
            // lang = userLang;
        } else if (_.isObject(availLang) && availLang[userLang.substr(0,2)]) {
            TAPi18n.setLanguage(userLang.substr(0,2));
            // lang = userLang.substr(0,2);
        } else {
            TAPi18n.setLanguage('en');
            // lang = 'en';
        }
    }
    // change moment and numeral language, when language changes
    Tracker.autorun(function(){
        if(_.isString(TAPi18n.getLanguage())) {
            var lang = TAPi18n.getLanguage().substr(0,2);
            moment.locale(lang);
            numeral.language(lang);
            EthTools.setLocale(lang);
        }

        // If on the mainnet, this will add the unicorn token by default, only once.
        if (!localStorage['dapp_hasUnicornToken'] && Session.get('network') === 'mainnet'){
            localStorage.setItem('dapp_hasUnicornToken', true);

            var unicornToken = '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7';
            tokenId = Helpers.makeId('token', unicornToken);
            Tokens.upsert(tokenId, {$set: {
                address: unicornToken,
                name: 'Unicorns',
                symbol: '🦄',
                balances: {},
                decimals: 0
            }});    
        }
    });




});