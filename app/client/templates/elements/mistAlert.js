
var alertKey = 'alert_20171104-hidden';
console.log('mistAlert started');
Template['mist_alert'].onRendered(function(){
    console.log(window.navigator, window.navigator.userAgent);

    TemplateVar.set('hidden', localStorage.getItem(alertKey));
    console.log(TemplateVar.get('hidden'));
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
