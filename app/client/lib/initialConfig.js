
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

Meteor.Spinner.options = {
    lines: 17, // The number of lines to draw
    length: 0, // The length of each line
    width: 4, // The line thickness
    radius: 16, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 1.7, // Rounds per second
    trail: 49, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
};


var connect = function(){

    try {
        connectToNode();

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
                            {node: 'geth --rpc --rpccorsdomain "'+window.location.protocol + '//' + window.location.host+'" --unlock <yourAccount>'})), // --rpcaddr "localhost"
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
Meteor.startup(function(){
    connect();
});
