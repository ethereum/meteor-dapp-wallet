/**
Template Controllers

@module Routes
*/

/**
The app routes

@class App routes
@constructor
*/


// Change the URLS to use #! instead of real paths
// Iron.Location.configure({useHashPaths: true});


// Router defaults
Router.configure({
    layoutTemplate: 'layout_main',
    notFoundTemplate: 'layout_notFound',
    yieldRegions: {
        'layout_header': {to: 'header'}
    }
});


// ROUTES

/**
The receive route, showing the wallet overview

@method dashboard
*/
Router.route('/', {
    template: 'views_dashboard',
    name: 'dashboard'
});


/**
The send route.

@method send
*/
Router.route('/send', {
    template: 'views_send',
    name: 'send'
});




