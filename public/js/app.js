/*
 * Detect Mobile Browser
 */
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
   $('html').addClass('ismobile');
}

$(window).load(function () {

    /* --------------------------------------------------------
     Page Loader
     -----------------------------------------------------------*/
    if(!$('html').hasClass('ismobile')) {
        if($('.page-loader')[0]) {
            setTimeout (function () {
                $('.page-loader').fadeOut();
            }, 500);

        }
    }
})

$(document).ready(function(){
    /* --------------------------------------------------------
        Layout
    -----------------------------------------------------------*/
    (function () {

        //Get saved layout type from LocalStorage
        var layoutStatus = localStorage.getItem('ma-layout-status');

        if(!$('#header-2')[0]) {  //Make it work only on normal headers
            if (layoutStatus == 1) {
                $('body').addClass('sw-toggled');
                $('#tw-switch').prop('checked', true);
            }
        }

        $('body').on('change', '#toggle-width input:checkbox', function () {
            if ($(this).is(':checked')) {
                setTimeout(function () {
                    $('body').addClass('toggled sw-toggled');
                    localStorage.setItem('ma-layout-status', 1);
                }, 250);
            }
            else {
                setTimeout(function () {
                    $('body').removeClass('toggled sw-toggled');
                    localStorage.setItem('ma-layout-status', 0);
                }, 250);
            }
        });
    })();

    /* --------------------------------------------------------
        Scrollbar
    -----------------------------------------------------------*/
    function scrollBar(selector, theme, mousewheelaxis) {
        $(selector).mCustomScrollbar({
            theme: theme,
            scrollInertia: 100,
            axis:'yx',
            mouseWheel: {
                enable: true,
                axis: mousewheelaxis,
                preventDefault: true
            }
        });
    }

    if (!$('html').hasClass('ismobile')) {
        //On Custom Class
        if ($('.c-overflow')[0]) {
            scrollBar('.c-overflow', 'minimal-dark', 'y');
        }
    }

    /*
     * Top Search
     */
    (function(){
        $('body').on('click', '#top-search > a', function(e){
            e.preventDefault();

            $('#header').addClass('search-toggled');
            $('#top-search-wrap input').focus();
        });

        $('body').on('click', '#top-search-close', function(e){
            e.preventDefault();

            $('#header').removeClass('search-toggled');
        });
    })();

    /*
     * Sidebar
     */
    (function(){
        //Toggle
        $('body').on('click', '#menu-trigger, #chat-trigger', function(e){
            e.preventDefault();
            var x = $(this).data('trigger');

            $(x).toggleClass('toggled');
            $(this).toggleClass('open');

    	    //Close opened sub-menus
    	    $('.sub-menu.toggled').not('.active').each(function(){
        		$(this).removeClass('toggled');
        		$(this).find('ul').hide();
    	    });



	    $('.profile-menu .main-menu').hide();

            if (x == '#sidebar') {

                $elem = '#sidebar';
                $elem2 = '#menu-trigger';

                $('#chat-trigger').removeClass('open');

                if (!$('#chat').hasClass('toggled')) {
                    $('#header').toggleClass('sidebar-toggled');
                }
                else {
                    $('#chat').removeClass('toggled');
                }
            }

            if (x == '#chat') {
                $elem = '#chat';
                $elem2 = '#chat-trigger';

                $('#menu-trigger').removeClass('open');

                if (!$('#sidebar').hasClass('toggled')) {
                    $('#header').toggleClass('sidebar-toggled');
                }
                else {
                    $('#sidebar').removeClass('toggled');
                }
            }

            //When clicking outside
            if ($('#header').hasClass('sidebar-toggled')) {
                $(document).on('click', function (e) {
                    if (($(e.target).closest($elem).length === 0) && ($(e.target).closest($elem2).length === 0)) {
                        setTimeout(function(){
                            $($elem).removeClass('toggled');
                            $('#header').removeClass('sidebar-toggled');
                            $($elem2).removeClass('open');
                        });
                    }
                });
            }
        })

        //Submenu
        $('body').on('click', '.sub-menu > a', function(e){
            e.preventDefault();
            $(this).next().slideToggle(200);
            $(this).parent().toggleClass('toggled');
        });
    })();

    /*
     * Clear Notification
     */
    $('body').on('click', '[data-clear="notification"]', function(e){
      e.preventDefault();

      var x = $(this).closest('.listview');
      var y = x.find('.lv-item');
      var z = y.size();

      $(this).parent().fadeOut();

      x.find('.list-group').prepend('<i class="grid-loading hide-it"></i>');
      x.find('.grid-loading').fadeIn(1500);


      var w = 0;
      y.each(function(){
          var z = $(this);
          setTimeout(function(){
          z.addClass('animated fadeOutRightBig').delay(1000).queue(function(){
              z.remove();
          });
          }, w+=150);
      })

	//Popup empty message
	setTimeout(function(){
	    $('#notifications').addClass('empty');
	}, (z*150)+200);
    });

    /*
     * Dropdown Menu
     */
    if($('.dropdown')[0]) {
	//Propagate
	$('body').on('click', '.dropdown.open .dropdown-menu', function(e){
	    e.stopPropagation();
	});

	$('.dropdown').on('shown.bs.dropdown', function (e) {
	    if($(this).attr('data-animation')) {
		$animArray = [];
		$animation = $(this).data('animation');
		$animArray = $animation.split(',');
		$animationIn = 'animated '+$animArray[0];
		$animationOut = 'animated '+ $animArray[1];
		$animationDuration = ''
		if(!$animArray[2]) {
		    $animationDuration = 500; //if duration is not defined, default is set to 500ms
		}
		else {
		    $animationDuration = $animArray[2];
		}

		$(this).find('.dropdown-menu').removeClass($animationOut)
		$(this).find('.dropdown-menu').addClass($animationIn);
	    }
	});

	$('.dropdown').on('hide.bs.dropdown', function (e) {
	    if($(this).attr('data-animation')) {
    		e.preventDefault();
    		$this = $(this);
    		$dropdownMenu = $this.find('.dropdown-menu');

    		$dropdownMenu.addClass($animationOut);
    		setTimeout(function(){
    		    $this.removeClass('open')

    		}, $animationDuration);
    	    }
    	});
    }

    /*
     * Calendar Widget
     */
    if($('#calendar-widget')[0]) {
        (function(){
            $('#calendar-widget').fullCalendar({
		        contentHeight: 'auto',
		        theme: true,
                header: {
                    right: '',
                    center: 'prev, title, next',
                    left: ''
                },
                defaultDate: '2014-06-12',
                editable: true,
                events: [
                    {
                        title: 'All Day',
                        start: '2014-06-01',
                        className: 'bgm-cyan'
                    },
                    {
                        title: 'Long Event',
                        start: '2014-06-07',
                        end: '2014-06-10',
                        className: 'bgm-orange'
                    },
                    {
                        id: 999,
                        title: 'Repeat',
                        start: '2014-06-09',
                        className: 'bgm-lightgreen'
                    },
                    {
                        id: 999,
                        title: 'Repeat',
                        start: '2014-06-16',
                        className: 'bgm-lightblue'
                    },
                    {
                        title: 'Meet',
                        start: '2014-06-12',
                        end: '2014-06-12',
                        className: 'bgm-green'
                    },
                    {
                        title: 'Lunch',
                        start: '2014-06-12',
                        className: 'bgm-cyan'
                    },
                    {
                        title: 'Birthday',
                        start: '2014-06-13',
                        className: 'bgm-amber'
                    },
                    {
                        title: 'Google',
                        url: 'http://google.com/',
                        start: '2014-06-28',
                        className: 'bgm-amber'
                    }
                ]
            });
        })();
    }

    /*
     * Weather Widget
     */
    if ($('#weather-widget')[0]) {
        $.simpleWeather({
            location: 'Austin, TX',
            woeid: '',
            unit: 'f',
            success: function(weather) {
                html = '<div class="weather-status">'+weather.temp+'&deg;'+weather.units.temp+'</div>';
                html += '<ul class="weather-info"><li>'+weather.city+', '+weather.region+'</li>';
                html += '<li class="currently">'+weather.currently+'</li></ul>';
                html += '<div class="weather-icon wi-'+weather.code+'"></div>';
                html += '<div class="dash-widget-footer"><div class="weather-list tomorrow">';
                html += '<span class="weather-list-icon wi-'+weather.forecast[2].code+'"></span><span>'+weather.forecast[1].high+'/'+weather.forecast[1].low+'</span><span>'+weather.forecast[1].text+'</span>';
                html += '</div>';
                html += '<div class="weather-list after-tomorrow">';
                html += '<span class="weather-list-icon wi-'+weather.forecast[2].code+'"></span><span>'+weather.forecast[2].high+'/'+weather.forecast[2].low+'</span><span>'+weather.forecast[2].text+'</span>';
                html += '</div></div>';
                $("#weather-widget").html(html);
            },
            error: function(error) {
                $("#weather-widget").html('<p>'+error+'</p>');
            }
        });
    }

    /*
     * Todo Add new item
     */
    if ($('#todo-lists')[0]) {
    	//Add Todo Item
    	$('body').on('click', '#add-tl-item .add-new-item', function(){
    	    $(this).parent().addClass('toggled');
    	});

            //Dismiss
            $('body').on('click', '.add-tl-actions > a', function(e){
                e.preventDefault();
                var x = $(this).closest('#add-tl-item');
                var y = $(this).data('tl-action');

                if (y == "dismiss") {
                    x.find('textarea').val('');
                    x.removeClass('toggled');
                }

                if (y == "save") {
                    x.find('textarea').val('');
                    x.removeClass('toggled');
                }
    	});
    }

    /*
     * Auto Hight Textarea
     */
    if ($('.auto-size')[0]) {
	   autosize($('.auto-size'));
    }

    /*
    * Profile Menu
    */
    $('body').on('click', '.profile-menu > a', function(e){
        e.preventDefault();
        $(this).parent().toggleClass('toggled');
	    $(this).next().slideToggle(200);
    });

    /*
     * Text Field
     */

    //Add blue animated border and remove with condition when focus and blur
    if($('.fg-line')[0]) {
        $('body').on('focus', '.fg-line .form-control', function(){
            $(this).closest('.fg-line').addClass('fg-toggled');
        })

        $('body').on('blur', '.form-control', function(){
            var p = $(this).closest('.form-group, .input-group');
            var i = p.find('.form-control').val();

            if (p.hasClass('fg-float')) {
                if (i.length == 0) {
                    $(this).closest('.fg-line').removeClass('fg-toggled');
                }
            }
            else {
                $(this).closest('.fg-line').removeClass('fg-toggled');
            }
        });
    }

    //Add blue border for pre-valued fg-flot text feilds
    if($('.fg-float')[0]) {
        $('.fg-float .form-control').each(function(){
            var i = $(this).val();

            if (!i.length == 0) {
                $(this).closest('.fg-line').addClass('fg-toggled');
            }

        });
    }

    /*
     * Audio and Video
     */
    if($('audio, video')[0]) {
        $('video,audio').mediaelementplayer();
    }

    /*
     * Tag Select
     */
    if($('.chosen')[0]) {
        $('.chosen').chosen({
            width: '100%',
            allow_single_deselect: true
        });
    }

    /*
     * Input Slider
     */
    //Basic
    if($('.input-slider')[0]) {
        $('.input-slider').each(function(){
            var isStart = $(this).data('is-start');

            $(this).noUiSlider({
                start: isStart,
                range: {
                    'min': 0,
                    'max': 100,
                }
            });
        });
    }

    //Range slider
    if($('.input-slider-range')[0]) {
	$('.input-slider-range').noUiSlider({
	    start: [30, 60],
	    range: {
		    'min': 0,
		    'max': 100
	    },
	    connect: true
	});
    }

    //Range slider with value
    if($('.input-slider-values')[0]) {
	$('.input-slider-values').noUiSlider({
	    start: [ 45, 80 ],
	    connect: true,
	    direction: 'rtl',
	    behaviour: 'tap-drag',
	    range: {
		    'min': 0,
		    'max': 100
	    }
	});

	$('.input-slider-values').Link('lower').to($('#value-lower'));
        $('.input-slider-values').Link('upper').to($('#value-upper'), 'html');
    }

    /*
     * Input Mask
     */
    if ($('input-mask')[0]) {
        $('.input-mask').mask();
    }

    /*
     * Color Picker
     */
    if ($('.color-picker')[0]) {
	    $('.color-picker').each(function(){
            var colorOutput = $(this).closest('.cp-container').find('.cp-value');
            $(this).farbtastic(colorOutput);
        });
    }

    /*
     * HTML Editor
     */
    if ($('.html-editor')[0]) {
	   $('.html-editor').summernote({
            height: 150
        });
    }

    if($('.html-editor-click')[0]) {
        //Edit
        $('body').on('click', '.hec-button', function(){
            $('.html-editor-click').summernote({
                focus: true
            });
            $('.hec-save').show();
        })

        //Save
        $('body').on('click', '.hec-save', function(){
            $('.html-editor-click').code();
            $('.html-editor-click').destroy();
            $('.hec-save').hide();
            notify('Content Saved Successfully!', 'success');
        });
    }

    //Air Mode
    if($('.html-editor-airmod')[0]) {
        $('.html-editor-airmod').summernote({
            airMode: true
        });
    }

    /*
     * Date Time Picker
     */

    //Date Time Picker
    if ($('.date-time-picker')[0]) {
	   $('.date-time-picker').datetimepicker();
    }

    //Time
    if ($('.time-picker')[0]) {
    	$('.time-picker').datetimepicker({
    	    format: 'LT'
    	});
    }

    //Date
    if ($('.date-picker')[0]) {
    	$('.date-picker').datetimepicker({
    	    format: 'DD/MM/YYYY'
    	});
    }

    /*
     * Form Wizard
     */

    if ($('.form-wizard-basic')[0]) {
    	$('.form-wizard-basic').bootstrapWizard({
    	    tabClass: 'fw-nav',
            'nextSelector': '.next',
            'previousSelector': '.previous'
    	});
    }

    /*
     * Bootstrap Growl - Notifications popups
     */
    function notify(message, type){
        $.growl({
            message: message
        },{
            type: type,
            allow_dismiss: false,
            label: 'Cancel',
            className: 'btn-xs btn-inverse',
            placement: {
                from: 'top',
                align: 'right'
            },
            delay: 2500,
            animate: {
                    enter: 'animated bounceIn',
                    exit: 'animated bounceOut'
            },
            offset: {
                x: 20,
                y: 85
            }
        });
    };

    /*
     * Waves Animation
     */
    (function(){
         Waves.attach('.btn:not(.btn-icon):not(.btn-float)');
         Waves.attach('.btn-icon, .btn-float', ['waves-circle', 'waves-float']);
        Waves.init();
    })();

    /*
     * Lightbox
     */
    if ($('.lightbox')[0]) {
        $('.lightbox').lightGallery({
            enableTouch: true
        });
    }

    /*
     * Link prevent
     */
    $('body').on('click', '.a-prevent', function(e){
        e.preventDefault();
    });

    /*
     * Collaspe Fix
     */
    if ($('.collapse')[0]) {

        //Add active class for opened items
        $('.collapse').on('show.bs.collapse', function (e) {
            $(this).closest('.panel').find('.panel-heading').addClass('active');
        });

        $('.collapse').on('hide.bs.collapse', function (e) {
            $(this).closest('.panel').find('.panel-heading').removeClass('active');
        });

        //Add active class for pre opened items
        $('.collapse.in').each(function(){
            $(this).closest('.panel').find('.panel-heading').addClass('active');
        });
    }

    /*
     * Tooltips
     */
    if ($('[data-toggle="tooltip"]')[0]) {
        $('[data-toggle="tooltip"]').tooltip();
    }

    /*
     * Popover
     */
    if ($('[data-toggle="popover"]')[0]) {
        $('[data-toggle="popover"]').popover();
    }

    /*
     * Message
     */

    //Actions
    if ($('.on-select')[0]) {
        var checkboxes = '.lv-avatar-content input:checkbox';
        var actions = $('.on-select').closest('.lv-actions');

        $('body').on('click', checkboxes, function() {
            if ($(checkboxes+':checked')[0]) {
                actions.addClass('toggled');
            }
            else {
                actions.removeClass('toggled');
            }
        });
    }

    if($('#ms-menu-trigger')[0]) {
        $('body').on('click', '#ms-menu-trigger', function(e){
            e.preventDefault();
            $(this).toggleClass('open');
            $('.ms-menu').toggleClass('toggled');
        });
    }

    /*
     * Login
     */
    if ($('.login-content')[0]) {
        //Add class to HTML. This is used to center align the login box
        $('html').addClass('login-content');

        $('body').on('click', '.login-navigation > li', function(){
            var z = $(this).data('block');
            var t = $(this).closest('.lc-block');

            t.removeClass('toggled');

            setTimeout(function(){
                $(z).addClass('toggled');
            });

        })
    }

    /*
     * Fullscreen Browsing
     */
    if ($('[data-action="fullscreen"]')[0]) {
	var fs = $("[data-action='fullscreen']");
	fs.on('click', function(e) {
	    e.preventDefault();

	    //Launch
	    function launchIntoFullscreen(element) {

		if(element.requestFullscreen) {
		    element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
		    element.mozRequestFullScreen();
		} else if(element.webkitRequestFullscreen) {
		    element.webkitRequestFullscreen();
		} else if(element.msRequestFullscreen) {
		    element.msRequestFullscreen();
		}
	    }

	    //Exit
	    function exitFullscreen() {

		if(document.exitFullscreen) {
		    document.exitFullscreen();
		} else if(document.mozCancelFullScreen) {
		    document.mozCancelFullScreen();
		} else if(document.webkitExitFullscreen) {
		    document.webkitExitFullscreen();
		}
	    }

	    launchIntoFullscreen(document.documentElement);
	    fs.closest('.dropdown').removeClass('open');
	});
    }

    /*
     * Clear Local Storage
     */
    if ($('[data-action="clear-localstorage"]')[0]) {
        var cls = $('[data-action="clear-localstorage"]');

        cls.on('click', function(e) {
            e.preventDefault();

            swal({
                title: "Are you sure?",
                text: "Local storage cache will be cleared.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: false,
                allowOutsideClick: true,
            }, function(){
                localStorage.clear();
                swal("Success!", "Local storage cache is cleared.", "success");
            });
        });
    }

    /*
     * Profile Edit Toggle
     */
    if ($('[data-pmb-action]')[0]) {
        $('body').on('click', '[data-pmb-action]', function(e){
            e.preventDefault();
            var d = $(this).data('pmb-action');

            if (d === "edit") {
                $(this).closest('.pmb-block').toggleClass('toggled');
            }

            if (d === "reset") {
                $(this).closest('.pmb-block').removeClass('toggled');
            }


        });
    }

    /*
     * IE 9 Placeholder
     */
    if($('html').hasClass('ie9')) {
        $('input, textarea').placeholder({
            customClass: 'ie9-placeholder'
        });
    }


    /*
     * Listview Search
     */
    if ($('.lvh-search-trigger')[0]) {


        $('body').on('click', '.lvh-search-trigger', function(e){
            e.preventDefault();
            x = $(this).closest('.lv-header-alt').find('.lvh-search');

            x.fadeIn(300);
            x.find('.lvhs-input').focus();
        });

        //Close Search
        $('body').on('click', '.lvh-search-close', function(){
            x.fadeOut(300);
            setTimeout(function(){
                x.find('.lvhs-input').val('');
            }, 350);
        })
    }


    /*
     * Print
     */
    if ($('[data-action="print"]')[0]) {
        $('body').on('click', '[data-action="print"]', function(e){
            e.preventDefault();

            window.print();
        })
    }

    /*
     * Typeahead Auto Complete
     */
     if($('.typeahead')[0]) {

          var statesArray = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
            'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
            'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
            'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
            'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
            'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
            'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
            'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
            'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
          ];
        var states = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: statesArray
        });

        $('.typeahead').typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
          name: 'states',
          source: states
        });
    }


    /*
     * Wall
     */
    if ($('.wcc-toggle')[0]) {
        var z = '<div class="wcc-inner">' +
                    '<textarea class="wcci-text auto-size" placeholder="Write Something..."></textarea>' +
                '</div>' +
                '<div class="m-t-15">' +
                    '<button class="btn btn-sm btn-primary">Post</button>' +
                    '<button class="btn btn-sm btn-link wcc-cencel">Cancel</button>' +
                '</div>'


        $('body').on('click', '.wcc-toggle', function() {
            $(this).parent().html(z);
            autosize($('.auto-size')); //Reload Auto size textarea
        });

        //Cancel
        $('body').on('click', '.wcc-cencel', function(e) {
            e.preventDefault();

            $(this).closest('.wc-comment').find('.wcc-inner').addClass('wcc-toggle').html('Write Something...')
        });

    }

    /*
     * Skin Change
     */
    $('body').on('click', '[data-skin]', function() {
        var currentSkin = $('[data-current-skin]').data('current-skin');
        var skin = $(this).data('skin');

        $('[data-current-skin]').attr('data-current-skin', skin)

    });


    /*
     * Find all forms on a page with an keyboard save class on a page
     * when the (control/cmd) + s combo is pressed and a form element is focused make that form automatically submit
     */
    $('form.keyboard-save').keypress(function (event) {

        var isMac = (navigator.appVersion.indexOf("Mac")!=-1);

        //only listen to cmd+s combo on mac don't listen for control+s
        if( isMac )
        {
            if( !(event.which == 115 && (event.metaKey && ! event.ctrlKey)) && !(event.which == 19) )
            {
                return true;
            }

        }else if ( !(event.which == 115 && event.ctrlKey) && !(event.which == 19)) {
            return true;
        }
        
        this.submit();
        event.preventDefault();
        return false;
    });

});

/* Project: Bootstrap Growl - v2.0.1 | Author: Mouse0270 aka Robert McIntosh | License: MIT License | Website: https://github.com/mouse0270/bootstrap-growl */
(function(e,t,n,r){var i="growl",s="plugin_"+i,o={element:"body",type:"info",allow_dismiss:true,placement:{from:"top",align:"right"},offset:20,spacing:10,z_index:1031,delay:5e3,timer:1e3,url_target:"_blank",mouse_over:false,animate:{enter:"animated fadeInDown",exit:"animated fadeOutUp"},onShow:null,onShown:null,onHide:null,onHidden:null,icon_type:"class",template:'<div data-growl="container" class="alert" role="alert"><button type="button" aria-hidden="true" class="close" data-growl="dismiss">&times;</button><span data-growl="icon"></span><span data-growl="title"></span><span data-growl="message"></span><a href="#" data-growl="url"></a></div>'};var u=function(t,n){o=e.extend(true,{},o,n)},a=function(t){if(!t){e('[data-growl="container"]').find('[data-growl="dismiss"]').trigger("click")}else{e('[data-growl="container"][data-growl-position="'+t+'"]').find('[data-growl="dismiss"]').trigger("click")}},f=function(t,n,r){var n={content:{message:typeof n=="object"?n.message:n,title:n.title?n.title:null,icon:n.icon?n.icon:null,url:n.url?n.url:null}};r=e.extend(true,{},n,r);this.settings=e.extend(true,{},o,r);plugin=this;l(r,this.settings,plugin);this.$template=$template},l=function(e,t,n){var r={settings:t,element:t.element,template:t.template};if(typeof t.offset=="number"){t.offset={x:t.offset,y:t.offset}}$template=c(r);h($template,r.settings);p($template,r.settings);d($template,r.settings,n)},c=function(t){var n=e(t.settings.template);n.addClass("alert-"+t.settings.type);n.attr("data-growl-position",t.settings.placement.from+"-"+t.settings.placement.align);n.find('[data-growl="dismiss"]').css("display","none");n.removeClass("alert-dismissable");if(t.settings.allow_dismiss){n.addClass("alert-dismissable");n.find('[data-growl="dismiss"]').css("display","block")}return n},h=function(e,t){e.find('[data-growl="dismiss"]').css({"z-index":t.z_index-1>=1?t.z_index-1:1});if(t.content.icon){if(t.icon_type.toLowerCase()=="class"){e.find('[data-growl="icon"]').addClass(t.content.icon)}else{if(e.find('[data-growl="icon"]').is("img")){e.find('[data-growl="icon"]').attr("src",t.content.icon)}else{e.find('[data-growl="icon"]').append('<img src="'+t.content.icon+'" />')}}}if(t.content.title){e.find('[data-growl="title"]').html(t.content.title)}if(t.content.message){e.find('[data-growl="message"]').html(t.content.message)}if(t.content.url){e.find('[data-growl="url"]').attr("href",t.content.url).attr("target",t.url_target);e.find('[data-growl="url"]').css({position:"absolute",top:0,left:0,width:"100%",height:"100%","z-index":t.z_index-2>=1?t.z_index-2:1})}},p=function(t,n){var r=n.offset.y,i={position:n.element==="body"?"fixed":"absolute",margin:0,"z-index":n.z_index,display:"inline-block"},s=false;e('[data-growl-position="'+n.placement.from+"-"+n.placement.align+'"]').each(function(){return r=Math.max(r,parseInt(e(this).css(n.placement.from))+e(this).outerHeight()+n.spacing)});i[n.placement.from]=r+"px";t.css(i);if(n.onShow){n.onShow(event)}e(n.element).append(t);switch(n.placement.align){case"center":t.css({left:"50%",marginLeft:-(t.outerWidth()/2)+"px"});break;case"left":t.css("left",n.offset.x+"px");break;case"right":t.css("right",n.offset.x+"px");break}t.addClass("growl-animated");t.one("webkitAnimationStart oanimationstart MSAnimationStart animationstart",function(e){s=true});t.one("webkitAnimationEnd oanimationend MSAnimationEnd animationend",function(e){if(n.onShown){n.onShown(e)}});setTimeout(function(){if(!s){if(n.onShown){n.onShown(event)}}},600)},d=function(e,t,n){e.addClass(t.animate.enter);e.find('[data-growl="dismiss"]').on("click",function(){n.close()});e.on("mouseover",function(t){e.addClass("hovering")}).on("mouseout",function(){e.removeClass("hovering")});if(t.delay>=1){e.data("growl-delay",t.delay);var r=setInterval(function(){var i=parseInt(e.data("growl-delay"))-t.timer;if(!e.hasClass("hovering")&&t.mouse_over=="pause"||t.mouse_over!="pause"){e.data("growl-delay",i)}if(i<=0){clearInterval(r);n.close()}},t.timer)}};f.prototype={update:function(e,t){switch(e){case"icon":if(this.settings.icon_type.toLowerCase()=="class"){this.$template.find('[data-growl="icon"]').removeClass(this.settings.content.icon);this.$template.find('[data-growl="icon"]').addClass(t)}else{if(this.$template.find('[data-growl="icon"]').is("img")){this.$template.find('[data-growl="icon"]')}else{this.$template.find('[data-growl="icon"]').find("img").attr().attr("src",t)}}break;case"url":this.$template.find('[data-growl="url"]').attr("href",t);break;case"type":this.$template.removeClass("alert-"+this.settings.type);this.$template.addClass("alert-"+t);break;default:this.$template.find('[data-growl="'+e+'"]').html(t)}return this},close:function(){var t=this.$template,n=this.settings,r=t.css(n.placement.from),i=false;if(n.onHide){n.onHide(event)}t.addClass(this.settings.animate.exit);t.nextAll('[data-growl-position="'+this.settings.placement.from+"-"+this.settings.placement.align+'"]').each(function(){e(this).css(n.placement.from,r);r=parseInt(r)+n.spacing+e(this).outerHeight()});t.one("webkitAnimationStart oanimationstart MSAnimationStart animationstart",function(e){i=true});t.one("webkitAnimationEnd oanimationend MSAnimationEnd animationend",function(t){e(this).remove();if(n.onHidden){n.onHidden(t)}});setTimeout(function(){if(!i){t.remove();if(n.onHidden){n.onHidden(event)}}},100);return this}};e.growl=function(e,t){if(e==false&&t.command=="closeAll"){a(t.position);return false}else if(e==false){u(this,t);return false}var n=new f(this,e,t);return n}})(jQuery,window,document)

//# sourceMappingURL=app.js.map
