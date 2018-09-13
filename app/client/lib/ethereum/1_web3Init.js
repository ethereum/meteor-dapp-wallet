if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  // Enable full provider
  window.ethereum.enable();
} else {
  // Use local websocket provider
  web3 = new Web3('ws://localhost:8546');
}
