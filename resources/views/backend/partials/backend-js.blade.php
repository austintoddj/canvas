<!-- Vendor Specific -->
<script type="text/javascript" src="{{asset('js/vendor.js')}}"></script>

<!-- Application Specific -->
<script type="text/javascript" src="{{asset('js/backend.js')}}"></script>

<!-- Laravel CSRF Token-->
<script>
    window.Laravel = <?php echo json_encode([
            'csrfToken' => csrf_token(),
    ]); ?>
</script>