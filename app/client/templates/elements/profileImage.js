/**
Template Controllers

@module Templates
*/

/**
Return the user identity icon

@class [template] elements_profileImage
@constructor
*/


Template['elements_profileImage'].helpers({
    /**
    The current users identity

    @method identity
    */
    'identity': function(e){
        return this.identity || 'hj'; // hj creates a nice icon with person
    }
});