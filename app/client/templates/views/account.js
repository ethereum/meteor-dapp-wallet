/**
Template Controllers

@module Templates
*/
var InterID;

Template['views_account'].onCreated(function () {
    var template = this;

    InterID = Meteor.setInterval(function(){
        var waddress = Helpers.getAccountByAddress(FlowRouter.getParam('address')).waddress.slice(2);
        mist.requestOTACollection(waddress, function (e, result) {
            var oldOtas = TemplateVar.get(template,'otaValue');
            if(!oldOtas || oldOtas.length !== result.length)
            {
                var otaValue = 0;
                if (!e && result.length >0) {
                    _.each(result, function(ota){
                        otaValue += parseInt(ota.value);
                    });
                }
                TemplateVar.set(template,'otasValue',otaValue);
                Session.set('otas', result);
            }
        })
    }, 2000);
});

Template['views_account'].onDestroyed(function () {
    var template = this;
    TemplateVar.set(template,'otas',[]);
    TemplateVar.set(template,'otasValue',0);

    Meteor.clearInterval(InterID);
});

Template['views_account'].onRendered(function(){
    console.timeEnd('renderAccountPage');
});

Template['views_account'].helpers({
    /**
    Get the current selected account

    @method (account)
    */
    'account': function() {
    	  var account = Helpers.getAccountByAddress(FlowRouter.getParam('address'));
    	  console.log('views account: ', account);
        return account;
    },
		/**
		 Get all transactions

		 @method (allTransactions)
		 */
		'allTransactions': function(){
			var allTransactions = Transactions.find({from: FlowRouter.getParam('address').toLowerCase()}, {sort: {timestamp: -1}}).count();
			return allTransactions;
		},
		'theAddress': function () {
			return FlowRouter.getParam('address');
		},

    /**
    Get all tokens, tokens number

    @method (tokens)
    */
    'tokens': function(){
        var query = {};
        query['balances.'+ this._id] = {$exists: true};

        var testTokens = [
            {name: 'Token1', address: '0x67ABC83C87BE7F9214B2518723A51D1d34e82837', balance: '100000'},
            {name: 'Token2', address: '0x67ABC83C87BE7F9214B2518723A51D1d34e82837', balance: '100000'},
            {name: 'Token3', address: '0x67ABC83C87BE7F9214B2518723A51D1d34e82837', balance: '100000'},
            {name: 'Token4', address: '0x67ABC83C87BE7F9214B2518723A51D1d34e82837', balance: '100000'},
            {name: 'Token5', address: '0x67ABC83C87BE7F9214B2518723A51D1d34e82837', balance: '100000'},
            {name: 'Token5', address: '0x67ABC83C87BE7F9214B2518723A51D1d34e82837', balance: '100000'}
        ];

        return Tokens.find(query, {sort: {name: 1}});
        // return testTokens;
    },

	'tokenLength': function () {
        var query = {};
        query['balances.'+ this._id] = {$exists: true};
        var totalToken = Tokens.find(query, {sort: {name: 1}}).count();

        return totalToken;
        // return 1;
    },

		/**
		 Get all OTAs

		 @method (ota)
		 */
		'otasValue': function () {
		  console.log('otasValue: ', TemplateVar.get('otasValue'));
			return TemplateVar.get('otasValue');
        // return 1000000000000000000;
    },

    /**
    Get the tokens balance

    @method (formattedTokenBalance)
    */
    'formattedTokenBalance': function(e){
        var account = Template.parentData(2);

        return (this.balances && Number(this.balances[account._id]) > 0)
            ? Helpers.formatNumberByDecimals(this.balances[account._id], this.decimals) +' '+ this.symbol
            : false;
    },
    /**
    Gets the contract events if available

    @method (customContract)
    */
    'customContract': function(){
        return CustomContracts.findOne({address: this.address.toLowerCase()});
    },
    /**
     Displays ENS names with triangles
 
     @method (nameDisplay)
     */
    'displayName': function(){
         return this.ens ? this.name.split('.').slice(0, -1).reverse().join(' ▸ ') : this.name;
    }           

});

var accountStartScanEventHandler = function(e){

    mist.startScan(FlowRouter.getParam('address'), (err, result)=>{
        if(err){
            console.log("Error:", err);
        }
        console.log("startscan:", result);
    })
};
var accountClipboardEventHandler = function(e){
	if (Session.get('tmpAllowCopy') === true) {
		Session.set('tmpAllowCopy', false);
		return true;
	}
	else {
		e.preventDefault();
	}

	function copyAddress(){
		var type = e.target.name;
		var typeId = e.target.id;

		console.log('type: ', type);
      console.log('typeId: ', typeId);

		var copyTextarea;
		if (type === 'address' || typeId === 'address') {
			copyTextarea = document.querySelector('.copyable-address');
		} else {
			copyTextarea = document.querySelector('.copyable-waddress');
		}

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

Template['views_account'].events({

    /**
    Clicking the name, will make it editable

    @event click .edit-name
    */
    'click .edit-name': function(e){
        // make it editable
        $(e.currentTarget).attr('contenteditable','true');
    },
    /**
    Prevent enter

    @event keypress .edit-name
    */
    'keypress .edit-name': function(e){
        if(e.keyCode === 13)
            e.preventDefault();
    },
    /**
    Bluring the name, will save it

    @event blur .edit-name, keyup .edit-name
    */
    'blur .edit-name, keyup .edit-name': function(e){
        if(!e.keyCode || e.keyCode === 13) {
            var $el = $(e.currentTarget);
            var text = $el.text();


            if(_.isEmpty(text)) {
                text = TAPi18n.__('wallet.accounts.defaultName');
            }

            // Save new name
            Wallets.update(this._id, {$set: {
                name: text
            }});
            EthAccounts.update(this._id, {$set: {
                name: text
            }});
            CustomContracts.update(this._id, {$set: {
                name: text
            }});

            // make it non-editable
            $el.attr('contenteditable', null);
        }
    },
    /**
    Click to copy the code to the clipboard
    
    @event click a.create.account
    */
    'click .start-to-scan-block-button': accountStartScanEventHandler,
    'click .copy-to-clipboard-button': accountClipboardEventHandler,
		'click .copy-to-clipboard-wbutton': accountClipboardEventHandler,

    /**
    Tries to copy account token.
    
    @event copy .copyable-address span
    */
    'copy .copyable-address': accountClipboardEventHandler,
		'copy .copyable-waddress': accountClipboardEventHandler,



    /**
    Click to reveal QR Code
    
    @event click a.create.account
    */
    'click .qrcode-button': function(e){
        e.preventDefault();

        var name = e.target.name;
        var address;
        if (name === 'address') {
        	address = this.address
        } else {
        	address = this.waddress
        }
        
        // Open a modal showing the QR Code
        EthElements.Modal.show({
            template: 'views_modals_qrCode',
            data: {
                address: address
            }
        });
    }
});
