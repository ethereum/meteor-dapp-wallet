Meteor.startup(function() {
  // SET default language
  if (Cookie.get('TAPi18next')) {
    TAPi18n.setLanguage(Cookie.get('TAPi18next'));
  } else {
    var userLang = navigator.language || navigator.userLanguage,
      availLang = TAPi18n.getLanguages();

    // set default language
    if (_.isObject(availLang) && availLang[userLang]) {
      TAPi18n.setLanguage(userLang);
    } else if (_.isObject(availLang) && availLang[userLang.substr(0, 2)]) {
      TAPi18n.setLanguage(userLang.substr(0, 2));
    } else {
      TAPi18n.setLanguage('en');
    }
  }
  // change moment and numeral language, when language changes
  Tracker.autorun(function() {
    if (_.isString(TAPi18n.getLanguage())) {
      var lang = TAPi18n.getLanguage().substr(0, 2);
      moment.locale(lang);
      try {
        numeral.language(lang);
      } catch (err) {
        console.warn("numeral.js couldn't set number formating: ", err.message);
      }
      EthTools.setLocale(lang);
    }

    var tokens = [];

    if (publicSettings.tokens) {
      console.info('load tokens...');
      _.extend(tokens, publicSettings.tokens);
    }

    tokens.forEach(function(tok) {
      // If on the network, this will add token by default, only once.
      if (
        !localStorage[tok.local] &&
        Session.get('name') === tok.name
      ) {
        localStorage.setItem(tok.local, true);

        // wait 5s, to allow the tokens to be loaded from the localstorage first
        Meteor.setTimeout(function() {
          tokenId = Helpers.makeId('token', tok.token.address);
          Tokens.upsert(tokenId, {$set: tok.token});
        }, 5000);
      }
    });
  });
});
