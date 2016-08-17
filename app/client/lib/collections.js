
// Basic (local) collections, which will be observed by whisper (see whisperConnection.js)
// we use {connection: null} to prevent them from syncing with our not existing Meteor server


Wallets = new NetworkInfo.ProxyCollection(
  new Mongo.Collection('wallets', {connection: null})
);
new PersistentMinimongo2(Wallets, 'ethereum_wallet');

CustomContracts = new NetworkInfo.ProxyCollection(
  new Mongo.Collection('custom-contracts', {connection: null})
);
new PersistentMinimongo2(CustomContracts, 'ethereum_wallet');

// Contains the transactions
Transactions = new NetworkInfo.ProxyCollection(
  new Mongo.Collection('transactions', {connection: null})
);
new PersistentMinimongo2(Transactions, 'ethereum_wallet');

// Contains the pending confirmations
PendingConfirmations = new NetworkInfo.ProxyCollection(
  new Mongo.Collection('pending-confirmations', {connection: null})
);
new PersistentMinimongo2(PendingConfirmations, 'ethereum_wallet');

// Contains the custom contract events
Events = new NetworkInfo.ProxyCollection(
  new Mongo.Collection('events', {connection: null})
);
new PersistentMinimongo2(Events, 'ethereum_wallet');

// Contains Coin Information
Tokens = new NetworkInfo.ProxyCollection(
  new Mongo.Collection('tokens', {connection: null})
);
new PersistentMinimongo2(Tokens, 'ethereum_wallet');


