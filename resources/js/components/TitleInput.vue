<template>
    <textarea
        :placeholder="placeholder"
        name="title"
        class="form-control-lg form-control border-0 pl-0 serif"
        rows="1"
        v-model="title"
        @input="titleChange">
    </textarea>
</template>

<script>
    export default {
        name: "TitleInput",
        props: {
            placeholder: {
                default: '',
                type: String,
            },

            value: {
                default: '',
                type: String,
            },
        },

        data() {
            return {
                title: this.value,
            }
        },

        methods: {
            titleChange() {
                window.eventHub.$emit('title-change', this.title);
            }
        }
    }
</script>

<style scoped>
    textarea {
        font-size: 42px;
        resize: none;
    }
</style>
