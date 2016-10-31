<!-- Vendor Specific -->
<script type="text/javascript" src="{{ elixir('assets/js/vendor.js') }}"></script>

<!-- Application Specific -->
<script type="text/javascript" src="{{ elixir('assets/js/backend.js') }}"></script>

<!-- Laravel CSRF Token-->
<script>
    window.Laravel = <?php echo json_encode([
            'csrfToken' => csrf_token(),
    ]); ?>
</script>