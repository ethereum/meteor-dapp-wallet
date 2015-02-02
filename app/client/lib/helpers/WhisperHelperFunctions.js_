/**
Helper functions

@module Helpers
**/

/**
Whisper helper functions

@class Whisper
@constructor
**/

Whisper = {};


/**
Get the current selected identity e.g.

    {
        name: 'frozeman',
        identity: '0x54345345345..',
        selected: true
    }

@method getIdentity
*/
Whisper.getIdentity = function(){
    var identities = User.findOne().identities;
    return identity = _.find(identities, function(item){
        return item.selected;
    });
};