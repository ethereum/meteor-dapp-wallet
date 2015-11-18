

Template['elements_input_address'].helpers({
    /**
    Concatenate the class

    @method (getClass)
    @return {String}
    */
    'getClass': function() {
        return this.class ? this.class + ' abi-input' : 'abi-input';
    }
})