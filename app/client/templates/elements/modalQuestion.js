/**
Template Controllers

@module Templates
*/

/**
The modal question template. It can receive an ok and cancel function,
which will be execited if the ok or cancel button is pressed.

After any of the buttons is pressed the modal, will disappear.

The data context for this modal should look as follows:

    {
        text: 'Do you really want to do this?',
        ok: function(){
            // do something on ok
        },
        cancel: function(){
            // do something on cancel
        }
    }

@class [template] elements_modal_question
@constructor
*/

Template['elements_modal_question'].helpers({
    /**
    Check if the `ok` property is present, without executing it yet.

    @method (hasOk)
    */
    'hasOk': function(){
        return (this.ok);
    },
    /**
    Check if the `cancel` property is present, without executing it yet.

    @method (hasCancel)
    */
    'hasCancel': function(){
        return (this.cancel);
    }
});


Template['elements_modal_question'].events({
    /**
    When the confirm button is clicked, execute the given ok() function.

    @event click  button.ok
    */
    'click button.ok': function(e){
        if(_.isFunction(this.ok))
            this.ok();

        // hide the modal
        Router.current().render(null, {to: 'modal'});
    },
    /**
    When the confirm button is clicked, execute the given cancel() function.

    @event click  button.cancel
    */
    'click button.cancel': function(e){
        if(_.isFunction(this.cancel))
            this.cancel();

        // hide the modal
        Router.current().render(null, {to: 'modal'});
    }
});