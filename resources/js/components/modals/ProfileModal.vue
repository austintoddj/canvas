<template>
    <div class="modal fade" id="profileModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header d-flex align-items-center justify-content-between border-0">
                    <h4 class="modal-title">{{ user.name }}</h4>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" class="icon-close-circle">
                            <circle cx="12" cy="12" r="10" class="primary"/>
                            <path class="fill-bg" d="M13.41 12l2.83 2.83a1 1 0 0 1-1.41 1.41L12 13.41l-2.83 2.83a1 1 0 1 1-1.41-1.41L10.59 12 7.76 9.17a1 1 0 0 1 1.41-1.41L12 10.59l2.83-2.83a1 1 0 0 1 1.41 1.41L13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <file-pond
                        v-if="isReadyToAcceptUploads"
                        name="profileImagePond"
                        ref="pond"
                        max-files="1"
                        :maxFileSize="maxUploadFilesize"
                        :iconRemove="getRemoveIcon"
                        :iconRetry="getRetryIcon"
                        className="w-50"
                        :label-idle="getPlaceholderLabel"
                        accepted-file-types="image/jpeg,image/png,image/gif"
                        imagePreviewHeight="170"
                        imageCropAspectRatio="1:1"
                        imageResizeTargetWidth="200"
                        imageResizeTargetHeight="200"
                        stylePanelLayout="compact circle"
                        styleLoadIndicatorPosition="center bottom"
                        styleProgressIndicatorPosition="center bottom"
                        styleButtonProcessItemPosition="center bottom"
                        styleButtonRemoveItemPosition="center bottom"
                        :server="getServerOptions"
                        :allow-multiple="false"
                        :files="selectedImagesForPond"
                        @processfile="processedFromFilePond"
                        @removefile="removedFromFilePond"/>

                    <div v-if="!isReadyToAcceptUploads" class="d-flex justify-content-center bg-black">
                        <button @click.prevent="clearAvatar" type="button" class="close position-absolute d-block align-self-center" data-dismiss="modal" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" class="icon-trash">
                                <path class="primary" d="M5 5h14l-.89 15.12a2 2 0 0 1-2 1.88H7.9a2 2 0 0 1-2-1.88L5 5zm5 5a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1z"/>
                                <path class="primary" d="M8.59 4l1.7-1.7A1 1 0 0 1 11 2h2a1 1 0 0 1 .7.3L15.42 4H19a1 1 0 0 1 0 2H5a1 1 0 1 1 0-2h3.59z"/>
                            </svg>
                        </button>

                        <img :src="avatar" class="w-50 rounded-circle shadow-inner mb-3 h-100"/>
                    </div>

                    <div class="form-group row">
                        <div class="col-12">
                            <label class="font-weight-bold text-uppercase text-muted small">
                                {{ trans.app.username }}
                            </label>
                            <input
                                name="username"
                                type="text"
                                :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                                class="form-control border-0"
                                title="Username"
                                v-model="username"
                                placeholder="Choose a username..."
                            />
                            <div v-if="form.errors.username" class="invalid-feedback d-block">
                                <strong>{{ form.errors.username[0] }}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <div class="col-12">
                            <label class="font-weight-bold text-uppercase text-muted small">
                                {{ trans.app.summary }}
                            </label>
                            <textarea
                                rows="4"
                                id="summary"
                                name="summary"
                                style="resize: none"
                                :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                                class="form-control border-0"
                                v-model="summary"
                                :placeholder="trans.app.tell_us_about_yourself">
                            </textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="row w-100">
                        <div class="col-lg order-lg-last px-0">
                            <a
                                href="#"
                                class="btn btn-success btn-block font-weight-bold mt-0"
                                aria-label="Save"
                                data-dismiss="modal"
                                @click.prevent="clickSave">
                                {{ trans.app.save }}
                            </a>
                        </div>
                        <div class="col-lg order-lg-first px-0">
                            <button
                                class="btn btn-link btn-block font-weight-bold text-muted text-decoration-none"
                                data-dismiss="modal">
                                {{ trans.app.cancel }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import vueFilePond from 'vue-filepond'

    import 'filepond/dist/filepond.min.css'
    import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css'

    import FilePondPluginImageValidateSize from 'filepond-plugin-image-validate-size'
    import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
    import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
    import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
    import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'

    const FilePond = vueFilePond(
        FilePondPluginFileValidateType,
        FilePondPluginImagePreview,
        FilePondPluginImageValidateSize,
        FilePondPluginFileValidateSize,
        FilePondPluginImageExifOrientation
    );

    export default {
        name: 'profile-modal',

        props: {
            form: {
                type: Object,
                required: true,
            },
        },

        components: {
            FilePond
        },

        data() {
            return {
                selectedImagesForPond: [],
                isReadyToAcceptUploads: false,
                username: this.form.username,
                summary: this.form.summary,
                avatar: this.form.avatar,
                maxUploadFilesize: Canvas.maxUpload,
                path: Canvas.path,
                user: Canvas.user,
                trans: JSON.parse(Canvas.lang),
            }
        },

        methods: {
            processedFromFilePond() {
                this.isReadyToAcceptUploads = true
                this.avatar = document.getElementsByName('profileImagePond')[0].value
            },

            removedFromFilePond() {
                this.isReadyToAcceptUploads = true
                this.selectedImagesForPond = []
                this.avatar = null
            },

            clickSave() {
                if (_.isEmpty(this.avatar)) {
                    this.avatar = this.defaultGravatar(this.user.email, 500)
                }

                let data = {
                    username: this.username,
                    summary: this.summary,
                    avatar: this.avatar,
                }

                this.$root.$emit('updateAvatar', this.avatar)
                this.$parent.saveData(data, true)


            },

            clearAvatar() {
                this.avatar = null
                this.isReadyToAcceptUploads = true
            }
        },

        computed: {
            getServerOptions() {
                return {
                    url: this.mediaUploadPath(),
                    headers: {
                        'X-CSRF-TOKEN': this.getToken()
                    }
                }
            },

            getRetryIcon() {
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-refresh" width="26"><circle style="fill:none" cx="12" cy="12" r="10"/><path style="fill:white" d="M8.52 7.11a5.98 5.98 0 0 1 8.98 2.5 1 1 0 1 1-1.83.8 4 4 0 0 0-5.7-1.86l.74.74A1 1 0 0 1 10 11H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1.7-.7l.82.81zm5.51 8.34l-.74-.74A1 1 0 0 1 14 13h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1.7.7l-.82-.81A5.98 5.98 0 0 1 6.5 14.4a1 1 0 1 1 1.83-.8 4 4 0 0 0 5.7 1.85z"/></svg>'
            },

            getRemoveIcon() {
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" class="icon-close-circle"><circle style="fill:none" cx="12" cy="12" r="10"/><path style="fill:white" d="M13.41 12l2.83 2.83a1 1 0 0 1-1.41 1.41L12 13.41l-2.83 2.83a1 1 0 1 1-1.41-1.41L10.59 12 7.76 9.17a1 1 0 0 1 1.41-1.41L12 10.59l2.83-2.83a1 1 0 0 1 1.41 1.41L13.41 12z"/></svg>'
            },

            getPlaceholderLabel() {
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" class="icon-cloud-upload"><path class="secondary" d="M18 14.97c0-.76-.3-1.51-.88-2.1l-3-3a3 3 0 0 0-4.24 0l-3 3A3 3 0 0 0 6 15a4 4 0 0 1-.99-7.88 5.5 5.5 0 0 1 10.86-.82A4.49 4.49 0 0 1 22 10.5a4.5 4.5 0 0 1-4 4.47z"/><path class="secondary" d="M11 14.41V21a1 1 0 0 0 2 0v-6.59l1.3 1.3a1 1 0 0 0 1.4-1.42l-3-3a1 1 0 0 0-1.4 0l-3 3a1 1 0 0 0 1.4 1.42l1.3-1.3z"/></svg><br/> Drop files or click here to upload'
            },
        }
    }
</script>

<style scoped lang="scss">
    .filepond--wrapper {
        display: flex;
        justify-content: center;
    }
</style>
