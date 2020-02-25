<template>
    <div class="modal fade" ref="modal" tabindex="-1" role="dialog" aria-hidden="true" v-cloak>
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-body">
                    <p>{{ trans.app.paste_a_link_to_embed_content }}</p>
                    <input
                        type="text"
                        ref="link"
                        @keyup.enter="addLink"
                        v-model="link"
                        :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                        class="form-control border-0"
                        name="link"
                        placeholder="https://twitter.com/jack/status/20"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery'

    export default {
        name: 'embed-link-modal',

        data() {
            return {
                link: '',
                trans: JSON.parse(Canvas.lang),
            }
        },

        methods: {
            addLink() {
                this.$emit('addingEmbedLink', {
                    url: this.link,
                })

                $(this.$refs.modal).modal('hide')
                this.link = ''
            },
        },
    }
</script>
