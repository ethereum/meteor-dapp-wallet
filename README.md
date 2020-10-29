# Ethereum Wallet Ðapp

The Ethereum Wallet Dapp is a dapp originally intended for use within the now-deprecated Mist Browser. There is also a web-hosted version on [https://wallet.ethereum.org](https://wallet.ethereum.org). This is hosted in order to enable users who created multisig wallets using Mist to continue to be able to manage them.

To use the web-hosted Wallet, you will need to locally run geth!

## Notices

Read all of these, please!

### Deprecation Notice

As of March, 2019, the Mist Browser and Meteor Dapp Wallet are deprecated software. 

Do not use this dapp to manage significant value! [Read this guide](https://medium.com/@wolovim/mist-migration-patterns-6bcf066ac383) and migrate to another wallet as soon as possible. You have been warned.

### General Warning Notice

This dapp and multisig smart contract can contain severe bugs!

### Ethereum Keys

Mist and Ethereum Dapp Wallet make use of encrypted Ethereum keys. You may have generated them w/ a password in Mist, MEW, MyCrypto, or even geth itself, but they must be present in order to access your accounts and multisigs in the web-hosted Ethereum Dapp Wallet. 

When you use the Wallet w/ geth, your keys are actually accessed by geth. Think of geth as your gateway to Ethereum mainnet, and Wallet -- even though it is in your browser -- is using geth to interact with your keys.

Understand where your keys are on your local disk, and back them up. Keep them secret! Keep them safe!


## Using the Ethereum Wallet Dapp

While Wallet is deprecated software, you can use the web-hosted [https://wallet.ethereum.org](https://wallet.ethereum.org) version if you are able to properly configure a local Ethereum node.

**First start a local geth node:**

```
   $ geth --syncmode "light" --rpc --rpccorsdomain "https://wallet.ethereum.org"
```

**Now open a non-Metamask browser to use the dapp**

Make sure Metamask isn't offering a connection to Ethereum mainnet when you use the dapp. In the future there may be a Metamask-enabled version release. For now, you must use your local geth's connection!

The best result so far is using Firefox w/o Metamask extension installed.

Go to [https://wallet.ethereum.org](https://wallet.ethereum.org).

## Developing the Ethereum Wallet Dapp

### Dependencies

To develop, build, and test out the Wallet, please use node v12.13 and meteor-build-client v0.4.0.

Also, download and install [Meteor](https://www.meteor.com/install).

```
    $ nvm use v12.13
    $ cd meteor-dapp-wallet/app
    $ npm install meteor-build-client@0.4.0
```

### Running the Wallet with Meteor

**First start a local geth node:**

```
    $ geth --syncmode "light" --rpccorsdomain "http://localhost:3000" --rpc
```

Regarding geth::

- The rpc flag opens a JSON-RPC service on port 8545.
- The rpccorsdomain flag enables the browser's javascript to make use of the JSON-RPC service opened by geth.


**Now start a local instance of the Wallet dapp using Meteor**

```
    $ cd meteor-dapp-wallet/app
    $ meteor
```

Then you can go to [http://localhost:3000](http://localhost:3000)


### Building with Meteor

To create a build version of your app run:
    
```
    // bundle dapp
    $ cd meteor-dapp-wallet/app
    $ node ./node_modules/meteor-build-client/main.js ../build --path ""
```

This will generate the files in the `../build` directory. Double click the index.html to start the app.
To make routing work properly you need to build it using:

```
    $ meteor-build-client ../build
```

Assuming you already have geth running, start a local server which points with its document root into the `../build` directory,
so that you can open the app using `http://localhost:8080/`

```
    $ cd build
    $ npx http-server ./
```

### Deploying to gh-pages

To deploy them to the **wallet.ethereum.org** site, execute these commands (from the app directory):

```
    git checkout gh-pages
    git merge develop
    cd app
    meteor-build-client ../build --path "/"
```

And push (or PR) your changes to the gh-pages branch.

## Additional Information

### Some gas usage statistics

- Deploy original wallet: 1 230 162
- Deploy wallet stub: 184 280
- Simple Wallet transaction: 64 280
- Multisig Wallet transaction below daily limit: 79 280
- Multisig Wallet transaction above daily limit: 171 096
- 1 Multisig confirmation: 48 363
