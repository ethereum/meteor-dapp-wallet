var walletABI = [
    {
        "name":"confirm",
        "type":"function",
        "constant":false,
        "inputs":[
            {"name":"_h","type":"hash256"}
        ],
        "outputs":[]
    },{
        "name":"execute",
        "constant":false,
        "type":"function",
        "inputs":[
            {"name":"_to","type":"address"},
            {"name":"_value","type":"uint256"},
            {"name":"_data","type":"bytes"}
        ],
        "outputs":[
            {"name":"_r","type":"hash256"}
        ]
    },{
        "name":"kill",
        "type":"function",
        "constant":false,
        "inputs":[
            {"name":"_to","type":"address"}
        ],
        "outputs":[]
    },{
        "name":"changeOwner",
        "type":"function",
        "constant":false,
        "inputs":[
            {"name":"_from","type":"address"},
            {"name":"_to","type":"address"}
        ],
        "outputs":[]
    },{
        "name":"CashIn",
        "type":"event",
        "inputs":[
            {"indexed":false,"name":"value","type":"uint256"}
        ]
    },{
        "name":"SingleTransact",
        "type":"event",
        "inputs":[
            {"indexed":true,"name":"out","type":"string32"},
            {"indexed":false,"name":"owner","type":"address"},
            {"indexed":false,"name":"value","type":"uint256"},
            {"indexed":false,"name":"to","type":"address"}
        ]
    },{
        "name":"MultiTransact",
        "type":"event",
        "inputs":[
            {"indexed":true,"name":"out","type":"string32"},
            {"indexed":false,"name":"owner","type":"address"},
            {"indexed":false,"name":"operation","type":"hash256"},
            {"indexed":false,"name":"value","type":"uint256"},
            {"indexed":false,"name":"to","type":"address"}
        ]
    }
];

if(_.isArray(web3.eth.accounts)) {

    _.each(web3.eth.accounts, function(address) {
        
        // SETUP accounts
        if(!Accounts.findOne(address)) {
            Accounts.insert({
                _id: address,
                name: null,
                balance: web3.toDecimal(web3.eth.balanceAt(address))
            });
        }

        // look for balance changes
        Meteor.setInterval(function(){
            Accounts.update(address, {$set: {
                balance: web3.toDecimal(web3.eth.balanceAt(address))
            }});
        }, 1000);


        // start WATCH for transactions
        var walletContract = web3.eth.contract(address, walletABI);

        // single transactions
        var singleTxWatcher = walletContract.SingleTransact(),
            transactionCallback = function(result) {
                console.log('transaction arrived', result);
                Transactions.insert(result);
            };

        var pastSingleTransactions = singleTxWatcher.logs();
        if(_.isArray(pastSingleTransactions)) {
            _.each(pastSingleTransactions, transactionCallback);
        }

        singleTxWatcher.changed(transactionCallback);

        // multisig transactions
        var multiTxWatcher = walletContract.MultiTransact(),
            transactionCallback = function(result) {
                console.log('transaction arrived', result);
                Transactions.insert(result);
            };

        var pastMultiTransactions = multiTxWatcher.logs();
        if(_.isArray(pastMultiTransactions)) {
            _.each(pastMultiTransactions, transactionCallback);
        }

        multiTxWatcher.changed(transactionCallback);
    });

}

