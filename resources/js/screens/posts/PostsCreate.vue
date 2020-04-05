<template>
    <div>
        <page-header>
            <template slot="status">
                <ul class="navbar-nav mr-auto flex-row float-right">
                    <li class="text-muted font-weight-bold">
                        <span>{{ trans.app.draft }}</span>
                    </li>
                </ul>
            </template>

            <template slot="action">
                <a href="#" class="btn btn-sm btn-outline-success font-weight-bold my-auto" @click="showPublishModal">
                    <span class="d-block d-lg-none">{{ trans.app.publish }}</span>
                    <span class="d-none d-lg-block">{{ trans.app.ready_to_publish }}</span>
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
                        <a href="#" class="dropdown-item" @click="showSettingsModal">
                            {{ trans.app.general_settings }}
                        </a>
                        <a href="#" class="dropdown-item" @click="showFeaturedImageModal">
                            {{ trans.app.featured_image }}
                        </a>
                        <a href="#" class="dropdown-item" @click="showSeoModal">
                            {{ trans.app.seo_settings }}
                        </a>
                    </div>
                </div>
            </template>
        </page-header>

        <main class="py-4" v-if="isReady">
            <div class="col-xl-8 offset-xl-2 col-lg-10 offset-lg-1 col-md-12">
                <div class="form-group row my-3">
                    <textarea-autosize
                        :placeholder="trans.app.title"
                        class="form-control-lg form-control border-0 font-serif bg-transparent"
                        @input.native="updateTitle"
                        rows="1"
                        v-model="post.title"
                    />
                </div>

                <!--                <quill-editor></quill-editor>-->
            </div>
        </main>

        <publish-modal
            v-if="isReady"
            ref="publishModal"
        />

        <!--        <settings-modal-->
        <!--            v-if="isReady"-->
        <!--            ref="settingsModal"-->
        <!--            :post="post"-->
        <!--            :tags="tags"-->
        <!--            :topics="topics"-->
        <!--        />-->

        <!--        <featured-image-modal-->
        <!--            v-if="isReady"-->
        <!--            ref="featuredImageModal"-->
        <!--        />-->

        <!--        <seo-modal-->
        <!--            v-if="isReady"-->
        <!--            ref="seoModal"-->
        <!--        />-->
    </div>
</template>

<script>
    import Vue from 'vue'
    import $ from 'jquery'
    import {mapState} from 'vuex'
    import NProgress from 'nprogress'
    import SeoModal from '../../components/modals/SeoModal'
    import PageHeader from '../../components/PageHeader'
    import VueTextAreaAutosize from 'vue-textarea-autosize'
    import PublishModal from '../../components/modals/PublishModal'
    import SettingsModal from '../../components/modals/SettingsModal'
    import QuillEditor from '../../components/editor/QuillEditor'
    import FeaturedImageModal from '../../components/modals/FeaturedImageModal'

    Vue.use(VueTextAreaAutosize)

    export default {
        name: 'posts-create',

        components: {
            PublishModal,
            FeaturedImageModal,
            QuillEditor,
            PageHeader,
            SeoModal,
            SettingsModal,
        },

        data() {
            return {
                tags: [],
                topics: [],
                isReady: false,
                trans: JSON.parse(Canvas.translations),
            }
        },

        created() {
            this.$store.dispatch('CREATE_POST', { vm: this });
            this.fetchTags();
            this.fetchTopics();

            NProgress.done();
            this.isReady = true;
        },

        computed: {
            ...mapState(['post']),
        },

        methods: {
            fetchTags() {
                this.request()
                    .get('/api/tags')
                    .then(response => {
                        this.tags = response.data.data
                    })
                    .catch(error => {
                        // Add any error debugging...
                    })
            },

            fetchTopics() {
                this.request()
                    .get('/api/topics')
                    .then(response => {
                        this.topics = response.data.data
                    })
                    .catch(error => {
                        // Add any error debugging...
                    })
            },

            save() {
                this.$store.dispatch('PUT_POST', { vm: this, payload: this.$store.state.post });

                // this.post.errors = []
                // this.post.isSaving = true
                // this.post.hasSuccess = false
                //
                // this.$store.dispatch('saveActivePost', {
                //     data: this.post,
                // }).then(() => {
                //     this.post.isSaving = false
                //     this.post.hasSuccess = true
                //     this.$router.push({
                //         name: 'posts-edit',
                //         params: {
                //             id: this.post.id,
                //             data: {
                //                 tags: this.tags,
                //                 topics: this.topics
                //             }
                //         },
                //     })
                // })
            },

            updateTitle() {
                this.$store.dispatch('SET_POST_TITLE', this.$store.state.post.title);
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
        },
    }
</script>

<style scoped>
    textarea {
        font-size: 42px;
    }
</style>
