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
        return EthAccounts.findOne(this.account) || Wallets.findOne(this.account) || CustomContracts.findOne(this.account);
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

        return (this.balances && Number(this.balances[account._id]) > 0)
            ? Helpers.formatNumberByDecimals(this.balances[account._id], this.decimals) +' '+ this.symbol
            : false;
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
    }
});
