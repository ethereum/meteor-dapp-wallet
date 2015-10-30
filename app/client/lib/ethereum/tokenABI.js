//"0x11485c5f164d6a67a72eee9093b2581d1c304094"

// Token Interface
// var tokenABI = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"receiver","type":"address"}],"name":"balanceof","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"receiver","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"sufficient","type":"bool"}],"type":"function"},{"inputs":[{"name":"supply","type":"uint256"}],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"sender","type":"address"},{"indexed":false,"name":"receiver","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Transfer","type":"event"}];


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