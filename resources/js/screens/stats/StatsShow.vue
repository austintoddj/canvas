<template>
    <div>
        <page-header>
            <template slot="action">
                <router-link to="/stats" class="btn btn-sm btn-outline-success font-weight-bold my-auto ml-auto">
                    {{ trans.app.see_all_stats }}
                </router-link>
            </template>

            <template slot="menu">
                <div class="dropdown">
                    <a id="navbarDropdown" class="nav-link pr-0" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" class="icon-dots-horizontal">
                            <path class="primary" fill-rule="evenodd" d="M5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
                        </svg>
                    </a>

                    <div class="dropdown-menu dropdown-menu-right">
                        <router-link :to="{ name: 'posts-edit', params: { id: id } }" class="dropdown-item">
                            {{ trans.app.edit_post }}
                        </router-link>
                    </div>
                </div>
            </template>
        </page-header>

        <main class="py-4" v-if="isReady">
            <div class="col-xl-10 offset-xl-1 px-xl-5 col-md-12">
                <div class="row justify-content-between">
                    <div class="col-md-8">
                        <p class="text-muted mb-0">
                            {{ trans.app.published }}
                            {{ moment(post.published_at).format('MMM D, YYYY') }}
                        </p>
                        <h1>{{ post.title }}</h1>
                    </div>
                </div>

                <div class="row justify-content-start mt-3">
                    <div class="col-lg-6 col-12">
                        <p class="lead mt-4 border-bottom">{{ trans.app.lifetime_summary }}</p>
                        <div class="d-flex">
                            <div class="mr-5">
                                <p class="mb-0 small text-muted text-uppercase font-weight-bold">
                                    {{ trans.app.total_views }}
                                </p>
                                <h3 class="mt-1">
                                    {{ suffixedNumber(viewCountLifetime) }}
                                </h3>
                            </div>

                            <div>
                                <p class="mb-0 small text-muted text-uppercase font-weight-bold">
                                    {{ trans.app.average_reading_time }}
                                </p>
                                <h3 class="mt-1">
                                    {{ readTime }}
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-6 col-12">
                        <p class="lead mt-4 border-bottom">{{ trans.app.monthly_summary }}</p>
                        <div class="d-flex">
                            <div class="mr-5">
                                <p class="mb-0 small text-muted text-uppercase font-weight-bold">
                                    {{ trans.app.views }}
                                </p>
                                <h3 class="my-1">
                                    {{ suffixedNumber(viewCount) }}
                                </h3>
                                <p class="text-muted text-md-right">
                                    <span v-if="viewsAreTrendingUp">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" class="icon-arrow-thick-up-circle"><circle cx="12" cy="12" r="10" class="primary"/><path class="fill-bg" d="M14 12v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-5H8a1 1 0 0 1-.7-1.7l4-4a1 1 0 0 1 1.4 0l4 4A1 1 0 0 1 16 12h-2z"/></svg>
                                    </span>
                                    <span v-if="!viewsAreTrendingUp">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" class="icon-arrow-thick-down-circle"><circle cx="12" cy="12" r="10" class="primary"/><path class="fill-bg" d="M10 12V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5h2a1 1 0 0 1 .7 1.7l-4 4a1 1 0 0 1-1.4 0l-4-4A1 1 0 0 1 8 12h2z"/></svg>
                                    </span>
                                    {{ viewMonthOverMonthPercentage }}% {{ trans.app.from_last_month }}
                                </p>
                            </div>

                            <div>
                                <p class="mb-0 small text-muted text-uppercase font-weight-bold">
                                    {{ trans.app.visitors }}
                                </p>
                                <h3 class="my-1">
                                    {{ suffixedNumber(visitCount) }}
                                </h3>
                                <p class="text-muted text-md-right">
                            <span v-if="visitsAreTrendingUp">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" class="icon-arrow-thick-up-circle"><circle cx="12" cy="12" r="10" class="primary"/><path class="fill-bg" d="M14 12v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-5H8a1 1 0 0 1-.7-1.7l4-4a1 1 0 0 1 1.4 0l4 4A1 1 0 0 1 16 12h-2z"/></svg>
                            </span>
                                    <span v-if="!visitsAreTrendingUp">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" class="icon-arrow-thick-down-circle"><circle cx="12" cy="12" r="10" class="primary"/><path class="fill-bg" d="M10 12V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5h2a1 1 0 0 1 .7 1.7l-4 4a1 1 0 0 1-1.4 0l-4-4A1 1 0 0 1 8 12h2z"/></svg>
                            </span>
                                    {{ visitMonthOverMonthPercentage }}% {{ trans.app.from_last_month }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <line-chart
                    :views="JSON.parse(viewTrend)"
                    :visits="JSON.parse(visitTrend)"
                    class="mt-5 mb-3"
                />

                <div class="row justify-content-between">
                    <div class="col-md-6 mt-4">
                        <h5 class="text-muted small text-uppercase font-weight-bold border-bottom pb-2">
                            {{ trans.app.views_by_traffic_source }}
                        </h5>

                        <div v-if="traffic">
                            <div v-for="(views, host, index) in traffic">
                                <div class="d-flex py-2 align-items-center">
                                    <div class="mr-auto">
                                        <div v-if="host === trans.app.other">
                                            <p class="mb-0 py-1">
                                                <img :src="`https://favicons.githubusercontent.com/${host}`" :style="Canvas.darkMode === true ? {filter: 'invert(100%)'} : ''" :alt="host" class="mr-1"/>
                                                <a href="#" v-tooltip="{placement: 'right'}" class="text-decoration-none" :title="trans.app.referer_unknown">
                                                    {{ host }}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 24 24" class="icon-help"><path class="primary" d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/><path class="fill-bg" d="M12 19.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1-5.5a1 1 0 0 1-2 0v-1.41a1 1 0 0 1 .55-.9L14 10.5C14.64 10.08 15 9.53 15 9c0-1.03-1.3-2-3-2-1.35 0-2.49.62-2.87 1.43a1 1 0 0 1-1.8-.86C8.05 6.01 9.92 5 12 5c2.7 0 5 1.72 5 4 0 1.3-.76 2.46-2.05 3.24L13 13.2V14z"/></svg>
                                                </a>
                                            </p>
                                        </div>
                                        <div v-else>
                                            <p class="mb-0 py-1">
                                                <img :src="`https://favicons.githubusercontent.com/${host}`" :alt="host" class="mr-1"/>
                                                <a :href="'http://' + host" class="text-decoration-none" target="_blank">
                                                    {{ host }}
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="ml-auto">
                                        <span class="text-muted">{{ suffixedNumber(views) }} {{ trans.app.views }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p v-else class="py-2 font-italic">
                            {{ trans.app.waiting_until_more_data }}
                        </p>
                    </div>

                    <div class="col-md-6 mt-4">
                        <h5 class="text-muted small text-uppercase font-weight-bold border-bottom pb-2">
                            {{ trans.app.popular_reading_times }}
                        </h5>

                        <div v-if="popularReadingTimes">
                            <div v-for="(percentage, time, index) in popularReadingTimes">
                                <div class="d-flex py-2 align-items-center">
                                    <div class="mr-auto">
                                        <p class="mb-0 py-1">
                                            {{ time }}
                                        </p>
                                    </div>
                                    <div class="ml-auto">
                                        <span class="text-muted">{{ percentage + '%' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p v-else class="py-2 font-italic">
                            {{ trans.app.waiting_until_more_data }}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import NProgress from 'nprogress'
    import Tooltip from '../../directives/Tooltip'
    import LineChart from '../../components/LineChart'
    import PageHeader from '../../components/PageHeader'

    export default {
        name: 'stats-show',

        components: {
            LineChart,
            PageHeader,
        },

        directives: {
            Tooltip,
        },

        data() {
            return {
                id: this.$route.params.id,
                post: null,
                viewCount: 0,
                viewCountLifetime: 0,
                viewTrend: {},
                visitCount: 0,
                visitTrend: {},
                readTime: null,
                popularReadingTimes: null,
                viewMonthOverMonthDirection: null,
                viewMonthOverMonthPercentage: null,
                visitMonthOverMonthDirection: null,
                visitMonthOverMonthPercentage: null,
                traffic: null,
                isReady: false,
                trans: JSON.parse(Canvas.lang),
            }
        },

        beforeRouteEnter(to, from, next) {
            next(vm => {
                vm.request()
                    .get('/api/stats/' + vm.id)
                    .then(response => {
                        vm.post = response.data.post
                        vm.viewCount = response.data.view_count
                        vm.viewCountLifetime = response.data.view_count_lifetime
                        vm.viewTrend = response.data.view_trend
                        vm.visitCount = response.data.visit_count
                        vm.visitTrend = response.data.visit_trend
                        vm.traffic = Array.isArray(response.data.traffic) ? null : response.data.traffic
                        vm.popularReadingTimes = Array.isArray(response.data.popular_reading_times) ? null : response.data.popular_reading_times
                        vm.readTime = response.data.read_time
                        vm.viewMonthOverMonthDirection = response.data.view_month_over_month.direction
                        vm.viewMonthOverMonthPercentage = response.data.view_month_over_month.percentage
                        vm.visitMonthOverMonthDirection = response.data.visit_month_over_month.direction
                        vm.visitMonthOverMonthPercentage = response.data.visit_month_over_month.percentage

                        vm.isReady = true

                        NProgress.done()
                    })
                    .catch(error => {
                        vm.$router.push({name: 'stats'})
                    })
            })
        },

        computed: {
            viewsAreTrendingUp() {
                return this.viewMonthOverMonthDirection === 'up'
            },

            visitsAreTrendingUp() {
                return this.visitMonthOverMonthDirection === 'up'
            }
        }
    }
</script>

<style scoped>
    img {
        width: 15px;
        height: 15px;
    }
</style>
