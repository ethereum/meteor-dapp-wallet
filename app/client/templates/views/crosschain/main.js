/**
 Template Controllers
 @module Templates
 */

Template['views_crosschain_main'].onRendered(function(){
    Session.set('clickButton', 1);
});

Template['views_crosschain_main'].events({

    /**
     Clicking the name, will make it editable
     @event click .edit-name
     */

    'click .history': function (e) {
        Session.set('clickButton', 1);
    },

    'click .toWeth': function (e) {

        var addressList = Session.get('addressList');
        if (addressList.length) {
            Session.set('clickButton', 2);
        } else {
            Session.set('clickButton', 1);
        }
    },

    'click .toWan': function (e) {

        var addressList = Session.get('addressList');
        // console.log('ethList', ethList);
        if (addressList.length) {
            Session.set('clickButton', 3);
        } else {
            Session.set('clickButton', 1);
        }
    },

    'click .toNormal': function (e) {

        var addressList = Session.get('addressList');
        // console.log('ethList', ethList);
        if (addressList.length) {
            Session.set('clickButton', 4);
        } else {
            Session.set('clickButton', 1);
        }
    }
});

