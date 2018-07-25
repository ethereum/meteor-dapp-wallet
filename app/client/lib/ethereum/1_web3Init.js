if (window.ethereum) {
  web3 = new Web3(window.ethereum);
} else {
  // Use local websocket provider if available
  try {
    const provider = 'ws://localhost:8546';
    const socket = new WebSocket(provider);
    socket.addEventListener('open', event => {
      web3 = new Web3(provider);
    });
  } catch (error) {
    // Local provider is unavailable.
    // Request Ethereum Provider (EIP 1102)
    window.addEventListener('message', event => {
      if (event.data && event.data.type === 'ETHEREUM_PROVIDER_SUCCESS') {
        if (window.ethereum) {
          web3 = new Web3(provider);
        }
      }
    });
    window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, this.origin);
  }
}
