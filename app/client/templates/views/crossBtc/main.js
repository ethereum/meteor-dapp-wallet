/**
 Template Controllers
 @module Templates
 */

Template['views_crosschain_btc_main'].onRendered(function(){
    Session.set('clickButton', 1);
});

Template['views_crosschain_btc_main'].events({

    /**
     Clicking the name, will make it editable
     @event click .edit-name
     */

    'click .history': function (e) {
        Session.set('clickButton', 1);
    },

    'click .toWeth': function (e) {
        Session.set('clickButton', 2);
    },

    'click .toWan': function (e) {
        Session.set('clickButton', 3);
    },

    'click .toNormal': function (e) {
        Session.set('clickButton', 4);
    }
});

