if (window.ethereum) {
  start(window.ethereum);
} else {
  // Set default provider
  web3.setProvider('ws://localhost:8546');

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
  // Set provider
  web3.setProvider(ethereum);

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
