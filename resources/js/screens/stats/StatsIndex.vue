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
                <div class="my-3">
                    <h1>{{ trans.app.stats }}</h1>
                    <p class="text-secondary">{{ trans.app.click_to_see_insights }}</p>
                </div>

                <div v-if="isReady">
                    <div v-if="posts.length">
                        <div class="card-deck mt-5">
                            <div class="card shadow border-0">
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
                            <div class="card shadow border-0">
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
                        </div>

                        <line-chart
                            :views="JSON.parse(viewTrend)"
                            :visits="JSON.parse(visitTrend)"
                            class="mt-5"
                        />

                        <div class="mt-5 card shadow border-0">
                            <div class="card-body p-0">
                                <div v-for="(post, index) in posts" :key="index">
                                    <router-link :to="{name: 'stats-show', params: { id: post.id }}" class="text-decoration-none">
                                        <div
                                            v-hover="{class: `row-hover`}"
                                            class="d-flex p-3 align-items-center"
                                            :class="{'border-top': index !== 0, 'rounded-top': index === 0, 'rounded-bottom': index === posts.length - 1}">
                                            <div class="mr-auto pl-2">
                                                <p class="mb-1 mt-2">
                                                <span class="font-weight-bold text-lg lead">
                                                    {{ trim(post.title, 45) }}
                                                </span>
                                                </p>
                                                <p class="text-secondary mb-2">
                                                    {{ post.read_time }} ― {{ trans.app.published }} {{ moment(post.published_at).locale(Canvas.locale).fromNow() }}
                                                </p>
                                            </div>
                                            <div class="ml-auto d-none d-lg-block">
                                                <span class="text-muted mr-3">{{ suffixedNumber(post.views_count) }} {{ trans.app.views }}</span>
                                                <span class="mr-3">{{ trans.app.created }} {{ moment(post.created_at).locale(Canvas.locale).fromNow() }}</span>
                                            </div>

                                            <svg xmlns="http://www.w3.org/2000/svg" width="25" viewBox="0 0 24 24" class="icon-cheveron-right-circle"><circle cx="12" cy="12" r="10" style="fill:none"/><path class="primary" d="M10.3 8.7a1 1 0 0 1 1.4-1.4l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4-1.4l3.29-3.3-3.3-3.3z"/></svg>
                                        </div>
                                    </router-link>
                                </div>

                                <infinite-loading @infinite="fetchPosts" spinner="spiral">
                                    <span slot="no-more"></span>
                                    <div slot="no-results"></div>
                                </infinite-loading>
                            </div>
                        </div>
                    </div>

                    <div v-else class="card shadow border-0 mt-5">
                        <div class="card-body p-0">
                            <div class="my-5">
                                <p class="lead text-center text-muted mt-5">
                                    {{ trans.app.you_have_no_published_posts }}
                                </p>
                                <p class="lead text-center text-muted mt-1">
                                    {{ trans.app.stats_are_made_available }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import NProgress from 'nprogress'
    import isEmpty from 'lodash/isEmpty'
    import InfiniteLoading from 'vue-infinite-loading'
    import Hover from "../../directives/Hover";
    import LineChart from '../../components/LineChart'
    import PageHeader from '../../components/PageHeader'

    export default {
        name: 'stats-index',

        components: {
            LineChart,
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
                viewCount: 0,
                viewTrend: {},
                visitCount: 0,
                visitTrend: {},
                isReady: false,
                trans: JSON.parse(Canvas.translations),
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
                            page: this.page,
                            type: 'published'
                        },
                    })
                    .then(response => {
                        if (!isEmpty(response.data) && !isEmpty(response.data.posts.data)) {
                            this.page += 1;
                            this.posts.push(...response.data.posts.data)

                            $state.loaded();
                        } else {
                            $state.complete();
                        }
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
