<script type="text/javascript">
    $(document).ready(function(){
        $("#posts").bootgrid({
            labels: {
                noResults: "No posts yet."
            },
            css: {
                icon: 'zmdi icon',
                iconColumns: 'zmdi-view-module',
                iconDown: 'zmdi-sort-amount-desc',
                iconRefresh: 'zmdi-refresh',
                iconUp: 'zmdi-sort-amount-asc'
            },
            formatters: {
                "commands": function(column, row) {
                    return "<a href='{{ url('admin/post') }}/" + row.id + "/edit'><button type='button' class='btn btn-icon command-edit waves-effect waves-circle'><span class='zmdi zmdi-edit'></span></button></a> " +
                            " <a href='{{ url('blog') }}/" + row.slug + "' target='_blank'><button type='button' class='btn btn-icon command-delete waves-effect waves-circle'><span class='zmdi zmdi-search'></span></button></a>";
                }
            }
        });
    });
</script>
