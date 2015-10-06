/**
Template Controllers

@module Templates
*/


Template['views_account'].helpers({
    /**
    Get the current selected account

    @method (account)
    */
    'account': function() {
          return Helpers.getAccountByAddress(FlowRouter.getParam('address'));
    },
    /**
    Get the pending confirmations of this account.

    @method (pendingConfirmations)
    */
    'pendingConfirmations': function(){
        return _.pluck(PendingConfirmations.find({operation: {$exists: true}, confirmedOwners: {$ne: []}, from: this.address}).fetch(), '_id');
    },
    /**
    Return the daily limit available today.

    @method (availableToday)
    */
    'availableToday': function() {
        return new BigNumber(this.dailyLimit || '0', 10).minus(new BigNumber(this.dailyLimitSpent || '0', '10')).toString(10);  
    },
    /**
    Show dailyLimit section

    @method (showDailyLimit)
    */
    'showDailyLimit': function(){
        return (this.dailyLimit && this.dailyLimit !== ethereumConfig.dailyLimitDefault);
    },
    /**
    Show requiredSignatures section

    @method (showRequiredSignatures)
    */
    'showRequiredSignatures': function(){
        return (this.requiredSignatures && this.requiredSignatures > 1);
    },
    /**
    Link the owner either to send or to the account itself.

    @method (ownerLink)
    */
    'ownerLink': function(){
        var owner = String(this);
        if(Helpers.getAccountByAddress(owner))
            return FlowRouter.path('account', {address: owner});
        else
            return FlowRouter.path('sendTo', {address: owner});
    },
    /**
    Get all tokens

    @method (tokens)
    */
    'tokens': function(){
        return Tokens.find({},{sort:{symbol:1}});
    },
    /**
    Get Balance of a Coin

    @method (getBalance)
    */
    'formattedCoinBalance': function(e){
        token = web3.eth.contract(tokenABI).at(this.address);
        
        var balance = Number(token.coinBalanceOf(FlowRouter.getParam('address'))) / Number(this.division);

        if (balance == 0) {
            return false;
        } else {
            // return Number(token.coinBalanceOf(FlowRouter.getParam('address'))) / Number(this.division);
            return numeral(balance).format('0,0.00[000000]') + ' ' + this.symbol;
        }
    }
});

Template['views_account'].events({
    /**
    Clicking the delete button will show delete modal

    @event click button.delete
    */
    'click button.delete': function(e, template){
        var data = this;

        EthElements.Modal.question({
            text: new Spacebars.SafeString(TAPi18n.__('wallet.accounts.modal.deleteText') + 
                '<br><input type="text" class="deletionConfirmation" autofocus="true">'),
            ok: function(){
                if(data.name === $('input.deletionConfirmation').val()) {
                    Wallets.remove(data._id);
                    FlowRouter.go('dashboard');
                    return true;
                }
            },
            cancel: true
        });
    },
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

            // Save new name
            Wallets.update(this._id, {$set: {
                name: $(e.currentTarget).text()
            }});
            EthAccounts.update(this._id, {$set: {
                name: $(e.currentTarget).text()
            }});

            // make it non-editable
            $(e.currentTarget).attr('contenteditable', null);
        }
    },
    /**
    Click to copy the code to the clipboard
    
    @event click a.create.account
    */
    'click .copy-to-clipboard-button': function(e){
        e.preventDefault();
        
        var copyTextarea = document.querySelector('.copyable-address');
        
        var selection = window.getSelection();            
        var range = document.createRange();
        range.selectNodeContents(copyTextarea);
        selection.removeAllRanges();
        selection.addRange(range);

        try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
        }

        selection.removeAllRanges();
        
        return GlobalNotification.warning({
               content: 'i18n:wallet.accounts.addressCopiedToClipboard',
               duration: 2
           });
        
    },
    /**
    Click to reveal QR Code
    
    @event click a.create.account
    */
    'click .qrcode-button': function(e){
        e.preventDefault();
        
        // Open a modal showing the QR Code
        EthElements.Modal.show('views_modals_qrCode');

        
    }
});
