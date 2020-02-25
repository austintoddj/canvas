<template>
    <multiselect
        v-model="value"
        :placeholder="trans.app.select_some_tags"
        :tag-placeholder="trans.app.add_a_new_tag"
        :options="options"
        :multiple="true"
        :taggable="true"
        @input="onChange"
        @tag="addTag"
        label="name"
        track-by="slug"
        style="cursor: pointer"
    />
</template>

<script>
    import Multiselect from 'vue-multiselect'

    export default {
        props: {
            tags: {
                type: Array,
                required: false,
            },
            tagged: {
                type: Array,
                required: false,
            },
        },

        components: {
            Multiselect,
        },

        data() {
            const allTags = this.tags.map(obj => {
                let filtered = {}

                filtered['name'] = obj.name
                filtered['slug'] = obj.slug

                return filtered
            })

            return {
                options: allTags,
                value: this.tagged ? this.tagged : [],
                trans: JSON.parse(Canvas.lang),
            }
        },

        methods: {
            onChange(value, id) {
                this.$store.dispatch('setPostTags', value)

                this.update()
            },

            addTag(searchQuery) {
                const tag = {
                    name: searchQuery,
                    slug: this.slugify(searchQuery),
                    user_id: Canvas.user.id
                }

                this.options.push(tag)
                this.value.push(tag)

                this.$store.dispatch('setPostTags', this.value)

                this.update()
            },

            update() {
                this.$parent.update()
            },
        },
    }
</script>
