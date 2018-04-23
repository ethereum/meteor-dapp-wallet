/**
 Template Controllers
 @module Templates
 */

Template['views_crosschain_main'].onRendered(function(){
    TemplateVar.set('clickButton', 1);
});

Template['views_crosschain_main'].events({

    /**
     Clicking the name, will make it editable
     @event click .edit-name
     */

    'click .history': function (e) {

        TemplateVar.set('clickButton', 1);
    },

    'click .toWeth': function (e) {

        TemplateVar.set('clickButton', 2);
    },

    'click .toWan': function (e) {

        TemplateVar.set('clickButton', 3);
    },

    'click .toNormal': function (e) {

        TemplateVar.set('clickButton', 4);
    }
});

