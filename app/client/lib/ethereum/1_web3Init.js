// set providor
if(typeof web3 === 'undefined')
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); //8545 8080 10.10.42.116