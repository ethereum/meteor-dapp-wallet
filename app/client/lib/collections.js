
// Basic (local) collections, which will be observed by whisper (see whisperConnection.js)
// we use {connection: null} to prevent them from syncing with our not existing Meteor server



Wallets = new Mongo.Collection('wallets', {connection: null});
new PersistentMinimongo2(Wallets, 'ethereum_wallet');
Wallets = new NetworkInfo.ProxyCollection(Wallets, {
    portOldData: true
});

CustomContracts = new Mongo.Collection('custom-contracts', {connection: null});
new PersistentMinimongo2(CustomContracts, 'ethereum_wallet');
CustomContracts = new NetworkInfo.ProxyCollection(CustomContracts, {
    portOldData: true
});

// Contains the transactions
Transactions = new Mongo.Collection('transactions', {connection: null});
new PersistentMinimongo2(Transactions, 'ethereum_wallet');
Transactions = new NetworkInfo.ProxyCollection(Transactions, {
    portOldData: true
});

// Contains the pending confirmations
PendingConfirmations = new Mongo.Collection('pending-confirmations', {connection: null});
new PersistentMinimongo2(PendingConfirmations, 'ethereum_wallet');
PendingConfirmations = new NetworkInfo.ProxyCollection(PendingConfirmations, {
    portOldData: true
});

// Contains the custom contract events
Events = new Mongo.Collection('events', {connection: null});
new PersistentMinimongo2(Events, 'ethereum_wallet');
Events = new NetworkInfo.ProxyCollection(Events, {
    portOldData: true
});

// Contains Coin Information
Tokens = new Mongo.Collection('tokens', {connection: null});
new PersistentMinimongo2(Tokens, 'ethereum_wallet');
Tokens = new NetworkInfo.ProxyCollection(Tokens, {
    portOldData: true
});
