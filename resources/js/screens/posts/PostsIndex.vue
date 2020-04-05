<template>
    <div>
        <page-header>
            <template slot="action">
                <router-link :to="{ name: 'posts-create' }" class="btn btn-sm btn-outline-success font-weight-bold my-auto">
                    {{ trans.app.new_post }}
                </router-link>
            </template>
        </page-header>

        <main class="py-4">
            <div class="col-xl-8 offset-xl-2 col-lg-10 offset-lg-1 col-md-12">
                <div class="d-flex justify-content-between my-3">
                    <h1>{{ trans.app.posts_simple }}</h1>

                    <select name="" id="" v-model="type" @change="changeType" class="my-auto ml-auto w-auto bg-transparent text-muted custom-select border-0">
                        <option value="published">{{ trans.app.published }} ({{ publishedCount }})</option>
                        <option value="draft">{{ trans.app.draft }} ({{ draftCount }})</option>
                    </select>
                </div>

                <div class="mt-2 card shadow border-0">
                    <div class="card-body p-0">
                        <div v-for="(post, index) in posts" :key="index">
                            <router-link :to="{name: 'posts-edit', params: { id: post.id }}" class="text-decoration-none">
                                <div
                                    v-hover="{class: `row-hover`}"
                                    class="d-flex p-3 align-items-center"
                                    :class="{'border-top': index !== 0, 'rounded-top': index === 0, 'rounded-bottom': index === posts.length - 1}">
                                    <div class="mr-auto pl-2 py-1">
                                        <p class="mb-1">
                                        <span class="font-weight-bold text-lg lead">
                                            {{ trim(post.title, 55) }}
                                        </span>
                                        </p>
                                        <p class="mb-1" v-if="post.summary">
                                            {{ trim(post.summary, 125) }}
                                        </p>
                                        <p class="text-muted mb-0">
                                        <span v-if="isPublished(post.published_at)">
                                            {{ trans.app.published}} {{ moment(post.published_at).locale(Canvas.locale).fromNow() }}
                                        </span>

                                            <span v-if="isDraft(post.published_at) && !isScheduled(post.published_at)" class="text-danger">{{ trans.app.draft }}</span>

                                            <span v-if="isScheduled(post.published_at)" class="text-danger">{{ trans.app.scheduled }}</span>

                                            ― {{ trans.app.updated }} {{ moment(post.updated_at).locale(Canvas.locale).fromNow() }}
                                        </p>
                                    </div>
                                    <div class="ml-auto d-none d-lg-block pl-3">
                                        <div v-if="post.featured_image" id="featuredImage" class="mr-2 ml-3 shadow-inner" :style="{backgroundImage:'url(' + post.featured_image +')',}"></div>
                                        <div v-else class="mx-3 align-middle">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="45" viewBox="0 0 24 24" class="icon-camera">
                                                <path class="primary" d="M6.59 6l2.7-2.7A1 1 0 0 1 10 3h4a1 1 0 0 1 .7.3L17.42 6H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h2.59zM19 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-7 8a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>
                                                <path class="primary" d="M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                                            </svg>
                                        </div>
                                    </div>

                                    <div class="d-lg-none d-block pl-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" viewBox="0 0 24 24" class="icon-cheveron-right-circle"><circle cx="12" cy="12" r="10" style="fill:none"/><path class="primary" d="M10.3 8.7a1 1 0 0 1 1.4-1.4l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4-1.4l3.29-3.3-3.3-3.3z"/></svg>
                                    </div>
                                </div>
                            </router-link>
                        </div>

                        <infinite-loading :identifier="infiniteId" @infinite="fetchData" spinner="spiral">
                            <span slot="no-more"></span>
                            <div slot="no-results" class="text-left">
                                <div class="my-5">
                                    <p class="lead text-center text-muted mt-5">
                                        <span v-if="type === 'published'">{{ trans.app.you_have_no_published_posts }}</span>
                                        <span v-if="type === 'draft'">{{ trans.app.you_have_no_draft_posts }}</span>
                                    </p>
                                    <p class="lead text-center text-muted mt-1">
                                        {{ trans.app.write_on_the_go }}
                                    </p>
                                </div>
                            </div>
                        </infinite-loading>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import isEmpty from 'lodash/isEmpty'
    import NProgress from 'nprogress'
    import Hover from "../../directives/Hover";
    import InfiniteLoading from 'vue-infinite-loading'
    import PageHeader from '../../components/PageHeader'

    export default {
        name: 'posts-index',

        components: {
            InfiniteLoading,
            PageHeader,
        },

        directives: {
            Hover
        },

        data() {
            return {
                page: 1,
                posts: [],
                publishedCount: 0,
                draftCount: 0,
                type: 'published',
                infiniteId: +new Date(),
                trans: JSON.parse(Canvas.translations),
            }
        },

        methods: {
            fetchData($state) {
                this.request()
                    .get('/api/posts', {
                        params: {
                            page: this.page,
                            type: this.type,
                        },
                    })
                    .then(response => {
                        if (!isEmpty(response.data)) {
                            this.publishedCount = response.data.publishedCount
                            this.draftCount = response.data.draftCount

                            if (!isEmpty(response.data.posts.data)) {
                                this.page += 1;
                                this.posts.push(...response.data.posts.data)

                                $state.loaded();
                            } else {
                                $state.complete();
                            }

                            NProgress.done()
                        }
                    })
                    .catch(error => {
                        // Add any error debugging...
                        $state.complete();
                        NProgress.done()
                    })
            },

            changeType() {
                this.page = 1;
                this.posts = [];
                this.infiniteId += 1;
            }
        }
    }
</script>

<style scoped>
    #featuredImage {
        background-size: cover;
        width: 57px;
        height: 57px;
        -webkit-border-radius: 50%;
        -moz-border-radius: 50%;
        border-radius: 50%;
    }
</style>
