<template>
    <div class="modal fade" ref="modal" tabindex="-1" role="dialog" aria-hidden="true" v-cloak>
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-body">
                    <p>{{ trans.app.paste_a_video_link }}</p>
                    <input
                        type="text"
                        ref="link"
                        @keyup.enter="addLink"
                        v-model="link"
                        :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'"
                        class="form-control border-0"
                        name="link"
                        placeholder="https://youtu.be/jNQXAC9IVRw"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery'

    export default {
        name: 'embed-video-modal',

        data() {
            return {
                link: '',
                trans: JSON.parse(Canvas.lang),
            }
        },

        methods: {
            addLink() {
                this.$emit('addingEmbedVideo', {
                    url: this.link,
                })

                $(this.$refs.modal).modal('hide')
                this.link = ''
            },
        },
    }
</script>
