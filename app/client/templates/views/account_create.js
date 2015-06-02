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

    TemplateVar.set('selectedSection', 'multisig');

    if(account = Accounts.findOne({type: 'account'}, {sort: {name: 1}}))
        TemplateVar.set('selectedOwner', account.address);
});


Template['views_account_create'].onRendered(function(){
    // focus the input
    this.$('input[name="accountName"]').focus();

});


Template['views_account_create'].helpers({
    /**
    Get all accounts, which can become owners.

    @method (accounts)
    */
    'accounts': function(){
        return Accounts.find({type: 'account'}, {sort: {name: 1}});
    },
    /**
    Return the selectedOwner

    @method (selectedOwner)
    */
    'selectedOwner': function(){
        return TemplateVar.get('selectedOwner');
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
    Translates the 'owner address'

    @method (i18Owneraddress)
    */
    'i18Owneraddress': function(){
        return TAPi18n.__('wallet.newWallet.accountType.multisig.owneraddress');
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
    Set the owner address, selected in the select field.
    
    @event change select[name="owner"]
    */
    'change select[name="owner"]': function(e){
        TemplateVar.set('selectedOwner', e.currentTarget.value);
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
            Accounts.insert({
                type: 'wallet',
                owners: [template.find('select[name="owner"]').value],
                name: template.find('input[name="accountName"]').value,
                balance: '0',
                dailyLimit: '100000000000000000000000000', // 100 000 000 ether
                creationBlock: LastBlock.findOne('latest').blockNumber,
                disabled: true
            });

            Router.go('/');
        }

        // MULTISIG
        if(type === 'multisig') {
            var formValues = InlineForm('.inline-form');

            var owners = _.uniq(_.compact(_.map(template.findAll('input.owners'), function(item){
                if(web3.isAddress(item.value))
                    return item.value;
            })));

            if(owners.length != formValues.multisigSignees)
                return;

            Accounts.insert({
                type: 'wallet',
                owners: owners,
                name: template.find('input[name="accountName"]').value,
                balance: '0',
                dailyLimit: web3.toWei(formValues.dailyLimitAmount, 'ether'),
                requiredSignatures: formValues.multisigSignatures,
                creationBlock: LastBlock.findOne('latest').blockNumber,
                disabled: true
            });

            Router.go('/');
        }

        // IMPORT
        if(type === 'import') {
            Accounts.insert({
                type: 'wallet',
                owners: template.find('select[name="owner"]').value,
                name: template.find('input[name="accountName"]').value,
                balance: '0',
                dailyLimit: '100000000000000000000', // 100 ether
                creationBlock: LastBlock.findOne('latest').blockNumber,
                disabled: true
            });

            Router.go('/');
        }

    }
});
