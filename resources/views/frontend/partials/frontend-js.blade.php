<!-- Laravel CSRF Token-->
<script>
    window.Laravel = <?php echo json_encode([
            'csrfToken' => csrf_token(),
    ]); ?>
</script>

<!-- Application Specific -->
<script type="text/javascript" src="{{elixir('/assets/js/app.js')}}" charset="utf-8"></script>
<script type="text/javascript" src="{{ elixir('/assets/js/frontend.js') }}" charset="utf-8"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.5.1/prism.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.5.1/components/prism-php.min.js"></script>