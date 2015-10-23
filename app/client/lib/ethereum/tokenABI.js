//"0x11485c5f164d6a67a72eee9093b2581d1c304094"

// Token Interface

var tokenABI = [
      {
        "type": "function",
        "name": "balanceOf",
        "constant": true,
        "inputs": [
          {
            "name": "receiver",
            "type": "address"
          }
        ],
        "outputs": [
          {
            "name": "balance",
            "type": "uint256"
          }
        ]
      },
      {
        "type": "function",
        "name": "transfer",
        "constant": false,
        "inputs": [
          {
            "name": "receiver",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint"
          }
        ],
        "outputs": [
          {
            "name": "sufficient",
            "type": "bool"
          }
        ]
      },
      {
        "type": "constructor",
        "inputs": [
          {
            "name": "supply",
            "type": "uint"
          }
        ]
      },
      {
        "name": "Transfer",
        "type": "event",
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "receiver",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ]
      }
];
TokenContract = web3.eth.contract(tokenABI);