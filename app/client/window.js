
$(window).on('blur', function(e){ 
    $('body').addClass('app-blur');
});
$(window).on('focus', function(e){ 
    $('body').removeClass('app-blur');
});


// add class to the header when scrolling
$(window).on('scroll', function() {
    var scrollPosition = $(window).scrollTop();
    
    if( scrollPosition > 150 ) {
        $('.dapp-sticky-bar').addClass('sticky');
        $('.dapp-header').addClass('dapp-small');        
    }  else if( scrollPosition > 48 ) {
        $('.dapp-header').addClass('dapp-small');
        $('.dapp-sticky-bar').removeClass('sticky');
    } else {
        $('.dapp-header').removeClass('dapp-small');
        $('.dapp-sticky-bar').removeClass('sticky');
    }
})