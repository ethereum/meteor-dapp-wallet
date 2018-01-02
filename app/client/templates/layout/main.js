Template['layout_main'].onCreated(function(){
    var _pf=navigator.platform;

    console.log('_pf', _pf);

    var isMac =  false;

    if (_pf.match(/mac/i))
        isMac = true;

    TemplateVar.set('isMac', isMac);
});

Template['layout_main'].helpers({
    'isMac': function() {
        return TemplateVar.get('isMac');
    }
});