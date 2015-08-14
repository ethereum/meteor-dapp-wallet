# Wallet Ðapp

The ethereum wallet Ðapp.

**NOTE** The wallet is not yet official released,
can contain severe bugs and shouldn't be used to store any real value!

## Gas usage statistics

- Deploy original wallet: 1 230 162
- Deploy wallet stub: 184 280
- Simple Wallet transaction: 64 280
- Multisig Wallet transaction below daily limit: 79 280
- Multisig Wallet transaction above daily limit: 171 096
- 1 Multisig confirmation: 48 363


## Development

Start an `geth` node and and the app using meteor and open http://localhost:3000 in your browser:

    $ geth --rpccorsdomain "http://localhost:3000" --rpc --unlock <your account>

Clone/Update the [dapp-styles](https://github.com/ethereum/dapp-styles) in the `meteor-dapp-wallet/app/public/dapp-styles` folder.

Starting the wall dapp using meteor

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



