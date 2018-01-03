// set providor
if(typeof web3 !== 'undefined')
    web3 = new Web3(web3.currentProvider);
else
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

function insertMethod(name, call, params, inputFormatter, outputFormatter) {
    return new web3._extend.Method({name, call, params, inputFormatter, outputFormatter});
}
function insertProperty(name, getter, outputFormatter) {
    return new web3._extend.Property({name, getter, outputFormatter});
}
web3._extend({
    property: 'wan',
    methods:[
        insertMethod('generateOneTimeAddress', 'eth_generateOneTimeAddress', 1),
        insertMethod('buyOTAStamp', 'eth_buyOTAStamp', 1, [web3._extend.formatters.inputTransactionFormatter]),
        insertMethod('getOTAMixSet', 'eth_getOTAMixSet', 1, [web3._extend.formatters.inputTransactionFormatter]),
        insertMethod('sendOTARefundTransaction', 'eth_sendOTARefundTransaction', 1, [web3._extend.formatters.inputTransactionFormatter]),
        insertMethod('sendOTATransaction', 'eth_sendOTATransaction', 1, [web3._extend.formatters.inputTransactionFormatter]),
        insertMethod('getOTABalance', 'eth_getOTABalance', 1, [null], web3._extend.formatters.outputBigNumberFormatter),
        insertMethod('getWanAddress', 'eth_getWanAddress', 1, [web3._extend.formatters.inputAddressFormatter], web3._extend.formatters.formatOutputString),

        insertMethod('getPermiWanCoinOTABalances', 'wan_getSupportWanCoinOTABalances', 0, null, web3._extend.formatters.formatOutputString),
        insertMethod('getPermiStampOTABalances', 'wan_getSupportStampOTABalances', 0, null, web3._extend.formatters.formatOutputString)
    ],
    properties: [
//        insertProperty('wanAddress', 'eth_getWanAddress', web3._extend.formatters.inputAddressFormatter),
    ],
});
