/**
Template Controllers

@module Templates
*/

/**
The account template

@class [template] elements_account
@constructor
*/

/**
Block required until a transaction is confirmed.

@property blocksForConfirmation
@type Number
*/
var blocksForConfirmation = 12;

var accountClipboardEventHandler = function(e){
    if (Session.get('tmpAllowCopy') === true) {
        Session.set('tmpAllowCopy', false);
        return true;
    }
    else {
        e.preventDefault();
    }

    function copyAddress(){

        var typeClass = e.target.name;

        var copyTextarea = document.querySelector('.copyable-address' + typeClass.toString());

        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(copyTextarea);
        selection.removeAllRanges();
        selection.addRange(range);

        try {
            document.execCommand('copy');

            GlobalNotification.info({
                content: 'i18n:wallet.accounts.addressCopiedToClipboard',
                duration: 3
            });
        } catch (err) {
            GlobalNotification.error({
                content: 'i18n:wallet.accounts.addressNotCopiedToClipboard',
                closeable: false,
                duration: 3
            });
        }
        selection.removeAllRanges();
    }

    if (Helpers.isOnMainNetwork()) {
        Session.set('tmpAllowCopy', true);
        copyAddress();
    }
    else {
        EthElements.Modal.question({
            text: new Spacebars.SafeString(TAPi18n.__('wallet.accounts.modal.copyAddressWarning')),
            ok: function(){
                Session.set('tmpAllowCopy', true);
                copyAddress();
            },
            cancel: true,
            modalQuestionOkButtonText: TAPi18n.__('wallet.accounts.modal.buttonOk'),
            modalQuestionCancelButtonText: TAPi18n.__('wallet.accounts.modal.buttonCancel')
        });
    }
};


Template['elements_account'].rendered = function(){

    // initiate the geo pattern
    var pattern = GeoPattern.generate(this.data.address);
    this.$('.account-pattern').css('background-image', pattern.toDataUrl());
};


Template['elements_account'].helpers({
    /**
    Get the current account

    @method (account)
    */
    'account': function(){
    	  var account = EthAccounts.findOne(this.account);

    	  if ( FlowRouter.getRouteName() === 'dashboard') {
            var tokenBalance = 0;

            var query = {};
            query['balances.'+ account._id] = {$exists: true};

            var tokens = Tokens.find(query, {sort: {name: 1}}).fetch();

            _.each(tokens, (token) => {
                tokenBalance += parseInt(token.balances[account._id]);
            });

            if (account.balance === "0" && tokenBalance === 0) {
                account.hrefType = false;
            }  else {
                account.hrefType = true;
            }
        }

        return account;
    },
    /**
    Get all tokens

    @method (tokens)
    */
    'tokens': function(){
        var query = {};
        query['balances.'+ this._id] = {$exists: true};
        return Tokens.find(query, {limit: 5, sort: {name: 1}});
    },
    /**
    Get the tokens balance

    @method (formattedTokenBalance)
    */
    'formattedTokenBalance': function(e){
        var account = Template.parentData(2);

        var balance;
        if (this.balances && Number(this.balances[account._id]) > 0) {
            balance = Helpers.formatNumberByDecimals(this.balances[account._id], this.decimals);

            var balType = Helpers.toFixed(balance);

            return balType + '<span> ' + this.symbol + '</span>';
        } else {
            return false;
        }
    },
    /**
    Get the name

    @method (name)
    */
    'name': function(){
        return this.name || TAPi18n.__('wallet.accounts.defaultName');
    },
    /**
    Account was just added. Return true and remove the "new" field.

    @method (new)
    */
    'new': function() {
        if(this.new) {
            // remove the "new" field
            var id = this._id;
            Meteor.setTimeout(function() {
                EthAccounts.update(id, {$unset: {new: ''}});
                Wallets.update(id, {$unset: {new: ''}});
                CustomContracts.update(id, {$unset: {new: ''}});
            }, 1000);

            return true;
        }
    },
    /**
    Should the wallet show disabled

    @method (creating)
    */
    'creating': function(){
        return (!this.address || this.imported || (blocksForConfirmation >= EthBlocks.latest.number - (this.creationBlock - 1) && EthBlocks.latest.number - (this.creationBlock - 1) >= 0));
    },
    /**
    Returns the confirmations

    @method (totalConfirmations)
    */
    'totalConfirmations': blocksForConfirmation,
    /**
    Checks whether the transaction is confirmed ot not.

    @method (unConfirmed)
    */
    'unConfirmed': function() {
        if(!this.address || !this.creationBlock || this.createdIdentifier)
            return false;

        var currentBlockNumber = EthBlocks.latest.number,
            confirmations = currentBlockNumber - (this.creationBlock - 1);
        return (blocksForConfirmation >= confirmations && confirmations >= 0)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation)) * 100
            }
            : false;
    },
    /**
    Displays ENS names with triangles
    @method (nameDisplay)
    */
    'displayName': function(){
        return this.ens ? this.name.split('.').slice(0, -1).reverse().join(' ▸ ') : this.name;
    },
    /**
    Adds class about ens
    @method (ensClass)
    */
    'ensClass': function(){
        return this.ens ?  'ens-name' : 'not-ens-name';
    }
});

Template['elements_account'].events({
    /**
    Field test the speed wallet is rendered
    
    @event click button.show-data
    */
    'click .wallet-box': function(e){
        console.time('renderAccountPage');
    },
    'click #transfer': function (e) {

        return GlobalNotification.warning({
            content: "This address's value is 0, can not to transfer",
            duration: 2
        });
    },

    'click .copy-to-clipboard-button': accountClipboardEventHandler,

    'click .qrcode-button': function(e){
        e.preventDefault();

        var name = e.target.name;

        // Open a modal showing the QR Code
        EthElements.Modal.show({
            template: 'views_modals_qrCode',
            data: {
                address: name
            }
        });
    },

    'click .wanchain-passwd': function (e) {
        e.preventDefault();

        var name = e.target.name;
        console.log('name: ', name);

        if (typeof mist !== "undefined") {
            mist.changePassword(
                name
            )
        }

    }

});
