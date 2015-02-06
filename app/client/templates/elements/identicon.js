/**
Template Controllers

@module Templates
*/

/**
Return the user identity icon

@class [template] elements_identicon
@constructor
*/


Template['elements_identicon'].helpers({
    /**
    The current users identity

    @method identity
    */
    'identity': function(e){
        return this.identity || 'hj'; // hj creates a nice icon with person
    }
});