
// set providor
web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545")); //8545 8080 10.10.42.116


// disconnect any meteor server
if(location.host !== 'localhost:3000' && location.host !== '127.0.0.1:3000')
    Meteor.disconnect();


// Set the default unit to ether
if(!LocalStore.get('etherUnit'))
    LocalStore.set('etherUnit', 'ether');


// Change the URLS to use #! instead of real paths
// Iron.Location.configure({useHashPaths: true});


var connect = function(){

    try {
        connectNode();

    } catch(e) {
        console.log(e);

        Meteor.startup(function(){
            // make sure the modal is rendered after all routes are executed
            Tracker.afterFlush(function(){
                Router.current().render('dapp_modal', {
                    to: 'modal',
                    data: {
                        closeable: false
                    }
                });
                Router.current().render('dapp_modal_question', {
                    to: 'modalContent',
                    data: {
                        text: new Spacebars.SafeString(TAPi18n.__('wallet.app.texts.connectionError', 
                            {node: 'geth --rpc --rpccorsdomain "'+window.location.protocol + '//' + window.location.host+'"'})), // --rpcaddr "localhost"
                        ok: function(){
                            Tracker.afterFlush(function(){
                                connect();
                            });
                        },
                        close: false
                    }
                });
            });
        });
    }
}
connect();
