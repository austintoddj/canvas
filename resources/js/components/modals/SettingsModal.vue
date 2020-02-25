<template>
    <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header d-flex align-items-center justify-content-between border-0">
                    <h4 class="modal-title">{{ trans.app.general_settings }}</h4>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" class="icon-close-circle">
                            <circle cx="12" cy="12" r="10" class="primary"/>
                            <path class="fill-bg" d="M13.41 12l2.83 2.83a1 1 0 0 1-1.41 1.41L12 13.41l-2.83 2.83a1 1 0 1 1-1.41-1.41L10.59 12 7.76 9.17a1 1 0 0 1 1.41-1.41L12 10.59l2.83-2.83a1 1 0 0 1 1.41 1.41L13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group row">
                        <div class="col-12">
                            <label class="font-weight-bold text-uppercase text-muted small">{{ trans.app.slug }}</label>
                            <a
                                href="#"
                                class="text-decoration-none"
                                v-if="activePost.title"
                                v-tooltip="{ placement: 'right' }"
                                :title="trans.app.sync_with_post_title"
                                @click.prevent="syncSlug()">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-refresh" width="25">
                                    <circle cx="12" cy="12" r="10" style="fill:none"/>
                                    <path class="primary" d="M8.52 7.11a5.98 5.98 0 0 1 8.98 2.5 1 1 0 1 1-1.83.8 4 4 0 0 0-5.7-1.86l.74.74A1 1 0 0 1 10 11H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1.7-.7l.82.81zm5.51 8.34l-.74-.74A1 1 0 0 1 14 13h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1.7.7l-.82-.81A5.98 5.98 0 0 1 6.5 14.4a1 1 0 1 1 1.83-.8 4 4 0 0 0 5.7 1.85z"/>
                                </svg>
                            </a>
                            <input
                                type="text"
                                :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                                class="form-control border-0"
                                @input="update"
                                name="slug"
                                v-model="activePost.slug"
                                :title="trans.app.slug"
                                :placeholder="trans.app.a_unique_slug"/>
                            <div v-if="activePost.errors.slug" class="invalid-feedback d-block">
                                <strong>{{ activePost.errors.slug[0] }}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <div class="col-12">
                            <label class="font-weight-bold text-uppercase text-muted small">{{ trans.app.summary }}</label>
                            <textarea
                                rows="4"
                                id="settings"
                                name="summary"
                                style="resize: none"
                                :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                                class="form-control resize-none border-0"
                                v-model="activePost.summary"
                                @input="update"
                                :placeholder="trans.app.a_descriptive_summary">
                            </textarea>
                        </div>
                    </div>
                    <div class="form-group row">
                        <div class="col-12">
                            <label class="font-weight-bold text-uppercase text-muted small">{{ trans.app.topic }}</label>
                            <topic-select :topics="topics" :assigned="activePost.topic"/>
                        </div>
                    </div>
                    <div class="form-group row">
                        <div class="col-12">
                            <label class="font-weight-bold text-uppercase text-muted small">{{ trans.app.tags }}</label>
                            <tag-select :tags="tags" :tagged="activePost.tags"/>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-link btn-block font-weight-bold text-muted text-decoration-none" data-dismiss="modal">
                        {{ trans.app.done }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import _ from 'lodash'
    import {mapState} from 'vuex'
    import TagSelect from '../TagSelect'
    import TopicSelect from '../TopicSelect'
    import Tooltip from '../../directives/Tooltip'

    export default {
        name: 'settings-modal',

        props: {
            tags: {
                type: Array,
                required: false,
            },
            topics: {
                type: Array,
                required: false,
            },
        },

        components: {
            TagSelect,
            TopicSelect,
        },

        directives: {
            Tooltip,
        },

        data() {
            return {
                allTags: [],
                allTopics: [],
                trans: JSON.parse(Canvas.lang),
            }
        },

        computed: mapState(['activePost']),

        mounted() {
            this.allTags = this.tags
            this.allTopics = this.topics
        },

        methods: {
            syncSlug() {
                this.activePost.slug = this.slugify(this.activePost.title)
                this.$parent.save()
            },

            update: _.debounce(function (e) {
                this.$parent.save()
            }, 3000),
        },
    }
</script>
