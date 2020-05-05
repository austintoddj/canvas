import get from 'lodash/get'

export const mutations = {
    setActivePost(state, data) {
        let payload = {}

        payload.id = get(data, 'id', 'create')
        payload.title = get(data, 'title', '')
        payload.slug = get(data, 'slug', '')
        payload.summary = get(data, 'summary', '')
        payload.body = get(data, 'body', '')
        payload.is_pinned = get(data, 'is_pinned')
        payload.published_at = get(data, 'published_at', '')
        payload.featured_image = get(data, 'featured_image', '')
        payload.featured_image_caption = get(data, 'featured_image_caption', '')

        payload.meta = {}
        payload.meta.description = get(data, 'meta.description', '')
        payload.meta.title = get(data, 'meta.title', '')
        payload.meta.canonical_link = get(data, 'meta.canonical_link', '')

        payload.topic = get(data, 'topic.0', [])
        payload.tags = get(data, 'tags', [])
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
    }
}

export default {
    mutations,
}
