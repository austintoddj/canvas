(function(){
    // Link
    document.getElementsByTagName('body')[0]
        .insertAdjacentHTML('afterend',
                            '<a href="#!" id="scrollToTop">SCROLL TO TOP</a>');
    // Events
    document.getElementById('scrollToTop').onclick = function () {
        scrollTo(document.body, 0, 200);
        return false;
    }

    var scrollBtn = document.getElementById('scrollToTop'),
        bodyElem = document.body,
        distanceToTop = bodyElem.scrollTop;

    if(distanceToTop >= 800){
        scrollBtn.classList.remove('visible');
    }

    window.addEventListener('scroll', function(){
        distanceToTop = bodyElem.scrollTop;

        if (distanceToTop >= 800) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    function scrollTo(element, to, duration) {
        if (duration < 0) return;
        var difference = to - element.scrollTop;
        var perTick = difference / duration * 2;

    setTimeout(function() {
            element.scrollTop = element.scrollTop + perTick;
            scrollTo(element, to, duration - 2);
        }, 10);
    }
})();
