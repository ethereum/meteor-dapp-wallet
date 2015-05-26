
// Basic (local) collections, which will be observed by whisper (see whisperConnection.js)
// we use {connection: null} to prevent them from syncing with our not existing Meteor server

// contains blockchain meta data
Blockchain = new Mongo.Collection('blockchain', {connection: null});
new PersistentMinimongo(Blockchain);
if(!Blockchain.findOne('latest'))
    Blockchain.insert({
        _id: 'latest',
        blockNumber: 0,
        gasPrice: 0,
        checkpoint: 0
    })


// Contains the accounts
Accounts = new Mongo.Collection('accounts', {connection: null});
new PersistentMinimongo(Accounts);

// Contains the transactions
Transactions = new Mongo.Collection('transactions', {connection: null});
new PersistentMinimongo(Transactions);

// Contains the pending confirmations
PendingConfirmations = new Mongo.Collection('pending-confirmations', {connection: null});
new PersistentMinimongo(PendingConfirmations);