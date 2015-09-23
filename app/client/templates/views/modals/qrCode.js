/**
The template to display qrCode.

@class [template] views_account
@constructor
*/


Template['views_modals_qrCode'].onRendered(function(){
    var address = FlowRouter.getParam('address');
    if(address) {
        var qrcodesvg = new Qrcodesvg( address, 'qrcode', 150, {"ecclevel" : 1});
        qrcodesvg.draw({"method": "classic", "fill-colors":["#555","#555","#666"]}, {"stroke-width":1});
    }
});