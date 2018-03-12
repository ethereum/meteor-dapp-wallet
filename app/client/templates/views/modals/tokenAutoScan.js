/**
Modal to auto scan for tokens.

@class [template] views_modals_tokenAutoScan
@constructor
*/

Template['views_modals_tokenAutoScan'].onRendered(function(){
    TemplateVar.set('scanStatus', null);
    $('.token-list .wallet-box.tokens').unbind('mouseenter mouseleave'); // unbind hover to not show delete icon
});

Template['views_modals_tokenAutoScan'].helpers({
    scanButtonIsDisabled: function() {
        if (TemplateVar.get('scanStatus') === null) {
            return '';
        }

        if (TemplateVar.get('scanStatus').indexOf('Error') > -1) {
            return '';
        }

        return 'disabled';
    },
    'tokens': function(){
        return TemplateVar.get('tokens');
    }
});


Template['views_modals_tokenAutoScan'].events({
    'click .scan-button': function(e, template) {
        TemplateVar.set(template, 'scanStatus', TAPi18n.__('wallet.modals.tokenAutoScan.status.downloadingList'));

        var accounts = _.pluck(EthAccounts.find().fetch(), 'address');
        var tokenListURL = 'https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/tokens/tokens-eth.json';
        var tokensToAdd = [];
        var promises = [];
        var balancesChecked = 0;

        HTTP.get(tokenListURL, function(error, result) {
            try {
                var tokens = JSON.parse(result.content);
            } catch (error) {
                var errorString = 'Error parsing token list: ' + error;
                console.log(errorString);
                TemplateVar.set(template, 'scanStatus', errorString);
                return;
            }

            var numberOfBalancesToCheck = tokens.length * accounts.length;
            TemplateVar.set(template, 'scanStatus', TAPi18n.__('wallet.modals.tokenAutoScan.status.checkingBalances', {number: numberOfBalancesToCheck}));

            Tracker.flush();
            Meteor.defer(function(){ // defer to wait for scanStatus to update in UI first
                _.each(tokens, function(token) {
                    _.each(accounts, function(account) {
                        var callData = '0x70a08231000000000000000000000000' + account.substring(2); // balanceOf(address)
                        try {
                            var promise = web3.eth.call({
                                to: token.address, 
                                data: callData  
                            }).then(function(result) {
                                var tokenAmt = web3.utils.toBN(result); 
                                var tokenAmtInEther = web3.utils.fromWei(tokenAmt, 'ether');

                                if (!tokenAmt.isZero()) {
                                    console.log(token.name + ' (' + token.symbol + ') balance for ' + account + ': ' + tokenAmtInEther);
                                    tokensToAdd.push(token);
                                    TemplateVar.set(template, 'tokens', tokensToAdd);
                                    template.$('input.tokensToAddJSON').val(JSON.stringify(tokensToAdd)).change();
                                }

                                balancesChecked++;
                                TemplateVar.set(template, 'scanStatus', TAPi18n.__('wallet.modals.tokenAutoScan.status.checkingBalances', {number: numberOfBalancesToCheck - balancesChecked}));
                            });
                            promises.push(promise);
                        } catch (error) {
                            console.log('Error trying to web3.eth.call: ', error);
                        }
                    });
                });

                Promise.all(promises).then(function() {
                    TemplateVar.set(template, 'scanStatus', null);
                });
            });
        });
    },
    /**
    Prevent the tokens in the list from being clicked
    */
    'click .wallet-box.tokens': function(e) {
        e.preventDefault();
    }
});