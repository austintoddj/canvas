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

            <template slot="action">
                <a
                    href="#"
                    class="btn btn-sm btn-outline-success font-weight-bold my-auto"
                    :class="{ disabled: form.name === '' || form.slug === '' }"
                    @click="saveTopic"
                    :aria-label="trans.app.save">
                    {{ trans.app.save }}
                </a>
            </template>

            <template slot="menu">
                <div class="dropdown" v-if="id !== 'create'">
                    <a id="navbarDropdown" class="nav-link pr-0" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="25" class="icon-dots-horizontal">
                            <path class="primary" fill-rule="evenodd" d="M5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
                        </svg>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
                        <a href="#" class="dropdown-item text-danger" @click="showDeleteModal">
                            {{ trans.app.delete }}
                        </a>
                    </div>
                </div>
            </template>
        </page-header>

        <main v-if="isReady" class="py-4" v-cloak>
            <div class="col-xl-8 offset-xl-2 px-xl-5 col-md-12 mt-5">
                <div class="form-group mb-5">
                    <div class="col-lg-12">
                        <input
                            type="text"
                            name="name"
                            autofocus
                            autocomplete="off"
                            v-model="form.name"
                            title="Name"
                            @keyup.enter="saveTopic"
                            class="form-control-lg form-control border-0 px-0 bg-transparent"
                            :placeholder="trans.app.give_your_topic_a_name"
                        />

                        <div v-if="form.errors.name" class="invalid-feedback d-block">
                            <strong>{{ form.errors.name[0] }}</strong>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="col-lg-12">
                        <input
                            type="text"
                            name="slug"
                            autocomplete="off"
                            v-model="form.slug"
                            title="Slug"
                            @keyup.enter="saveTopic"
                            class="form-control-lg form-control border-0 px-0 bg-transparent"
                            :placeholder="trans.app.give_your_topic_a_name_slug"
                        />

                        <div v-if="form.errors.slug" class="invalid-feedback d-block">
                            <strong>{{ form.errors.slug[0] }}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <delete-modal
            ref="deleteModal"
            @delete="deleteTopic"
            :header="trans.app.delete"
            :message="trans.app.deleted_topics_are_gone_forever">
        </delete-modal>
    </div>
</template>

<script>
    import $ from 'jquery'
    import NProgress from 'nprogress'
    import PageHeader from '../../components/PageHeader'
    import DeleteModal from '../../components/modals/DeleteModal'

    export default {
        name: 'topics-edit',

        components: {
            PageHeader,
            DeleteModal,
        },

        data() {
            return {
                topic: null,
                id: this.$route.params.id || 'create',
                form: {
                    id: '',
                    name: '',
                    slug: '',
                    errors: [],
                    isSaving: false,
                    hasSuccess: false,
                },
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
                    .get('/api/topics/' + this.id)
                    .then(response => {
                        this.topic = response.data
                        this.form.id = response.data.id

                        if (this.id !== 'create') {
                            this.form.name = response.data.name
                            this.form.slug = response.data.slug
                        }

                        this.isReady = true

                        NProgress.done()
                    })
                    .catch(error => {
                        this.$router.push({name: 'topics'})
                    })
            },

            saveTopic() {
                this.form.errors = []
                this.form.isSaving = true
                this.form.hasSuccess = false

                this.request()
                    .post('/api/topics/' + this.id, this.form)
                    .then(response => {
                        this.form.isSaving = false
                        this.form.hasSuccess = true
                        this.id = response.data.id
                        this.topic = response.data
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

            deleteTopic() {
                this.request()
                    .delete('/api/topics/' + this.id)
                    .then(response => {
                        $(this.$refs.deleteModal.$el).modal('hide')

                        this.$router.push({name: 'topics'})
                    })
                    .catch(error => {
                        // Add any error debugging...
                    })
            },

            showDeleteModal() {
                $(this.$refs.deleteModal.$el).modal('show')
            },
        },
    }
</script>
