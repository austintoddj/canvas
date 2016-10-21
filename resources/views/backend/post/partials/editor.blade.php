

@include('backend.post.partials.modals.help')

<script type="text/javascript">
        new Vue({
            el: '#main',
            data: {
                pageImage: '{{ $page_image }}',
                selectedEventName: null,
                showMediaManager: false,
                simpleMde: null
            },

            mounted: function () {
                this.simpleMde = new SimpleMDE({
                    element: document.getElementById("editor"),
                    toolbar: [
                        "bold", "italic", "heading", "|",
                        "quote", "unordered-list", "ordered-list", "|",
                        'link', 'image',
                        {
                            name: 'insertImage',
                            action: function (editor) {
                                this.openFromEditor();
                            }.bind(this),
                            className: "icon-image",
                            title: "Insert Media Browser Image"
                        },
                        "|",
                        {
                            name: "guide",
                            action: function () {
                                $('#guide').modal('show');
                            },
                            className: "fa fa-question-circle",
                            title: "Markdown Guide",
                        },
                        "|",
                        "preview", "side-by-side", "fullscreen", "|"
                    ]
                });
            },

            methods: {
                openFromEditor: function () {
                    this.showMediaManager = true;
                    this.selectedEventName = 'editor';
                },

                openFromPageImage: function()
                {
                    this.showMediaManager = true;
                    this.selectedEventName = 'page-image';
                }
            },

            created: function(){
                window.eventHub.$on('media-manager-selected-page-image', function (file) {
                    this.pageImage = file.relativePath;
                    this.showMediaManager = false;
                }.bind(this));

                window.eventHub.$on('media-manager-selected-editor', function (file) {
                    var cm = this.simpleMde.codemirror;
                    var output = '[' + file.name + '](' + file.relativePath + ')';

                    if (this.isImage(file)) {
                        output = '!' + output;
                    }

                    cm.replaceSelection(output);
                    this.showMediaManager = false;
                }.bind(this));

                window.eventHub.$on('media-manager-notification', function (message, type, time) {
                    $.growl({
                        message: message
                    },{
                        type: 'inverse',
                        allow_dismiss: false,
                        label: 'Cancel',
                        className: 'btn-xs btn-inverse',
                        placement: {
                            from: 'top',
                            align: 'right'
                        },
                        z_index: 9999,
                        delay: time,
                        animate: {
                            enter: 'animated fadeInRight',
                            exit: 'animated fadeOutRight'
                        },
                        offset: {
                            x: 20,
                            y: 85
                        }
                    });
                });
            }
        });
</script>
