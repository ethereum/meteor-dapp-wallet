if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  // Request accounts
  ethereum.send('eth_requestAccounts');
} else {
  // Use local websocket provider
  web3 = new Web3('ws://localhost:8546');
}
