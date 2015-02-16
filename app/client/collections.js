
// Basic (local) collections, which will be observed by whisper (see whisperConnection.js)
// we use {connection: null} to prevent them from syncing with our not existing Meteor server

// Contains the accounts
Accounts = new Mongo.Collection('accounts', {connection: null});
new PersistentMinimongo(Accounts);


// Contains the transactions
Transactions = new Mongo.Collection('transactions', {connection: null});