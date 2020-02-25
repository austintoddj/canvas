<template>
    <div>
        <page-header>
            <template slot="action">
                <router-link :to="{ name: 'tags-create' }" class="btn btn-sm btn-outline-success font-weight-bold my-auto">
                    {{ trans.app.new_tag }}
                </router-link>
            </template>
        </page-header>

        <main class="py-4">
            <div class="col-xl-10 offset-xl-1 px-xl-5 col-md-12">
                <div class="d-flex justify-content-between my-3">
                    <h1>{{ trans.app.tags }}</h1>
                </div>

                <div class="mt-2">
                    <div v-for="(tag, $index) in tags" :key="$index" class="d-flex border-top py-3 align-items-center">
                        <div class="mr-auto">
                            <p class="mb-0 py-1">
                                <router-link :to="{name: 'tags-edit', params: { id: tag.id }}" class="font-weight-bold text-lg lead text-decoration-none">
                                    {{ tag.name }}
                                </router-link>
                            </p>
                        </div>
                        <div class="ml-auto">
                            <span class="text-muted mr-3">{{ tag.posts_count }} {{ trans.app.posts }}</span>
                            <span class="d-none d-md-inline-block">{{ trans.app.created }} {{ moment(tag.created_at).locale(Canvas.locale).fromNow() }}</span>
                        </div>
                    </div>

                    <infinite-loading @infinite="fetchData" spinner="spiral">
                        <span slot="no-more"></span>
                        <div slot="no-results" class="text-left">
                            <div class="mt-5">
                                <p class="lead text-center text-muted mt-5 pt-5">
                                    {{ trans.app.you_have_no_tags }}
                                </p>
                                <p class="lead text-center text-muted mt-1">
                                    {{ trans.app.write_on_the_go }}
                                </p>
                            </div>
                        </div>
                    </infinite-loading>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import NProgress from 'nprogress'
    import InfiniteLoading from 'vue-infinite-loading'
    import PageHeader from '../../components/PageHeader'

    export default {
        name: 'tags-index',

        components: {
            InfiniteLoading,
            PageHeader,
        },

        data() {
            return {
                page: 1,
                tags: [],
                trans: JSON.parse(Canvas.lang),
            }
        },

        methods: {
            fetchData($state) {
                this.request()
                    .get('/api/tags', {
                        params: {
                            page: this.page
                        },
                    })
                    .then(response => {
                        if (!_.isEmpty(response.data) && !_.isEmpty(response.data.data)) {
                            this.page += 1;
                            this.tags.push(...response.data.data)

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
            }
        }
    }
</script>
