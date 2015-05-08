
// Basic (local) collections, which will be observed by whisper (see whisperConnection.js)
// we use {connection: null} to prevent them from syncing with our not existing Meteor server

// contains blockchain meta data
Blockchain = new Mongo.Collection('blockchain', {connection: null});
Blockchain.insert({
    blockNumber: 0
});

// Contains the accounts
Accounts = new Mongo.Collection('accounts', {connection: null});
new PersistentMinimongo(Accounts);

// Contains the transactions
Transactions = new Mongo.Collection('transactions', {connection: null});
new PersistentMinimongo(Transactions);