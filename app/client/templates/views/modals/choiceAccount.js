/**
 Template Controllers
 @module Templates
 */

/**
 The select account template
 @class [template] dapp_selectAccount
 @constructor
 */

Template['dapp_choiceAccount'].onCreated(function(){
	if(this.data) {
		if(this.data.value) {
			TemplateVar.set('value', this.data.value);
		} else if(this.data.accounts && this.data.accounts[0]) {
			TemplateVar.set('value', this.data.accounts[0]);
		}
	}

});


Template['dapp_choiceAccount'].helpers({
	/**
	 Check if its a normal account
	 @method (isAccount)
	 */
	'isAccount': function(){
		return this.type === 'account' && Template.parentData(1).showAccountTypes;
	},
	/**
	 Return the selected attribute if its selected
	 @method (selected)
	 */
	'selected': function(){
		return (TemplateVar.get('value') === this.address)
			? {selected: true}
			: {};
	},
	/**
	 Check if the current selected unit is not ether
	 @method (isNotEtherUnit)
	 */
	'isNotEtherUnit': function() {
		return EthTools.getUnit().toLowerCase() !== 'ether';
	},
	/**
	 Check if the current selected unit is not ether
	 @method (isNotEtherUnit)
	 */
	'isAddress': function() {
		return web3.isAddress(TemplateVar.get('value'));
	}
});

Template['dapp_choiceAccount'].events({
	/**
	 Set the selected address.

	 @event change select
	 */
	'change select': function(e){
		TemplateVar.set('value', e.currentTarget.value);
	}
});
