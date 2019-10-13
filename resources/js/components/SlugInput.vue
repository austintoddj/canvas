<template>
    <input type="text" class="form-control border-0 px-0" v-model="i_slug"/>
</template>

<script>
    export default {
        name: "SlugInput",

        created() {
            window.eventHub.$on('title-change', this.updateSlug);
        },
        beforeDestroy() {
            window.eventHub.$off('title-change');
        },

        props:{
            slug:{
                default: '',
                type: String,
            }
        },

        data(){
            return {
                i_slug: '',
            }
        },

        methods:{
            updateSlug(title){
                this.i_slug = this.slugify(title);
            },

            slugify(text = '') {
                return text.toString().toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w\-]+/g, '')
                    .replace(/--+/g, '-')
            }
        }
    }
</script>

<style scoped>

</style>
