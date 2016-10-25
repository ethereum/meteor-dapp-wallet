var _createLog = function(coll) {
    return function(msg) {
        console.log('[PORT DATA ' + coll._name + ']: ' + msg);
    };
}


assignUnassignedCollectionDataToNetwork = function(coll, networkId, checkFunction) {
    var _log = _createLog(coll);
    
    _log('Check if there are items not assigned to a network...');
    
    setTimeout(function() {
        // load Contracts which aren't assigned to a network
        var old = coll.find({
            network: { 
              $in: [null, undefined] 
            }         
        });
        
        old.forEach(function(item) {   
            if (checkFunction(item, networkId)) {
                _log('Assigning item ' + item._id + ' to network ' + networkId);
                
                coll.update({ _id: item._id }, { 
                    $set: {
                        network: networkId
                    }
                });                
            } else {
                _log('Item ' + item._id + ' does not belong to network ' + networkId);
            }
        });

        _log('...done checking to see if there are items not assigned to a network.');
    }, 2000);    
}

