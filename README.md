# Ethereum Wallet Ðapp

The Ethereum wallet.

[![Build Status](https://travis-ci.org/ethereum/meteor-dapp-wallet.svg?branch=master)](https://travis-ci.org/ethereum/meteor-dapp-wallet)

**NOTE** The wallet is not yet official released,
can contain severe bugs!


## Development

Start an `geth` node and and the app using meteor and open http://localhost:3000 in your browser:

    $ geth --rpccorsdomain "http://localhost:3000" --rpc --unlock <your account>

Starting the wallet dapp using [Meteor](https://meteor.com/install)

    $ cd meteor-dapp-wallet/app
    $ meteor

Go to http://localhost:3000


## Deployment

To create a build version of your app run:
    
    // install meteor-build-client
    $ npm install -g meteor-build-client

    // bundle dapp
    $ cd meteor-dapp-wallet/app
    $ meteor-build-client ../build --path ""

This will generate the files in the `../build` folder. Double click the index.html to start the app.
To make routing work properly you need to build it using:

    $ meteor-build-client ../build

And start a local server which points with its document root into the `../build` folder,
so that you can open the app using `http://localhost:80/`

To deploy them to the **wallet.ethereum.org** site, execute these commands (from the app folder):

    git checkout gh-pages
    git merge develop
    cd app
    meteor-build-client ../build --path "/"
          
And push (or PR) your changes to the gh-pages branch.


***

## Gas usage statistics

- Deploy original wallet: 1 230 162
- Deploy wallet stub: 184 280
- Simple Wallet transaction: 64 280
- Multisig Wallet transaction below daily limit: 79 280
- Multisig Wallet transaction above daily limit: 171 096
- 1 Multisig confirmation: 48 363
