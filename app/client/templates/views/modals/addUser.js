/**
Template Controllers

@module Templates
*/

/**
The add user template

@class [template] view_modals_addUser
@constructor
*/

Template['view_modals_addUser'].onCreated(function(){
    TemplateVar.set('invitedUsers', []);
});


Template['view_modals_addUser'].helpers({
    /**
    List the users you're following

    @method (following)
    */
    'following': function(){
        var user = User.findOne();

        if(user && _.isArray(user.following))
            return Users.find({_id: {$in: user.following}});
    },
    /**
    Highlight invited people

    @method (isInvited)
    */
    'isInvited': function(){
        return _.contains(TemplateVar.get('invitedUsers'), this.identity);
    },
    /**
    Return true if no user is selected

    @method (noneSelected)
    @return {Boolean}
    */
    'noneSelected': function() {
        return _.isEmpty(TemplateVar.get('invitedUsers'));
    },
    /**
    Show either the ok or invite users button text

    @method (inviteButtonText)
    */
    'inviteButtonText': function(){
        var selectedUsers = TemplateVar.get('invitedUsers');

        if(_.isEmpty(selectedUsers))
            return TAPi18n.__('buttons.ok');
        else if(selectedUsers.length === 1 && Router.current().route.getName() === 'createChat')
            return TAPi18n.__('whisper.app.buttons.startPrivateChat');
        else
            return TAPi18n.__('whisper.app.buttons.inviteUsers');
    }
});

Template['view_modals_addUser'].events({
    /**
    Select the whole text of the input

    @event click input[type="text"]
    */
    'click input[type="text"]': function(e){
        $(e.currentTarget).focus().select();
    },
    /**
    Prevent the user icon link to be executed

    @event click .whisper-user-list button a
    */
    'click .whisper-user-list button a': function(e){
        e.preventDefault();
    },
    /**
    Add a user to the invitation queue

    @event click .whisper-user-list button
    */
    'click .whisper-user-list button': function(e){

        var list = TemplateVar.get('invitedUsers');
        // add or remove from the list
        if(_.contains(list, this.identity))
            list = _.without(list, this.identity);
        else
            list.push(this.identity);
        TemplateVar.set('invitedUsers', list);
    },
    /**
    Send invites and close the window

    @event click button.invite
    */
    'click button.invite': function(e, template){
        var invitedUsers = TemplateVar.get('invitedUsers');
        
        // invite users
        if(!_.isEmpty(invitedUsers)) {

            // PRIVATE CHAT
            if(invitedUsers.length === 1 &&
               Router.current().route.getName() === 'createChat') {
                
                // remove current chat
                if(_.isEmpty(template.data.messages))
                    Chats.remove(template.data._id);

                // create new private one and go there
                Router.go('chat', {sessionKey: invitedUsers[0]});


            // GROUP CHAT
            } else {

                // check if currently in a private chat, if so generate a new one

                // send invite messages
                _.each(invitedUsers, function(user){

                    Invitations.insert({
                        type: 'invite',
                        chat: template.data._id,
                        name: template.data.name,
                        timestamp: moment().unix(),
                        from: {
                            identity: Whisper.getIdentity().identity,
                            name: Whisper.getIdentity().name
                        },
                        to: user,
                        // the list of users
                        data: _.map(invitedUsers, function(item) {
                            var user = Users.findOne(item);
                            return {
                                identity: user.identity,
                                name: user.name
                            };
                        })
                    });
                });

                // SEND the INVITATION NOTIFICATION
                if(Whisper.addMessage(template.data._id, {
                    sending: true,
                    type: 'notification',
                    message: 'invitation',
                    timestamp: moment().unix(),
                    from: {
                        identity: Whisper.getIdentity().identity,
                        name: Whisper.getIdentity().name
                    },
                    // the list of users
                    data: _.map(invitedUsers, function(item) {
                        var user = Users.findOne(item);
                        return {
                            identity: user.identity,
                            name: user.name
                        };
                    })
                })) {

                    // add the invited users to the chat as well
                    Chats.update(template.data._id, {
                        $set: {users: invitedUsers}
                    });
                }


                // redirect
                Router.go('chat', {sessionKey: template.data._id});
            }


        // if nobody was explicityly invited, just redirect
        } else {
            Router.go('chat', {sessionKey: template.data._id});
        }

    }
});
