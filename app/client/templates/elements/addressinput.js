/**
 Template Controllers
 @module Templates
 */

var sha3 = function(str, opt) {
    return '0x' + web3.sha3(str, opt).replace('0x', '');
};
function checkZeroAddress(address) {
    return address == 0 || address == '0x' || address == '0X';
}
function namehash(name) {
    var node = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (name != '') {
        var labels = name.split('.');
        for (var i = labels.length - 1; i >= 0; i--) {
            node = sha3(node + sha3(labels[i]).slice(2), {encoding: 'hex'});
        }
    }
    return node.toString();
}

var ensContractAbi = [{'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'resolver', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'owner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'label', 'type': 'bytes32'}, {'name': 'owner', 'type': 'address'}], 'name': 'setSubnodeOwner', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'ttl', 'type': 'uint64'}], 'name': 'setTTL', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'ttl', 'outputs': [{'name': '', 'type': 'uint64'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'resolver', 'type': 'address'}], 'name': 'setResolver', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'owner', 'type': 'address'}], 'name': 'setOwner', 'outputs': [], 'payable': false, 'type': 'function'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'owner', 'type': 'address'}], 'name': 'Transfer', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': true, 'name': 'label', 'type': 'bytes32'}, {'indexed': false, 'name': 'owner', 'type': 'address'}], 'name': 'NewOwner', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'resolver', 'type': 'address'}], 'name': 'NewResolver', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'ttl', 'type': 'uint64'}], 'name': 'NewTTL', 'type': 'event'}];

var resolverContractAbi = [{'constant': true, 'inputs': [{'name': 'interfaceID', 'type': 'bytes4'}], 'name': 'supportsInterface', 'outputs': [{'name': '', 'type': 'bool'}], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'contentTypes', 'type': 'uint256'}], 'name': 'ABI', 'outputs': [{'name': 'contentType', 'type': 'uint256'}, {'name': 'data', 'type': 'bytes'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'x', 'type': 'bytes32'}, {'name': 'y', 'type': 'bytes32'}], 'name': 'setPubkey', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'content', 'outputs': [{'name': 'ret', 'type': 'bytes32'}], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'addr', 'outputs': [{'name': 'ret', 'type': 'address'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'contentType', 'type': 'uint256'}, {'name': 'data', 'type': 'bytes'}], 'name': 'setABI', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'name', 'outputs': [{'name': 'ret', 'type': 'string'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'name', 'type': 'string'}], 'name': 'setName', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'hash', 'type': 'bytes32'}], 'name': 'setContent', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'pubkey', 'outputs': [{'name': 'x', 'type': 'bytes32'}, {'name': 'y', 'type': 'bytes32'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'addr', 'type': 'address'}], 'name': 'setAddr', 'outputs': [], 'payable': false, 'type': 'function'}, {'inputs': [{'name': 'ensAddr', 'type': 'address'}], 'payable': false, 'type': 'constructor'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'a', 'type': 'address'}], 'name': 'AddrChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'hash', 'type': 'bytes32'}], 'name': 'ContentChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'name', 'type': 'string'}], 'name': 'NameChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': true, 'name': 'contentType', 'type': 'uint256'}], 'name': 'ABIChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'x', 'type': 'bytes32'}, {'indexed': false, 'name': 'y', 'type': 'bytes32'}], 'name': 'PubkeyChanged', 'type': 'event'}];

var ensAddress = '0x314159265dd8dbb310642f98f50c066173c1259b';

function getAddr(name, ens, callback) {
    var resolverContract = web3.eth.contract(resolverContractAbi);

    var node = namehash(name);
    // get a resolver address for that name
    ens.resolver(node, function(err, resolverAddress) {
        if (!err && !checkZeroAddress(resolverAddress)) {
            // if you find one, find the addr of that resolver
            resolverContract.at(resolverAddress).addr(node, function(error, result) {
                if (!err && result != 0 && callback) {
                    callback(result);
                }
            });
        }
    });
}

function getName(address, ens, callback) {
    var resolverContract = web3.eth.contract(resolverContractAbi);

    var node = namehash(address.toLowerCase().replace('0x', '') + '.addr.reverse');
    // get a resolver address for that name
    ens.resolver(node, function(err, resolverAddress) {
        if (!err && !checkZeroAddress(resolverAddress)) {
            // if you find one, find the name on that resolver
            resolverContract.at(resolverAddress).name(node, function(error, result) {
                if (!err && result != 0 && callback) {
                    callback(result);
                }
            });
        }
    });
}

/**
 The address input template, containg the identicon.
 @class [template] dapp_addrInput
 @constructor
 */

Template.dapp_addrInput.onCreated(function() {
    var template = this;

    // default set to true, to show no error
    TemplateVar.set('isValid', true);
    TemplateVar.set('isChecksum', true);

    if (this.data && this.data.value) {
        TemplateVar.set('value', this.data.value);
    }

    var ensContract = web3.eth.contract(ensContractAbi);
    ensContract.at(ensAddress, function(err, ens) {
        TemplateVar.set(template, 'ensContract', ens);
    });

    TemplateVar.set(template, 'ensAvailable', true);

    web3.eth.getSyncing(function(err, syncing) {
        if (!err && !syncing) {
            // cannot use ENS while syncing
            web3.eth.getCode(ensAddress, function(err, code) {
                if (!err && code.length > 2) {
                    // check if there's code on the address
                    TemplateVar.set(template, 'ensAvailable', true);
                }
            });
        }
    });
});

Template.dapp_addrInput.onRendered(function() {
    if (this.data) {
        this.$('input').trigger('change');
    }
});

Template.dapp_addrInput.helpers({
    /**
     Return the to address
     @method (address)
     */
    'address': function() {
        var address = TemplateVar.get('value');

        // if(Template.instance().view.isRendered && Template.instance().find('input').value !== address)
        // Template.instance().$('input').trigger('change');

        return (_.isString(address) && web3.isAddress(address)) ? '0x' + address.replace('0x', '') : false;
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


Template.dapp_addrInput.events({
    /**
     Set the address while typing
     @event input input, change input
     */
    'input input, keyup input': function(e, template) {
        if (!e.currentTarget.value) return;

        var value = e.currentTarget.value.replace(/[\s\*\(\)\!\?\#\$\%]+/g, '');
        TemplateVar.set(template, 'hasName', false);

        // add 0x
        if (value.length > 38
            && value.indexOf('0x') === -1
            && /^[0-9a-f]+$/.test(value.toLowerCase())) {
            value = '0x' + value;
        }

        if (web3.isAddress(value) || _.isEmpty(value)) {
            TemplateVar.set('isValid', true);

            if (!_.isEmpty(value)) {
                TemplateVar.set('value', '0x' + value.replace('0x', ''));
                TemplateVar.set('isChecksum', web3.isChecksumAddress(value));

                if (TemplateVar.get('ensAvailable')) {
                    var ens = TemplateVar.get('ensContract');

                    // if an address was added, check if there's a name associated with it
                    getName(value, ens, function(name) {
                        // Any address can claim to be any name. Double check it!
                        getAddr(name, ens, function(addr) {
                            TemplateVar.set(template, 'hasName', true);
                            TemplateVar.set(template, 'ensName', name);
                            TemplateVar.set(template, 'isValid', true);
                            TemplateVar.set(template, 'isChecksum', true);
                            TemplateVar.set(template, 'value', web3.toChecksumAddress(addr));
                            e.currentTarget.value = web3.toChecksumAddress(addr);
                        });
                    });
                }
            } else {
                TemplateVar.set('value', undefined);
                TemplateVar.set('isChecksum', true);
            }

            e.currentTarget.value = value;
        } else if (TemplateVar.get('ensAvailable')) {
            if (value.slice(-4) !== '.eth') value = value + '.eth';

            TemplateVar.set('hasName', false);
            TemplateVar.set('isValid', false);
            TemplateVar.set('value', undefined);
            var ens = TemplateVar.get('ensContract');

            getAddr(value, ens, function(addr) {
                TemplateVar.set(template, 'hasName', true);
                TemplateVar.set(template, 'isValid', true);
                TemplateVar.set(template, 'isChecksum', true);
                TemplateVar.set(template, 'value', web3.toChecksumAddress(addr));
                TemplateVar.set(template, 'ensName', value);
                // e.currentTarget.value = web3.toChecksumAddress(addr);
                // check name
                getName(addr, ens, function(name) {
                    TemplateVar.set(template, 'ensName', name);
                });
            });
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