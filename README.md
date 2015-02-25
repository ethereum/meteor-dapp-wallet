# Wallet Ðapp

## Development

Start an eth node open the http://localhost:3000 in *mist*, *mix* or *alethzero* or run a CPP node as follows:

    $ eth -j -b // for a mining node: $ eth -j -b -f -n no -m yes

Start your app using meteor

    $ cd ethereum-dapp-whisper-client/app
    $ meteor

Go to http://localhost:3000


## Deployment

To create a build version of your app run:

    $ meteor build ../dist
    $ cd ../dist
    $ tar zxvf app.tar.gz

Copy the `app` folder, *.js and *.css from `bundle/programs/web.browser/`
to your dist folder and ... The rest has to figured out yet, depending on the Mist/Swarm hosting



