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
            "type": "uint256"
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
          "constant": true,
          "inputs": [],
          "name": "tokenDecimals",
          "outputs": [
              {
                  "name": "",
                  "type": "uint8"
              }
          ],
          "type": "function"
      },
      {
          "constant": true,
          "inputs": [],
          "name": "tokenName",
          "outputs": [
              {
                  "name": "",
                  "type": "string"
              }
          ],
          "type": "function"
      },
      {
          "constant": true,
          "inputs": [],
          "name": "tokenSymbol",
          "outputs": [
              {
                  "name": "",
                  "type": "string"
              }
          ],
          "type": "function"
      },
      {
        "type": "constructor",
        "inputs": [
          {
            "name": "supply",
            "type": "uint256"
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