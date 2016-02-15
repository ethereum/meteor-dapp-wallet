
// Basic (local) collections, which will be observed by whisper (see whisperConnection.js)
// we use {connection: null} to prevent them from syncing with our not existing Meteor server


Wallets = new Mongo.Collection('wallets', {connection: null});
new PersistentMinimongo2(Wallets, 'ethereum_wallet');

CustomContracts = new Mongo.Collection('custom-contracts', {connection: null});
new PersistentMinimongo2(CustomContracts, 'ethereum_wallet');

// Contains the transactions
Transactions = new Mongo.Collection('transactions', {connection: null});
new PersistentMinimongo2(Transactions, 'ethereum_wallet');

// Contains the pending confirmations
PendingConfirmations = new Mongo.Collection('pending-confirmations', {connection: null});
new PersistentMinimongo2(PendingConfirmations, 'ethereum_wallet');

// Contains Coin Information
Tokens = new Mongo.Collection('tokens', {connection: null});
new PersistentMinimongo2(Tokens, 'ethereum_wallet');

// If on the mainnet, this will add the unicorn token by default, only once.
if (Session.get('network') == 'mainnet' && !localStorage.hasAddedUnicorn){
    localStorage.setItem('hasAddedUnicorn', true);

    unicornToken = '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7';
    tokenId = Helpers.makeId('token', unicornToken);
    Tokens.upsert(tokenId, {$set: {
        address: unicornToken,
        name: 'Unicorns',
        symbol: '🦄',
        balances: {},
        decimals: 0
    }});    
}

