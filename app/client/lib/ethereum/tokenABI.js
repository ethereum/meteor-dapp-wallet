//"0x11485c5f164d6a67a72eee9093b2581d1c304094"

// Token Interface

var tokenABI = [
      {
        "type": "function",
        "name": "balanceOf",
        "constant": true,
        "inputs": [
          {
            "name": "address",
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
            "name": "to",
            "type": "address"
          },
          {
            "name": "value",
            "type": "uint256"
          }
        ],
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ]
      },
      {
          "constant": true,
          "inputs": [],
          "name": "decimals",
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
          "name": "name",
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
          "name": "symbol",
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
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ]
      }
];

TokenContract = web3.eth.contract(tokenABI);