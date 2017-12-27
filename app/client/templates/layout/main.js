Template['layout_main'].onCreated(function(){
    var _pf=navigator.platform;

    console.log('_pf', _pf);

    var isMac = (_pf === "Mac68K") || (_pf === "MacPPC") || (_pf === "Macintosh") || (_pf === "MacIntel");

    TemplateVar.set('isMac', isMac);
});

Template['layout_main'].helpers({
    'isMac': function() {
        return TemplateVar.get('isMac');
    }
});