// disconnect any meteor server
if(location.hostname !== 'localhost' && location.hostname !== '127.0.0.1')
    Meteor.disconnect();


// Make sure the example contract code is up to date
var contractSource = localStorage.getItem('contractSource');

if (contractSource  // repopulate placeholder contract if:
    && (contractSource === ""  // source is empty or
    || (contractSource.indexOf(Helpers.getDefaultContractExample(true)) !== -1)  // default 'MyContract' exists and
    && contractSource.split('contract ').length-1 === 1)) {  // 'MyContract' is the only contract
    localStorage.setItem('contractSource', Helpers.getDefaultContractExample());
}
 

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
    zIndex: 10, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
};



// Stop app operation, when the node is syncing
web3.eth.isSyncing(function(error, syncing) {
    if(!error) {

        if(syncing === true) {
            console.time('nodeRestarted')
            console.log('Node started syncing, stopping app operation');
            web3.reset(true);

            // clear observers
            _.each(collectionObservers, function(observer) {
                if(observer)
                    observer.stop();
            });
            collectionObservers = [];

        
        } else if(_.isObject(syncing)) {
            
            syncing.progress = Math.floor(((syncing.currentBlock - syncing.startingBlock) / (syncing.highestBlock - syncing.startingBlock)) * 100);
            syncing.blockDiff = numeral(syncing.highestBlock - syncing.currentBlock).format('0,0');

            TemplateVar.setTo('header nav', 'syncing', syncing);
            
        } else {
            console.timeEnd('nodeRestarted')            
            console.log('Restart app operation again');

            TemplateVar.setTo('header nav', 'syncing', false);

            // re-gain app operation
            connectToNode();
        }
    }
});


var connect = function(){

    if(web3.isConnected()) {

        // only start app operation, when the node is not syncing (or the eth_syncing property doesn't exists)
        web3.eth.getSyncing(function(e, sync) {
            if(e || !sync) {
                connectToNode();
            } else {
                EthAccounts.init();
            }
        });

    } else {

        // make sure the modal is rendered after all routes are executed
        Meteor.setTimeout(function(){
            // if in mist, tell to start geth, otherwise start with RPC
            var gethRPC = (web3.admin) ? 'geth' : 'geth --rpc --rpccorsdomain "'+window.location.protocol + '//' + window.location.host+'"';

            EthElements.Modal.question({
                text: new Spacebars.SafeString(TAPi18n.__('wallet.app.texts.connectionError' + (web3.admin ? 'Mist' : 'Browser'), 
                    {node: gethRPC})),
                ok: function(){
                    Tracker.afterFlush(function(){
                        connect();
                    });
                }
            }, {
                closeable: false
            });

        }, 600);
    }
}
Meteor.startup(function(){
    // delay so we make sure the data is already loaded from the indexedDB
    // TODO improve persistent-minimongo2 ?
    Meteor.setTimeout(function() {
        connect();
    }, 3000);
});
