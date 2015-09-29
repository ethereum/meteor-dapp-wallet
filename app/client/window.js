// disable pinch zoom gesture
document.addEventListener('mousewheel', function(e) {
    if(e.deltaY % 1 !== 0) {
        e.preventDefault();
    }
});

$(window).on('blur', function(e){ 
    $('body').addClass('app-blur');
});
$(window).on('focus', function(e){ 
    $('body').removeClass('app-blur');
});


// add class to the header when scrolling
$(window).on('scroll', function() {
    if($(window).scrollTop() > 35 ) {
        $('.dapp-header').addClass('dapp-small');
    } else {
        $('.dapp-header').removeClass('dapp-small');
    }
})