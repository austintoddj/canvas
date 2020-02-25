<template>
    <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static">
        <div class="modal-dialog" ref="modal" role="document">
            <div class="modal-content">
                <div class="modal-header d-flex align-items-center justify-content-between border-0">
                    <h4 class="modal-title">{{ trans.app.embed_content }}</h4>

                    <button type="button" @click.prevent="closeModal" class="close" data-dismiss="modal" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" class="icon-close-circle">
                            <circle cx="12" cy="12" r="10" class="primary"/>
                            <path class="fill-bg" d="M13.41 12l2.83 2.83a1 1 0 0 1-1.41 1.41L12 13.41l-2.83 2.83a1 1 0 1 1-1.41-1.41L10.59 12 7.76 9.17a1 1 0 0 1 1.41-1.41L12 10.59l2.83-2.83a1 1 0 0 1 1.41 1.41L13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group row">
                        <div class="col-12">
                            <textarea
                                rows="6"
                                id="embed"
                                name="embed"
                                style="resize: none"
                                :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                                class="form-control border-0"
                                v-model="content"
                                :placeholder="trans.app.paste_embed_code_to_include">
                            </textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        class="btn btn-link btn-block text-muted font-weight-bold text-decoration-none"
                        @click="clickDone"
                        data-dismiss="modal">
                        {{ trans.app.done }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import _ from "lodash";

    export default {
        name: 'embed-content-modal',

        data() {
            return {
                blot: null,
                content: null,
                trans: JSON.parse(Canvas.lang),
            }
        },

        mounted() {
            this.$parent.$on('openingEmbedContentModal', data => {
                if (!_.isEmpty(data)) {
                    this.blot = data.existingBlot
                    this.content = data.content
                }
            })
        },

        methods: {
            clickDone() {
                if (!_.isEmpty(this.content)) {
                    this.$emit('addingEmbedContent', {
                        content: this.content,
                        existingBlot: this.blot,
                    })
                }

                this.blot = null
                this.content = ''
            },

            closeModal() {
                this.blot = null
                this.content = null
                this.$refs.modal.hide
            }
        }
    }
</script>
