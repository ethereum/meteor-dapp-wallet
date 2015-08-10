/**
Template Controllers

@module Templates
*/

/**
The account create template

@class [template] views_account_create
@constructor
*/

Template['views_account_create'].onCreated(function(){
    TemplateVar.set('multisigSignees', 3);      // number of owners of the account
    TemplateVar.set('multisigSignatures', 2);   // number of required signatures

    TemplateVar.set('selectedSection', 'simple');
});


Template['views_account_create'].onRendered(function(){
    // focus the input
    this.$('input[name="accountName"]').focus();

});


Template['views_account_create'].helpers({
    /**
    Get all accounts, which can become owners.

    @method (ownerAccounts)
    */
    'ownerAccounts': function(){
        return EthAccounts.find({}, {sort: {balance: -1}}).fetch();
    },
    /**
    Return the selectedOwner

    @method (selectedOwner)
    */
    'selectedOwner': function(){
        return TemplateVar.getFrom('.dapp-select-account', 'value');
    },
    /**
    Return TRUE, if the current section is selected

    @method (showSection)
    */
    'showSection': function(section){
        // var template = Template.instance();

        // Tracker.afterFlush(function(){
        //     // set the default signee numbers
        //     TemplateVar.set(template,'multisigSignees', template.$('button[data-name="multisigSignees"]').attr('data-value'));
        // });

        // reset import wallet
        TemplateVar.set('importWalletOwners', false);
        TemplateVar.set('importWalletInfo', '');

        return TemplateVar.get('selectedSection') === section;
    },
    /**
    Return the number of signees

    @method (multisigSigneesValue)
    */
    'multisigSigneesValue': function(section){
        return TemplateVar.get('multisigSignees');
    },
    /**
    Return the number of signees

    @method (multisigSignaturesValue)
    */
    'multisigSignaturesValue': function(section){
        return TemplateVar.get('multisigSignatures');
    },
    /**
    Return the number of signees fields

    @method (signees)
    @return {Array} e.g. [1,2,3,4]
    */
    'signees': function(){
        if ((TemplateVar.get('multisigSignatures')+1) > TemplateVar.get('multisigSignees')) {
            TemplateVar.set('multisigSignees', TemplateVar.get('multisigSignatures'));
        }

        return _.range(TemplateVar.get('multisigSignees') - 1);
    },
    /**
    Translates to 'owner address'

    @method (i18nOwnerAddress)
    */
    'i18nOwnerAddress': function(){
        return TAPi18n.__('wallet.newWallet.accountType.multisig.ownerAddress');
    },
    /**
    Translates to 'wallet address'

    @method (i18nWalletAddress)
    */
    'i18nWalletAddress': function(){
        return TAPi18n.__('wallet.newWallet.accountType.import.walletAddress');
    },
    /**
    Returns the import info text.

    @method (importInfo)
    */
    'importInfo': function() {
        var text = TemplateVar.get('importWalletInfo'),
            owners = TemplateVar.get('importWalletOwners');

        if(!text) {
            return '';
        } else {
            if(owners)
                return '<i class="icon-check"></i> '+ text;
            else
                return '<i class="icon-close"></i> '+ text;
        }
    },
    /**
    Returns the class valid for valid addresses and invalid for non wallet addresses.

    @method (importValidClass)
    */
    'importValidClass': function(){
        return TemplateVar.get('importWalletOwners') ? 'valid' : 'invalid';
    },
    /**
    Get the number of required multisignees

    @method (multisigSignees)
    */
    'multisigSignees': function() {
        return [
        {
            value: '2',
            text: '2'
        },
        {
            value: '3',
            text: '3'
        },
        {
            value: '4',
            text: '4'
        },
        {
            value: '5',
            text: '5'
        },
        {
            value: '6',
            text: '6'
        },
        {
            value: '7',
            text: '7'
        }];
    },
    /**
    Get the number of required multisignatures

    @method (multisigSignatures)
    */
    'multisigSignatures': function() {
        var signees = TemplateVar.get('multisigSignees');
        var returnValue = [
        {
            value: '2',
            text: '2'
        },
        {
            value: '3',
            text: '3'
        },
        {
            value: '4',
            text: '4'
        },
        {
            value: '5',
            text: '5'
        },
        {
            value: '6',
            text: '6'
        },
        {
            value: '7',
            text: '7'
        }];

        returnValue = returnValue.slice(0, signees-1);

        return returnValue;
    }
});

Template['views_account_create'].events({
    /**
    Check the owner of the imported wallet.
    
    @event change input.import, input input.import
    */
    'change input.import, input input.import': function(e, template){
        var address = e.currentTarget.value;
        if(web3.isAddress(address)) {
            var myContract = WalletContract.at(address);

            myContract.m_numOwners(function(e, numberOfOwners){
                if(!e) {
                    numberOfOwners = numberOfOwners.toNumber();
                    
                    if(numberOfOwners > 0) {
                        var owners = [];

                        // go through all 250 storage slots and get addresses,
                        // once we reach the number of owners we stop
                        _.find(_.range(250), function(i){
                            var ownerAddress = web3.eth.getStorageAt(address, 2+i).replace('0x000000000000000000000000','0x');
                            if(web3.isAddress(ownerAddress) && ownerAddress !== '0x0000000000000000000000000000000000000000')
                                owners.push(ownerAddress);

                            if(owners.length === numberOfOwners)
                                return true;
                            else
                                return false;
                        });

                        TemplateVar.set(template, 'importWalletOwners', owners);

                        if(account = Helpers.getAccountByAddress({$in: owners})) {
                            TemplateVar.set(template, 'importWalletInfo', TAPi18n.__('wallet.newWallet.accountType.import.youreOwner', {account: account.name}));
                        } else {
                            TemplateVar.set(template, 'importWalletInfo', TAPi18n.__('wallet.newWallet.accountType.import.watchOnly'));
                        }

                    } else {
                        TemplateVar.set(template, 'importWalletOwners', false);
                        TemplateVar.set(template, 'importWalletInfo', TAPi18n.__('wallet.newWallet.accountType.import.notWallet'));
                    }
                }
            })

        } else {
            TemplateVar.set('importWalletOwners', false);
            TemplateVar.set('importWalletInfo', '');
        }
    },
    /**
    Select the current section, based on the radio inputs value.

    @event change input[type="radio"]
    */
    'change input[type="radio"]': function(e){
        TemplateVar.set('selectedSection', e.currentTarget.value);
    },
    /**
    Change the number of signatures

    @event click span[name="multisigSignatures"] .simple-modal button
    */
    'click span[name="multisigSignatures"] .simple-modal button': function(e){
        TemplateVar.set('multisigSignatures',  $(e.currentTarget).data('value'));
    },
    /**
    Change the number of signees

    @event click span[name="multisigSignees"] .simple-modal button
    */
    'click span[name="multisigSignees"] .simple-modal button': function(e){
        TemplateVar.set('multisigSignees',  $(e.currentTarget).data('value'));
    },
    /**
    Create the account

    @event submit
    */
    'submit': function(e, template){
        var type = TemplateVar.get('selectedSection');

        // SIMPLE
        if(type === 'simple') {
            Wallets.insert({
                owners: [template.find('select[name="dapp-select-account"]').value],
                name: template.find('input[name="accountName"]').value || TAPi18n.__('wallet.accounts.defaultName'),
                balance: '0',
                creationBlock: EthBlocks.latest.number,
                disabled: true
            });

            Router.go('/');
        }

        // MULTISIG
        if(type === 'multisig') {
            var formValues = InlineForm('.inline-form');

            var owners = _.uniq(_.compact(_.map(template.findAll('input.owners'), function(item){
                if(web3.isAddress(item.value))
                    return '0x'+ item.value.replace('0x','');
            })));

            if(owners.length != formValues.multisigSignees)
                return GlobalNotification.warning({
                    content: 'i18n:wallet.newWallet.error.emptySignees',
                    duration: 2
                });

            Wallets.insert({
                owners: owners,
                name: template.find('input[name="accountName"]').value || TAPi18n.__('wallet.accounts.defaultName'),
                balance: '0',
                dailyLimit: web3.toWei(formValues.dailyLimitAmount, 'ether'),
                requiredSignatures: formValues.multisigSignatures,
                creationBlock: EthBlocks.latest.number,
                disabled: true
            });

            Router.go('/');
        }

        // IMPORT
        if(type === 'import') {

            var owners = _.uniq(_.compact(_.map(TemplateVar.get('importWalletOwners'), function(item){
                if(web3.isAddress(item))
                    return item;
            })));

            if(owners.length === 0)
                return;


            var address = template.find('input.import').value;
            address = '0x'+ address.replace('0x','');
            if(Wallets.findOne({address: address}))
                return GlobalNotification.warning({
                    content: 'i18n:wallet.newWallet.error.alreadyExists',
                    duration: 2
                });

            // reorganize owners, so that yourself is at place one
            var account = Helpers.getAccountByAddress({$in: owners || []});
            if(account) {
                owners = _.without(owners, account.address);
                owners.unshift(account.address);
            }

            Wallets.insert({
                owners: owners,
                name: template.find('input[name="accountName"]').value || TAPi18n.__('wallet.accounts.defaultName'),
                address: address,
                balance: '0',
                creationBlock: 0,
                imported: true
            });

            Router.go('/');
        }

    }
});
