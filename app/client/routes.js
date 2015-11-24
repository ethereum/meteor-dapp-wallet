// configure
BlazeLayout.setRoot('body');

FlowRouter.notFound = {
    action: function() {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'layout_notFound'
        });
    }
};

// redirect on start to dahsboard on file protocol
if(location.origin === 'file://') {
    FlowRouter.wait();
    FlowRouter.initialize({hashbang: true});

    Meteor.startup(function() {
        FlowRouter.go('dashboard');
    });
}


FlowRouter.triggers.enter([function(){
    EthElements.Modal.hide();
    $(window).scrollTop(0);
}, updateMistMenu]);



// ROUTES

/**
The receive route, showing the wallet overview

@method dashboard
*/
FlowRouter.route('/', {
    name: 'dashboard',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_dashboard'
        });
    }
});


/**
The send route.

@method send
*/
FlowRouter.route('/send', {
    name: 'send',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_send'
        });
    }
});

/**
The Coins route.

@method tokens
*/
FlowRouter.route('/tokens', {
    name: 'tokens',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_tokens'
        });
    }
});


/**
The Coins route.

@method tokens
*/
FlowRouter.route('/contracts', {
    name: 'contracts',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_contracts'
        });
    }
});



/**
The send route.

@method send
*/
FlowRouter.route('/send/:address', {
    name: 'sendTo',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_send'
        });
    }
});

/**
The send route.

@method send
*/
FlowRouter.route('/send-from/:from', {
    name: 'sendFrom',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_send'
        });
    }
});

/**
The send route.

@method send
*/
FlowRouter.route('/send-token/:from/:token', {
    name: 'sendToken',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_send'
        });
    }
});


/**
The send route.

@method send
*/
FlowRouter.route('/deploy-contract', {
    name: 'deployContract',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_send',
            data: {
                deployContract: true
            }
        });
    }
});


/**
The create account route.

@method send
*/
FlowRouter.route('/account/new', {
    name: 'createAccount',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_account_create'
        });
    }
});



/**
The account route.

@method send
*/
FlowRouter.route('/account/:address', {
    name: 'account',
    action: function(params, queryParams) {
        BlazeLayout.render('layout_main', {
            header: 'layout_header',
            main: 'views_account'
        });
    }
});

