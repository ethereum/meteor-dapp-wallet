
/**
 The address input template, containg the identicon.

 @class [template] dapp_addressInput
 @constructor
 */

Template.dapp_waddressInput.onCreated(function() {
	var template = this;

	// default set to true, to show no error
	TemplateVar.set('isValid', true);
	TemplateVar.set('isChecksum', true);

	if (this.data && this.data.value) {
		TemplateVar.set('value', this.data.value);
	}

	TemplateVar.set(template, 'ensAvailable', true);
});

Template.dapp_waddressInput.onRendered(function() {
	if (this.data) {
		this.$('input').trigger('change');
	}
});

Template.dapp_addressInput.helpers({
	/**
	 Return the to address

	 @method (address)
	 */
	'address': function() {
		var address = TemplateVar.get('value');

		// if(Template.instance().view.isRendered && Template.instance().find('input').value !== address)
		// Template.instance().$('input').trigger('change');

		return (_.isString(address)) ? '0x' + address.replace('0x', '') : false;
	},
	/**
	 Return the autofocus or disabled attribute.

	 @method (additionalAttributes)
	 */
	'additionalAttributes': function() {
		var attr = {};

		if (this.autofocus) {attr.autofocus = true;}
		if (this.disabled) {attr.disabled = true;}

		return attr;
	},
	/**
	 Get the correct text, if TAPi18n is available.

	 @method i18nText
	 */
	'i18nText': function() {
		if (typeof TAPi18n === 'undefined' || TAPi18n.__('elements.checksumAlert') == 'elements.checksumAlert') {
			return "This address looks valid, but it doesn't have some security features that will protect you against typos, so double check you have the right one. If provided, check if the security icon  matches.";
		}
		return TAPi18n.__('elements.checksumAlert');
	},
	'ensDisplay': function() {
		return TemplateVar.get('ensName').split('.').slice(0, -1).reverse().join(' ▸ ');
	}
});


Template.dapp_waddressInput.events({
	/**
	 Set the address while typing

	 @event input input, change input
	 */
	'input input, keyup input': function(e, template) {
		if (!e.currentTarget.value) return;

		var value = e.currentTarget.value.replace(/[\s\*\(\)\!\?\#\$\%]+/g, '');
		TemplateVar.set(template, 'hasName', false);

		// add 0x
		if (value.length === 132
			&& value.indexOf('0x') === -1
			&& /^[0-9a-f]+$/.test(value.toLowerCase())) {
			value = '0x' + value;
		}

		var regex = /^(0x)?[0-9a-fA-F]{132}$/;

		if (regex.test(value.toLowerCase())) {
			TemplateVar.set('isValid', true);

			e.currentTarget.value = value;
		}  else {
			TemplateVar.set('isValid', false);
		}
	},
	/**
	 Set the address while typing

	 @event input input, change input
	 */
	'focus input': function(e, template) {
		if (TemplateVar.get('hasName')) e.currentTarget.value = TemplateVar.get('ensName');
	},
	/**
	 Set the address while typing

	 @event input input, change input
	 */
	'blur input': function(e, template) {
		var value = TemplateVar.get('value');
		if (value) e.currentTarget.value = value;
	},
	/**
	 Prevent the identicon from beeing clicked.

	 TODO: remove?

	 @event click a
	 */
	'click a, click .ens-name': function(e, template) {
		// focus on input element
		var inputElement = template.find('input');
		inputElement.focus();
		e.preventDefault();
	}
});
