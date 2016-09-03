<style type="text/css">
    a.show-password{
        color: #2196f3;
        font-size: 0.9em;
        margin-top: 10px;
        position: absolute;
        right: 0;
        top: 0;
        transition: all .8s linear;
    }
    a.show-password:hover{
        transition: all .8s linear;
    }
</style>

<script>
        (function(){
            $('input[name="password"], input[name="password_confirmation"], input[name="new_password"], input[name="new_password_confirmation"]').parent().append('<a href="" class="show-password" tabindex="-1"><i class="zmdi zmdi-eye"></i></a>');

            function toggleIcon (elem) {
                if ( elem.hasClass ( 'zmdi-eye' ) ) {
                    return elem.removeClass ( 'zmdi-eye' ).addClass ( 'zmdi-eye-off' );
                }
                return elem.removeClass ( 'zmdi-eye-off' ).addClass ( 'zmdi-eye' );
            }

            function toggleType (elem) {
                return (elem.attr ( 'type' ) === 'password') ? 'text' : 'password';
            }

            $('body').on('click', '.show-password', function (e) {
                var password_field = $(this).siblings('input');
                var new_type = toggleType( password_field );
                var current_icon = $(this).children('i');
                toggleIcon(current_icon);
                password_field.attr('type', new_type);
                e.preventDefault();
            });
        })();
</script>
