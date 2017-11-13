// set providor
if(typeof web3 !== 'undefined')
  web3 = new Web3(web3.currentProvider);
else
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

function insertMethod(name, call, params, inputFormatter, outputFormatter) {
    return new web3._extend.Method({name, call, params, inputFormatter, outputFormatter});
}

web3._extend({
  property: 'wan',
  methods:
      [
        insertMethod('getWanAddress', 'eth_getWanAddress', 1, [web3._extend.formatters.inputAddressFormatter], web3._extend.formatters.formatOutputString)
      ],
  properties:
      [],
});
