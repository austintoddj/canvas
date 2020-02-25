<template>
    <div>
        <page-header>
            <template slot="status">
                <ul class="navbar-nav mr-auto flex-row float-right">
                    <li class="text-muted font-weight-bold">
                        <span v-if="form.isSaving">{{ trans.app.saving }}</span>
                        <span v-if="form.hasSuccess" class="text-success">{{ trans.app.saved }}</span>
                    </li>
                </ul>
            </template>
        </page-header>

        <main class="py-4">
            <div class="col-xl-10 offset-xl-1 px-xl-5 col-md-12 my-3">
                <div class="d-flex justify-content-between my-3">
                    <h1>{{ trans.app.your_profile }}</h1>
                </div>

                <div class="mt-2" v-if="isReady">
                    <div class="d-flex border-top py-3 align-items-center">
                        <div class="mr-auto py-1">
                            <p class="mb-1 font-weight-bold text-lg lead">
                                {{ trans.app.your_profile }}
                            </p>
                            <p class="mb-1 d-none d-lg-block">
                                {{ trans.app.choose_a_unique_username }}
                            </p>
                        </div>
                        <div class="ml-auto pl-3">
                            <div class="align-middle">
                                <button class="btn btn-sm btn-outline-success font-weight-bold" @click="showProfileModal">
                                    {{ trans.app.edit_profile }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex border-top py-3 align-items-center">
                        <div class="mr-auto py-1">
                            <p class="mb-1 font-weight-bold text-lg lead">
                                {{ trans.app.weekly_digest }}
                            </p>
                            <p class="mb-1 d-none d-lg-block">
                                {{ trans.app.toggle_digest }}
                            </p>
                        </div>
                        <div class="ml-auto pl-3">
                            <div class="align-middle">
                                <div class="form-group my-auto">
                                    <span class="switch switch-sm">
                                        <input
                                            type="checkbox"
                                            class="switch"
                                            id="digest"
                                            @change="toggleDigest"
                                            :checked="form.digest"
                                            v-model="form.digest"
                                        />
                                        <label for="digest" class="mb-0 sr-only">
                                            {{ trans.app.weekly_digest }}
                                        </label>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex border-top py-3 align-items-center">
                        <div class="mr-auto py-1">
                            <p class="mb-1 font-weight-bold text-lg lead">
                                {{ trans.app.dark_mode }}
                            </p>
                            <p class="mb-1 d-none d-lg-block">
                                {{ trans.app.toggle_dark_mode }}
                            </p>
                        </div>
                        <div class="ml-auto pl-3">
                            <div class="align-middle">
                                <div class="form-group my-auto">
                                    <span class="switch switch-sm">
                                        <input
                                            type="checkbox"
                                            class="switch"
                                            id="darkMode"
                                            @change="toggleDarkMode"
                                            :checked="form.darkMode"
                                            v-model="form.darkMode"
                                        />
                                        <label for="darkMode" class="mb-0 sr-only">
                                            {{ trans.app.dark_mode }}
                                        </label>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <profile-modal
            v-if="isReady"
            ref="profileModal"
            :form="form"
        />
    </div>
</template>

<script>
    import $ from 'jquery'
    import NProgress from 'nprogress'
    import PageHeader from '../../components/PageHeader'
    import ProfileModal from '../../components/modals/ProfileModal'

    export default {
        name: 'settings-show',

        components: {
            PageHeader,
            ProfileModal
        },

        data() {
            return {
                form: {
                    username: null,
                    summary: null,
                    avatar: null,
                    digest: false,
                    darkMode: 0,
                    errors: [],
                    isSaving: false,
                    hasSuccess: false,
                },
                user: Canvas.user,
                isReady: false,
                trans: JSON.parse(Canvas.lang),
            }
        },

        mounted() {
            this.fetchData()
        },

        methods: {
            fetchData() {
                this.request()
                    .get('/api/settings')
                    .then(response => {
                        this.form.username = response.data.username
                        this.form.summary = response.data.summary
                        this.form.avatar = response.data.avatar
                        this.form.digest = response.data.digest
                        this.form.darkMode = response.data.dark_mode

                        this.isReady = true

                        NProgress.done()
                    })
                    .catch(error => {
                        // Add any error debugging...
                        NProgress.done()
                    })
            },

            saveData(data, withNotification) {
                this.form.errors = []

                if (withNotification) {
                    this.form.isSaving = true
                    this.form.hasSuccess = false
                }

                this.request()
                    .post('/api/settings', data)
                    .then(response => {
                        if (withNotification) {
                            this.form.isSaving = false
                            this.form.hasSuccess = true
                        }

                        this.form.username = response.data.username
                        this.form.summary = response.data.summary
                        this.form.avatar = response.data.avatar
                        this.form.digest = response.data.digest
                        this.form.darkMode = response.data.dark_mode
                    })
                    .catch(error => {
                        this.form.isSaving = false
                        this.form.errors = error.response.data.errors
                    })

                setTimeout(() => {
                    this.form.hasSuccess = false
                    this.form.isSaving = false
                }, 3000)
            },

            toggleDigest() {
                this.saveData({
                    digest: this.form.digest
                }, false)
            },

            toggleDarkMode() {
                this.$root.Canvas.darkMode = this.form.darkMode
                let screen = $('#canvas')
                let isDark = this.form.darkMode

                screen.animate({
                    opacity: 0,
                    backgroundColor: 'rgb(38, 50, 56)'
                }, 300, function() {

                    // todo: There has to be a better way to swap stylesheets than this
                    if (isDark) {
                        $('#baseStylesheet').attr('href', '/vendor/canvas/css/app-dark.css')
                        $('#highlightStylesheet').attr('href', '//cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.17.1/build/styles/sunburst.min.css')
                    } else {
                        $('#baseStylesheet').attr('href', '/vendor/canvas/css/app.css')
                        $('#highlightStylesheet').attr('href', '//cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.17.1/build/styles/github.min.css')
                    }
                })

                screen.animate({
                    opacity: 1,
                    backgroundColor: 'rgb(38, 50, 56)'
                }, 300, function() {
                    //
                })

                this.saveData({
                    dark_mode: isDark
                }, false)
            },

            showProfileModal() {
                $(this.$refs.profileModal.$el).modal('show')
            },

            hideProfileModal() {
                $(this.$refs.profileModal.$el).modal('hide')
            },
        },
    }
</script>
