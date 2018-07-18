if (window.ethereum) {
  web3 = new Web3(window.ethereum);
} else {
  // Set default provider
  web3 = new Web3('ws://localhost:8546');

  // Request Ethereum Provider (EIP 1102)
  window.addEventListener('message', event => {
    if (event.data && event.data.type === 'ETHEREUM_PROVIDER_SUCCESS') {
      // Set provider
      web3.setProvider(window.ethereum);
    }
  });
  window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, this.origin);
}
