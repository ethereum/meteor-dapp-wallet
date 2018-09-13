Meteor.startup(function() {

    if(typeof mist !== 'undefined')
    {
        mist.addPermanentCallbacks('requestAccount',function(e, accounts) {
            if(!e) {
                console.log('PermanentCallbacksrequestAccount :' + JSON.stringify(accounts));
                if(!_.isArray(accounts)) {
                    accounts = [accounts];
                }
                accounts.forEach(function(account){
                    addr = account.address.toLowerCase();
                    web3.wan.getWanAddress(addr, function (e, wAddress) {
                        if (!e) {
                            var doc = EthAccounts.findAll({
                                address: addr,
                            }).fetch()[0];
                            if(doc)
                            {
                                EthAccounts.updateAll(doc._id, {
                                    $set: {name: account.name, reminder: account.reminder}
                                });
                                console.log("modify account name!");
                            }
                            else
                            {
                                var insert = {
                                    type: 'account',
                                    address: addr,
                                    waddress: wAddress,
                                    balance: 0,
                                    name: account.name,
                                    reminder: account.reminder
                                };
                                EthAccounts.insert(insert);
                            }

                            FlowRouter.go('dashboard');
                        } else {
                            GlobalNotification.error({
                                content: e,
                                duration: 8
                            });
                        }
                    });

                });
            } else if(e.message) {
                GlobalNotification.error({
                    content: e.message,
                    duration: 8
                });
            }
        })
    }
    // SET default language
    // if(Cookie.get('TAPi18next')) {
    //     TAqPi18n.setLanguage(Cookie.get('TAPi18next'));
    // } else {
    //     var userLang = navigator.language || navigator.userLanguage,
    //     availLang = TAPi18n.getLanguages();
    //
    //     // set default language
    //     if (_.isObject(availLang) && availLang[userLang]) {
    //         TAPi18n.setLanguage(userLang);
    //     } else if (_.isObject(availLang) && availLang[userLang.substr(0,2)]) {
    //         TAPi18n.setLanguage(userLang.substr(0,2));
    //     } else {
    //         TAPi18n.setLanguage('en');
    //     }
    // }
    TAPi18n.setLanguage('en');

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
        // if (!localStorage['dapp_hasUnicornToken'] && Session.get('network') === 'main'){
        //     localStorage.setItem('dapp_hasUnicornToken', true);
        //
        //     // wait 5s, to allow the tokens to be loaded from the localstorage first
        //     Meteor.setTimeout(function(){
        //         var unicornToken = '0x63eed4943abaac5f43f657d8eec098ca6d6a546e';
        //         tokenId = Helpers.makeId('token', unicornToken);
        //         Tokens.upsert(tokenId, {$set: {
        //             address: unicornToken,
        //             name: 'Wanchain Ethereum Crosschain Token',
        //             symbol: 'WETH',
        //             balances: {},
        //             decimals: 18
        //         }});
        //     }, 5000);
        // }

        if(typeof mist !== 'undefined')
        {
            // weth
            mist.ETH2WETH().getWethToken(function (err, unicornToken) {
                if(!err) {
                    Meteor.setTimeout(function(){
                        let tokenId = Helpers.makeId('token', unicornToken.address);
                        let dapp_hasWethToken = Tokens.findOne(tokenId);

                        if (dapp_hasWethToken === undefined) {
                            let dapp_isWeth = Tokens.findOne({isWeth: 1});

                            if (dapp_isWeth !== undefined) {
                                Tokens.remove(dapp_isWeth._id);
                            }

                            Tokens.upsert(tokenId, {$set: {
                                    address: unicornToken.address,
                                    name: unicornToken.name,
                                    symbol: unicornToken.symbol,
                                    balances: {},
                                    decimals: unicornToken.decimals,
                                    isWeth: 1
                                }});
                        }

                    }, 2000);
                } else {
                    console.log('getWethToken err: ', err);
                }
            });

            // wbtc
            mist.BTC2WBTC().getWbtcToken(function (err, unicornToken) {
                if(!err) {
                    Meteor.setTimeout(function(){
                        let tokenId = Helpers.makeId('token', unicornToken.address);
                        let dapp_hasWethToken = Tokens.findOne(tokenId);

                        if (dapp_hasWethToken === undefined) {
                            let dapp_isWeth = Tokens.findOne({isWbtc: 1});

                            if (dapp_isWeth !== undefined) {
                                Tokens.remove(dapp_isWeth._id);
                            }

                            Tokens.upsert(tokenId, {$set: {
                                    address: unicornToken.address,
                                    name: unicornToken.name,
                                    symbol: unicornToken.symbol,
                                    balances: {},
                                    decimals: unicornToken.decimals,
                                    isWbtc: 1
                                }});
                        }

                    }, 2000);
                } else {
                    console.log('getWethToken err: ', err);
                }
            });

        }

    });


});
