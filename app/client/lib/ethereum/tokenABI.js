//"0x11485c5f164d6a67a72eee9093b2581d1c304094"

// Token Interface

var tokenABI = [
    {
        "type": "function",
        "name": "name",
        "constant": true,
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ]
    },
    {
        "type": "function",
        "name": "decimals",
        "constant": true,
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ]
    },
    {
        "type": "function",
        "name": "balanceOf",
        "constant": true,
        "inputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "type": "function",
        "name": "symbol",
        "constant": true,
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ]
    },
    {
        "type": "function",
        "name": "transfer",
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "outputs": []
    },
    {
        "type": "constructor",
        "inputs": [
            {
                "name": "_supply",
                "type": "uint256"
            },
            {
                "name": "_name",
                "type": "string"
            },
            {
                "name": "_decimals",
                "type": "uint8"
            },
            {
                "name": "_symbol",
                "type": "string"
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