if (window.ethereum) {
  start(window.ethereum);
} else {
  // Init web3 with default local provider
  web3 = new Web3('ws://localhost:8546');

  // Request Ethereum Provider (EIP 1102)
  window.addEventListener('message', event => {
    if (event.data && event.data.type === 'ETHEREUM_PROVIDER_SUCCESS') {
      if (window.ethereum) {
        start(window.ethereum);
      }
    }
  });
  window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, this.origin);
}

const start = ethereum => {
  // Init web3 with provider
  web3 = new Web3(ethereum);

  // Restart app on certain events
  ethereum.on('connect', startApp);
  ethereum.on('networkChanged', startApp);
  ethereum.on('accountsChanged', startApp);

  // Go!
  startApp();
};

const startApp = () => {
  connectToNode();
};
