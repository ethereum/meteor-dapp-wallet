/**
Template Controllers

@module Templates
*/

/**
The address input template

@class [template] elements_input_address
@constructor
*/

Template['elements_input_address'].helpers({
    /**
    Add the attributes and merge the current context

    @method (attributes)
    @return {String}
    */
    'attributes': function() {
        var attr = _.clone(this);
        attr.class =  this.class ? this.class + ' abi-input' : 'abi-input';
        attr.placeholder = "0x123456...";
        attr.name = "elements_input_address";
        return attr;
    }
})