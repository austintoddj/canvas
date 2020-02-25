<template>
    <div class="modal fade" tabindex="-1" role="dialog" data-backdrop="static">
        <div class="modal-dialog" ref="modal" role="document">
            <div class="modal-content">
                <div v-if="!selectedImageUrl" class="modal-header d-flex align-items-center justify-content-between">
                    <div v-if="unsplashKey" class="input-group align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" class="icon-search float-left position-absolute">
                            <circle cx="10" cy="10" r="7" class="fill-bg"/>
                            <path class="primary" d="M16.32 14.9l1.1 1.1c.4-.02.83.13 1.14.44l3 3a1.5 1.5 0 0 1-2.12 2.12l-3-3a1.5 1.5 0 0 1-.44-1.14l-1.1-1.1a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
                        </svg>
                        <input
                            v-model="searchKeyword"
                            type="text"
                            autofocus
                            style="padding-left:32px"
                            class="form-control border-0 bg-transparent"
                            :placeholder="trans.app.search_free_photos"
                        />
                    </div>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click.prevent="closeModal">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" class="icon-close-circle">
                            <circle cx="12" cy="12" r="10" class="primary"/>
                            <path class="fill-bg" d="M13.41 12l2.83 2.83a1 1 0 0 1-1.41 1.41L12 13.41l-2.83 2.83a1 1 0 1 1-1.41-1.41L10.59 12 7.76 9.17a1 1 0 0 1 1.41-1.41L12 10.59l2.83-2.83a1 1 0 0 1 1.41 1.41L13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body pb-0">
                    <file-pond
                        v-if="!isSearchingUnsplash && !unsplashImages.length && isReadyToAcceptUploads"
                        name="editorImagePond"
                        ref="pond"
                        max-files="1"
                        :maxFileSize="maxUploadFilesize"
                        :iconRemove="getRemoveIcon"
                        :iconRetry="getRetryIcon"
                        :label-idle="getPlaceholderLabel"
                        accepted-file-types="image/jpeg,image/png,image/gif"
                        :server="getServerOptions"
                        :allow-multiple="false"
                        :files="selectedImagesForPond"
                        @processfile="processedFromFilePond"
                        @removefile="removedFromFilePond"/>

                    <div v-if="unsplashKey && !selectedImageUrl">
                        <div v-if="unsplashImages.length" class="card-columns mt-3">
                            <div v-for="(image, $index) in unsplashImages" :key="$index" class="card border-0 bg-transparent">
                                <img
                                    :src="image.urls.small"
                                    :alt="image.alt_description"
                                    class="card-img bg-transparent"
                                    style="cursor: pointer"
                                    @click="selectUnsplashImage(image)"
                                />
                            </div>
                        </div>

                        <infinite-loading v-if="isSearchingUnsplash" :identifier="infiniteId" @infinite="fetchUnsplashImages" spinner="spiral">
                            <span slot="no-more"></span>
                            <div slot="no-results" class="mb-3">
                                {{ trans.app.no_images_found_for }} "{{ searchKeyword }}"
                            </div>
                        </infinite-loading>
                    </div>

                    <div v-if="!isSearchingUnsplash && !unsplashImages.length">
                        <div v-if="selectedImageUrl && !selectedImagesForPond.length && !isReadyToAcceptUploads" class="selected-image">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click.prevent="clearAndResetComponent">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" class="icon-trash">
                                    <path class="primary" d="M5 5h14l-.89 15.12a2 2 0 0 1-2 1.88H7.9a2 2 0 0 1-2-1.88L5 5zm5 5a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1z"/>
                                    <path class="primary" d="M8.59 4l1.7-1.7A1 1 0 0 1 11 2h2a1 1 0 0 1 .7.3L15.42 4H19a1 1 0 0 1 0 2H5a1 1 0 1 1 0-2h3.59z"/>
                                </svg>
                            </button>
                            <img :src="selectedImageUrl" class="w-100 rounded mb-3"/>
                        </div>

                        <div class="col-12" :hidden="!selectedImagesForPond.length && !selectedImageUrl">
                            <div class="form-group row">
                                <label class="font-weight-bold text-uppercase text-muted small">{{ trans.app.caption }}</label>
                                <input
                                    type="text"
                                    :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                                    class="form-control border-0"
                                    v-model="selectedImageCaption"
                                    :placeholder="trans.app.type_caption_for_image"
                                    ref="caption"/>
                            </div>

                            <div class="form-group row mt-2" :hidden="!selectedImagesForPond.length && !selectedImageUrl">
                                <label class="font-weight-bold text-uppercase text-muted small">{{ trans.app.layout }}</label>
                                <select
                                    :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                                    class="custom-select border-0"
                                    v-model="selectedImageLayout">
                                    <option value="default">
                                        {{ trans.app.default_layout }}
                                    </option>
                                    <option value="wide">
                                        {{ trans.app.wide_image }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="!unsplashImages.length" class="modal-footer">
                    <button
                        class="btn btn-link btn-block text-muted font-weight-bold text-decoration-none"
                        @click="clickDone"
                        data-dismiss="modal">
                        {{ trans.app.done }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import _ from "lodash"
    import Unsplash, {toJson} from 'unsplash-js'
    import InfiniteLoading from 'vue-infinite-loading'
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
        name: 'embed-image-modal',

        components: {
            InfiniteLoading,
            FilePond
        },

        data() {
            return {
                isReadyToAcceptUploads: true,
                searchKeyword: '',
                unsplashKey: Canvas.unsplash,
                unsplashPage: 1,
                unsplashPerPage: 12,
                unsplashImages: [],
                infiniteId: +new Date(),
                isSearchingUnsplash: false,
                selectedImageBlot: null,
                selectedImageUrl: null,
                selectedImagesForPond: [],
                selectedImageLayout: 'default',
                selectedImageCaption: '',
                galleryModalClasses: ['modal-xl', 'modal-dialog-scrollable'],
                maxUploadFilesize: Canvas.maxUpload,
                path: Canvas.path,
                trans: JSON.parse(Canvas.lang),
            }
        },

        mounted() {
            this.$parent.$on('openingEmbedImageModal', data => {
                if (!_.isEmpty(data)) {
                    this.selectedImageCaption = _.isEmpty(data.caption) ? '' : data.caption
                    this.selectedImageUrl = data.url
                    this.selectedImageLayout = data.layout || 'default'
                    this.selectedImageBlot = data.existingBlot
                    this.isReadyToAcceptUploads = _.isEmpty(data.url);
                }
            })
        },

        watch: {
            searchKeyword: _.debounce(function (val) {
                if (val === '') {
                    this.isReadyToAcceptUploads = !this.selectedImageUrl;
                    this.isSearchingUnsplash = false
                    this.unsplashPage = 1
                    this.unsplashImages = []
                    this.infiniteId += 1
                    this.$refs.modal.classList.remove(...this.galleryModalClasses)
                } else {
                    this.isReadyToAcceptUploads = false
                    this.isSearchingUnsplash = true
                    this.unsplashPage = 1
                    this.unsplashImages = []
                    this.infiniteId += 1
                    this.$refs.modal.classList.add(...this.galleryModalClasses)
                }
            }, 1000),
        },

        methods: {
            fetchUnsplashImages($state) {
                const unsplash = new Unsplash({accessKey: this.unsplashKey})
                unsplash.search.photos(this.searchKeyword, this.unsplashPage, this.unsplashPerPage)
                    .then(toJson)
                    .then(json => {
                        if (!_.isEmpty(json.results)) {
                            this.unsplashImages.push(...json.results)
                            this.unsplashPage += 1;

                            $state.loaded()
                        } else {
                            $state.complete()
                        }
                    });
            },

            selectUnsplashImage(image) {
                const unsplash = new Unsplash({accessKey: this.unsplashKey});

                // We must trigger a download to properly attribute traffic to the source
                // https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
                unsplash.photos.downloadPhoto(image);

                this.selectedUnsplashImage = image
                this.selectedImageUrl = image.urls.regular
                this.selectedImageCaption = this.buildImageCaption(image)
                this.unsplashImages = []
                this.unsplashPage = 1
                this.searchKeyword = ''
                this.$refs.modal.classList.remove(...this.galleryModalClasses)

                this.$emit('changed', {
                    url: image.urls.regular,
                    caption: this.buildImageCaption(image),
                })
            },

            buildImageCaption(image) {
                return this.trans.app.photo_by + ' <a href="' + image.user.links.html + '" target="_blank">' + image.user.name + '</a> ' + this.trans.app.on + ' <a href="https://unsplash.com" target="_blank">Unsplash</a>'
            },

            processedFromFilePond() {
                this.isReadyToAcceptUploads = true
                this.selectedImageUrl = document.getElementsByName('editorImagePond')[0].value
            },

            removedFromFilePond() {
                this.isReadyToAcceptUploads = true
                this.selectedImagesForPond = []
                this.selectedImageUrl = null
            },

            clickDone() {
                if (!this.selectedImageUrl) {
                    if (!_.isEmpty(this.selectedImageBlot)) {
                        this.$emit('removingEmbedImage', {
                            existingBlot: this.selectedImageBlot
                        })
                    }
                } else {
                    this.$emit('addingEmbedImage', {
                        url: this.selectedImageUrl,
                        caption: this.selectedImageCaption ?? '',
                        existingBlot: this.selectedImageBlot,
                        layout: this.selectedImageLayout,
                    })
                }

                this.clearAndResetComponent()
            },

            clearAndResetComponent() {
                this.selectedImagesForPond = []
                this.selectedImageUrl = null
                this.selectedImageLayout = 'default'
                this.selectedImageCaption = ''
                this.isReadyToAcceptUploads = true
                this.isSearchingUnsplash = false
                this.unsplashImages = []
                this.unsplashPage = 1
                this.searchKeyword = ''
                this.$refs.modal.classList.remove(...this.galleryModalClasses)
            },

            closeModal() {
                this.clearAndResetComponent()
                this.$refs.modal.hide
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
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" class="icon-cloud-upload mr-3"><path class="secondary" d="M18 14.97c0-.76-.3-1.51-.88-2.1l-3-3a3 3 0 0 0-4.24 0l-3 3A3 3 0 0 0 6 15a4 4 0 0 1-.99-7.88 5.5 5.5 0 0 1 10.86-.82A4.49 4.49 0 0 1 22 10.5a4.5 4.5 0 0 1-4 4.47z"/><path class="secondary" d="M11 14.41V21a1 1 0 0 0 2 0v-6.59l1.3 1.3a1 1 0 0 0 1.4-1.42l-3-3a1 1 0 0 0-1.4 0l-3 3a1 1 0 0 0 1.4 1.42l1.3-1.3z"/></svg> Drop files or click here to upload'
            },
        }
    }
</script>
