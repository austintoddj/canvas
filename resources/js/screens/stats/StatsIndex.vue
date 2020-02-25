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
            <div class="col-xl-10 offset-xl-1 px-xl-5 col-md-12">
                <div class="my-3">
                    <h1>{{ trans.app.stats }}</h1>
                    <p v-if="isReady && posts.length">{{ trans.app.click_to_see_insights }}</p>
                </div>

                <div v-if="isReady" v-cloak>
                    <div v-if="posts.length">
                        <div class="card-deck mt-4">
                            <div class="card shadow bg-transparent">
                                <div class="card-header pb-0 bg-transparent d-flex justify-content-between align-middle border-0">
                                    <p class="font-weight-bold text-muted small text-uppercase">{{ trans.app.views }}</p>
                                    <p>
                                        <span class="badge badge-pill badge-success p-2 font-weight-bold">{{ trans.app.last_thirty_days }}</span>
                                    </p>
                                </div>
                                <div class="card-body pt-0 pb-2">
                                    <p class="card-text display-4">
                                        {{ suffixedNumber(viewCount) }}
                                    </p>
                                </div>
                            </div>
                            <div class="card shadow bg-transparent">
                                <div class="card-header pb-0 bg-transparent d-flex justify-content-between align-middle border-0">
                                    <p class="font-weight-bold text-muted small text-uppercase">{{ trans.app.visitors }}</p>
                                    <p>
                                        <span class="badge badge-pill badge-primary p-2 font-weight-bold">
                                            {{ trans.app.last_thirty_days }}
                                        </span>
                                    </p>
                                </div>
                                <div class="card-body pt-0 pb-2">
                                    <p class="card-text display-4">
                                        {{ suffixedNumber(visitCount) }}
                                    </p>
                                </div>
                            </div>
                            <div class="card shadow bg-transparent">
                                <div class="card-header pb-0 bg-transparent border-0">
                                    <p class="font-weight-bold text-muted small text-uppercase">{{ trans.app.publishing }}</p>
                                </div>
                                <div class="card-body pt-0 pb-2">
                                    <ul>
                                        <li>{{ publishedCount }} {{ trans.app.published_posts }}</li>
                                        <li>{{ draftCount }} {{ trans.app.drafts }}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <line-chart
                            :views="JSON.parse(viewTrend)"
                            :visits="JSON.parse(visitTrend)"
                            class="mt-5"
                        />

                        <div class="mt-5">
                            <div v-for="(post, $index) in posts" :key="$index" class="d-flex border-top py-3 align-items-center">
                                <div class="mr-auto">
                                    <p class="mb-1 mt-2">
                                        <router-link :to="{name: 'stats-show', params: { id: post.id }}" class="font-weight-bold text-lg lead text-decoration-none">
                                            {{ post.title }}
                                        </router-link>
                                    </p>
                                    <p class="text-muted mb-2">
                                        {{ post.read_time }} ―
                                        <router-link :to="{name: 'posts-edit', params: { id: post.id }}" class="text-decoration-none text-muted">
                                            {{ trans.app.edit_post }}
                                        </router-link>
                                        ―
                                        <router-link :to="{name: 'stats-show', params: { id: post.id }}" class="text-decoration-none text-muted">
                                            {{ trans.app.view_stats }}
                                        </router-link>
                                    </p>
                                </div>
                                <div class="ml-auto d-none d-lg-block">
                                    <span class="text-muted mr-3">{{ suffixedNumber(post.views_count) }} {{ trans.app.views }}</span>
                                    {{ trans.app.created }} {{ moment(post.created_at).locale(Canvas.locale).fromNow() }}
                                </div>
                            </div>
                        </div>

                        <infinite-loading @infinite="fetchPosts" spinner="spiral">
                            <span slot="no-more"></span>
                            <div slot="no-results"></div>
                        </infinite-loading>
                    </div>

                    <div v-else class="mt-5">
                        <p class="lead text-center text-muted mt-5 pt-5">
                            {{ trans.app.you_have_no_published_posts }}
                        </p>
                        <p class="lead text-center text-muted mt-1">
                            {{ trans.app.stats_are_made_available }}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import NProgress from 'nprogress'
    import InfiniteLoading from 'vue-infinite-loading'
    import LineChart from '../../components/LineChart'
    import PageHeader from '../../components/PageHeader'

    export default {
        name: 'stats-index',

        components: {
            LineChart,
            InfiniteLoading,
            PageHeader,
        },

        data() {
            return {
                page: 1,
                posts: [],
                publishedCount: 0,
                draftCount: 0,
                viewCount: 0,
                viewTrend: {},
                visitCount: 0,
                visitTrend: {},
                isReady: false,
                trans: JSON.parse(Canvas.lang),
            }
        },

        mounted() {
            this.fetchStats()
            this.fetchPosts()
        },

        methods: {
            fetchStats() {
                this.request()
                    .get('/api/stats')
                    .then(response => {
                        this.viewCount = response.data.view_count
                        this.viewTrend = response.data.view_trend
                        this.visitCount = response.data.visit_count
                        this.visitTrend = response.data.visit_trend
                        this.publishedCount = response.data.published_count
                        this.draftCount = response.data.draft_count

                        this.isReady = true;
                        NProgress.done()
                    })
                    .catch(error => {
                        // Add any error debugging...

                        NProgress.done()
                    })
            },

            fetchPosts($state) {
                this.request()
                    .get('/api/posts', {
                        params: {
                            page: this.page
                        },
                    })
                    .then(response => {
                        if (!_.isEmpty(response.data) && !_.isEmpty(response.data.posts.data)) {
                            this.page += 1;
                            this.posts.push(...response.data.posts.data)

                            $state.loaded();
                        } else {
                            $state.complete();
                        }

                        NProgress.done()
                    })
                    .catch(error => {
                        // Add any error debugging...

                        NProgress.done()
                    })
            },
        }
    }
</script>

<style lang="scss" scoped>
    @import '../../../sass/utilities/variables';

    .badge-success {
        background-color: $green-500;
        color: darken($green, 20%);
    }

    .badge-primary {
        background-color: $blue-500;
        color: darken($blue, 35%);
    }
</style>
