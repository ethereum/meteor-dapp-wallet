
// Basic (local) collections, which will be observed by whisper (see whisperConnection.js)
// we use {connection: null} to prevent them from syncing with our not existing Meteor server



Wallets = new Mongo.Collection('wallets', {connection: null});
new PersistentMinimongo2(Wallets, 'ethereum_wallet');
Wallets = new NetworkInfo.ProxyCollection(Wallets);

CustomContracts = new Mongo.Collection('custom-contracts', {connection: null});
new PersistentMinimongo2(CustomContracts, 'ethereum_wallet');
CustomContracts = new NetworkInfo.ProxyCollection(CustomContracts);

// Contains the transactions
Transactions = new Mongo.Collection('transactions', {connection: null});
new PersistentMinimongo2(Transactions, 'ethereum_wallet');
Transactions = new NetworkInfo.ProxyCollection(Transactions);

// Contains the pending confirmations
PendingConfirmations = new Mongo.Collection('pending-confirmations', {connection: null});
new PersistentMinimongo2(PendingConfirmations, 'ethereum_wallet');
PendingConfirmations = new NetworkInfo.ProxyCollection(PendingConfirmations);

// Contains the custom contract events
Events = new Mongo.Collection('events', {connection: null});
new PersistentMinimongo2(Events, 'ethereum_wallet');
Events = new NetworkInfo.ProxyCollection(Events);

// Contains Coin Information
Tokens = new Mongo.Collection('tokens', {connection: null});
new PersistentMinimongo2(Tokens, 'ethereum_wallet');
Tokens = new NetworkInfo.ProxyCollection(Tokens);

// as soon as we know what network we're on let's port old data over
NetworkInfo.promise.then(function() {
    // load Contracts which aren't assigned to a network
    var contracts = Contract._coll.find({
        network: { 
          $in: [null, undefined] 
        }         
    });
    
    contracts.forEach(function(contract) {
        // if code found on current network
        if ("0x" !== web3.eth.getCode(contract.address)) {
            console.log('Assigning contract ' + contract._id + ' at address ' + contract.address ' to current network');
            
            // update it (and assign network)
            Contract.update({ _id: contract._id }, { address: contract.address });
        }
    });
});
