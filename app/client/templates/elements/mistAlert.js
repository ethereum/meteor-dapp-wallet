
var alertKey = 'alert_20171104-hidden';
Template['mist_alert'].onRendered(function(){
    TemplateVar.set('hidden', localStorage.getItem(alertKey));
});

Template['mist_alert'].helpers({
    alertViewState: function() {
      return (!!TemplateVar.get('hidden'))? 'is-hidden' : '';
    },
    bubbleViewState: function() {
      return (!TemplateVar.get('hidden'))? 'is-hidden' : '';
    }
});

Template['mist_alert'].events({
    'click .hide-alert': function() {
      localStorage.setItem(alertKey, true);
      TemplateVar.set('hidden', localStorage.getItem(alertKey));
    },

    'click .show-alert button': function() {
      localStorage.setItem(alertKey, '');
      TemplateVar.set('hidden', localStorage.getItem(alertKey));
    }
});
