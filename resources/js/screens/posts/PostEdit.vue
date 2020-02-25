<template>
    <div>
        <page-header>
            <template slot="status">
                <ul class="navbar-nav mr-auto flex-row float-right">
                    <li class="text-muted font-weight-bold">
                        <div v-if="!post.isSaving && !post.hasSuccess">
                            <span v-if="isDraft">{{ trans.app.draft }}</span>
                            <span v-if="!isDraft">{{ trans.app.published }}</span>
                        </div>

                        <div v-if="post.isSaving">
                            <span>{{ trans.app.saving }}</span>
                        </div>

                        <div v-if="post.hasSuccess">
                            <span class="text-success">{{ trans.app.saved }}</span>
                        </div>
                    </li>
                </ul>
            </template>

            <template slot="action">
                <a v-if="isDraft" href="#" class="btn btn-sm btn-outline-success font-weight-bold my-auto" @click="showPublishModal">
                    <span class="d-block d-lg-none">{{ trans.app.publish }}</span>
                    <span class="d-none d-lg-block">{{ trans.app.ready_to_publish }}</span>
                </a>

                <a v-else href="#" class="btn btn-sm btn-outline-success font-weight-bold my-auto" @click="save">
                    {{ trans.app.save }}
                </a>
            </template>

            <template slot="menu">
                <div class="dropdown">
                    <a id="navbarDropdown" class="nav-link pr-0" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="25" class="icon-dots-horizontal">
                            <path class="primary" fill-rule="evenodd" d="M5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
                        </svg>
                    </a>

                    <div class="dropdown-menu dropdown-menu-right">
                        <router-link v-if="!isDraft" :to="{ name: 'stats-show', params: { id: id } }" class="dropdown-item">
                            {{ trans.app.view_stats }}
                        </router-link>
                        <div v-if="!isDraft" class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" @click="showSettingsModal">
                            {{ trans.app.general_settings }}
                        </a>
                        <a href="#" class="dropdown-item" @click="showFeaturedImageModal">
                            {{ trans.app.featured_image }}
                        </a>
                        <a href="#" class="dropdown-item" @click="showSeoModal">
                            {{ trans.app.seo_settings }}
                        </a>
                        <a v-if="!isDraft" href="#" class="dropdown-item" @click.prevent="convertToDraft">
                            {{ trans.app.convert_to_draft }}
                        </a>
                        <a v-if="id !== 'create'" href="#" class="dropdown-item text-danger" @click="showDeleteModal">
                            {{ trans.app.delete }}
                        </a>
                    </div>
                </div>
            </template>
        </page-header>

        <main class="py-4" v-if="isReady">
            <div class="col-xl-8 offset-xl-2 px-xl-5 col-md-12">
                <div class="form-group row my-3">
                    <textarea-autosize
                        :placeholder="trans.app.title"
                        class="form-control-lg form-control border-0 font-serif bg-transparent"
                        @input.native="update"
                        rows="1"
                        v-model="post.title"
                    />
                </div>

                <quill-editor></quill-editor>
            </div>
        </main>

        <publish-modal
            v-if="isReady"
            ref="publishModal"
        />

        <settings-modal
            v-if="isReady"
            ref="settingsModal"
            :post="post"
            :tags="tags"
            :topics="topics"
        />

        <featured-image-modal
            v-if="isReady"
            ref="featuredImageModal"
        />

        <seo-modal
            v-if="isReady"
            ref="seoModal"
        />

        <delete-modal
            v-if="isReady"
            ref="deleteModal"
            @delete="deletePost"
            :header="trans.app.delete"
            :message="trans.app.deleted_posts_are_gone_forever"
        />
    </div>
</template>

<script>
    import Vue from 'vue'
    import $ from 'jquery'
    import {mapGetters} from 'vuex'
    import NProgress from 'nprogress'
    import SeoModal from '../../components/modals/SeoModal'
    import PageHeader from '../../components/PageHeader'
    import DeleteModal from '../../components/modals/DeleteModal'
    import VueTextAreaAutosize from 'vue-textarea-autosize'
    import PublishModal from '../../components/modals/PublishModal'
    import SettingsModal from '../../components/modals/SettingsModal'
    import QuillEditor from '../../components/editor/QuillEditor'
    import FeaturedImageModal from '../../components/modals/FeaturedImageModal'

    Vue.use(VueTextAreaAutosize)

    export default {
        name: 'posts-edit',

        components: {
            PublishModal,
            FeaturedImageModal,
            DeleteModal,
            QuillEditor,
            PageHeader,
            SeoModal,
            SettingsModal,
        },

        data() {
            return {
                post: {},
                tags: [],
                topics: [],
                id: this.$route.params.id || 'create',
                isReady: false,
                trans: JSON.parse(Canvas.lang),
            }
        },

        beforeRouteEnter(to, from, next) {
            next(vm => {
                vm.request()
                    .get('/api/posts/' + vm.id)
                    .then(response => {
                        vm.$store.dispatch('setActivePost', response.data.post)

                        vm.post = vm.$store.getters.activePost
                        vm.tags = response.data.tags
                        vm.topics = response.data.topics
                        vm.isReady = true

                        NProgress.done()
                    })
                    .catch(error => {
                        vm.$router.push({name: 'posts'})
                    })
            })
        },

        beforeRouteLeave(to, from, next) {
            // Reset the form status to avoid it flashing on the next screen load
            this.post.isSaving = false
            this.post.hasSuccess = false

            next()
        },

        computed: {
            ...mapGetters(['isDraft']),
        },

        methods: {
            save() {
                this.post.errors = []
                this.post.isSaving = true
                this.post.hasSuccess = false

                this.$store.dispatch('saveActivePost', {
                    data: this.post,
                    id: this.id,
                })

                if (this.id === 'create') {
                    this.id = this.post.id
                }

                setTimeout(() => {
                    this.post.hasSuccess = false
                    this.post.isSaving = false
                }, 3000)
            },

            update: _.debounce(function (e) {
                this.save()
            }, 3000),

            convertToDraft() {
                this.post.published_at = ''
                this.save()
            },

            deletePost() {
                this.$store.dispatch('deletePost', this.post.id)

                $(this.$refs.deleteModal.$el).modal('hide')
            },

            showPublishModal() {
                $(this.$refs.publishModal.$el).modal('show')
            },

            showSettingsModal() {
                $(this.$refs.settingsModal.$el).modal('show')
            },

            showFeaturedImageModal() {
                $(this.$refs.featuredImageModal.$el).modal('show')
            },

            showSeoModal() {
                $(this.$refs.seoModal.$el).modal('show')
            },

            showDeleteModal() {
                $(this.$refs.deleteModal.$el).modal('show')
            },
        },
    }
</script>

<style scoped>
    textarea {
        font-size: 42px;
    }
</style>
