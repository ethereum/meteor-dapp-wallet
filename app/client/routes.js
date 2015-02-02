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
        'views_chats_aside': {to: 'aside'}
    }
});


// ROUTES

/**
The default route, will redirect to the public stream.

TODO: in the future this will be the chats/public route

@method home
*/
Router.route('/', {
    template: 'views_home',
    name: 'home'
});


