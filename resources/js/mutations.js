import _ from 'lodash'

export const mutations = {
    setActivePost(state, data) {
        let payload = {}

        payload.id = _.get(data, 'id', 'create')
        payload.title = _.get(data, 'title', '')
        payload.slug = _.get(data, 'slug', '')
        payload.summary = _.get(data, 'summary', '')
        payload.body = _.get(data, 'body', '')
        payload.published_at = _.get(data, 'published_at', '')
        payload.featured_image = _.get(data, 'featured_image', '')
        payload.featured_image_caption = _.get(data, 'featured_image_caption', '')

        payload.meta = {}
        payload.meta.description = _.get(data, 'meta.description', '')
        payload.meta.title = _.get(data, 'meta.title', '')
        payload.meta.canonical_link = _.get(data, 'meta.canonical_link', '')

        payload.topic = _.get(data, 'topic.0', [])
        payload.tags = _.get(data, 'tags', [])
        payload.errors = []
        payload.isSaving = false
        payload.hasSuccess = false

        state.activePost = payload
    },

    updatePostBody(state, data) {
        state.activePost.body = data
    },

    saveActivePost(state, payload) {
        this.$app
            .request()
            .post('/api/posts/' + payload.id, payload.data)
            .then(response => {
                if (payload.id === 'create') {
                    this.$app.$router.push({
                        name: 'posts-edit',
                        params: { id: response.data.id },
                    })
                }

                state.activePost.isSaving = false
                state.activePost.hasSuccess = true
                state.activePost.post = response.data
            })
            .catch(error => {
                state.activePost.isSaving = false
                state.activePost.errors = error.response.data.errors
            })
    },

    setPostTags(state, tags) {
        state.activePost.tags = tags
    },

    setPostTopic(state, topic) {
        state.activePost.topic = topic
    },

    deletePost(state, postId) {
        this.$app
            .request()
            .delete('/api/posts/' + postId)
            .then(response => {
                state.activePost = {}

                this.$app.$router.push({ name: 'posts' })
            })
            .catch(error => {
                // Add any error debugging...
            })
    },
}

export default {
    mutations,
}
