<div class="clearfix modal-preview-demo">
    <div class="modal fade" id="modal-file-upload">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Upload File(s)</h4>
                </div>

                <div class="modal-body">
                    <form method="POST" action="{{ url('admin/upload/file') }}" class="dropzone" id="fileCreate">
                        <input type="hidden" name="_token" value="{{ csrf_token() }}">
                        <input type="hidden" name="folder" value="{{ $folder }}">
                    </form>

                    <div class="upload-progress" style="display: none;">
                        <div class="upload-progress-label"></div>
                        <div class="progress">
                            <div class="progress-bar upload-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0"></div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-link" data-dismiss="modal">close</button>
                    <button type="button" class="btn btn-link" onclick="window.location.reload()">
                        <span class="zmdi zmdi-refresh"></span>
                        reload page
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>