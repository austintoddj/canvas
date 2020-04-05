import get from 'lodash/get'

export const mutations = {
    SET_POST(state, payload) {
        state.post = payload

        // state.post.id = get(payload, 'id', '');
        // state.post.title = get(payload, 'title', '');
        // state.post.slug = get(payload, 'slug', '');
        // state.post.summary = get(payload, 'summary', '');
        // state.post.body = get(payload, 'body', '');
        // state.post.published_at = get(payload, 'published_at', '');
        // state.post.featured_image = get(payload, 'featured_image', '');
        // state.post.featured_image_caption = get(payload, 'featured_image_caption', '');
        // state.post.user_id = get(payload, 'user_id', '');
        //
        // state.post.meta = {};
        // state.post.meta.description = get(payload, 'meta.description', '');
        // state.post.meta.title = get(payload, 'meta.title', '');
        // state.post.meta.canonical_link = get(payload, 'meta.canonical_link', '');
        //
        // state.post.topic = get(payload, 'topic.0', []);
        // state.post.tags = get(payload, 'tags', []);
        //
        // state.post.errors = [];
    },

    SET_POST_TITLE(state, payload) {
          state.post.title = payload;
    },

    SET_POST_PUBLISHED_AT(state, payload) {
          state.post.published_at = payload;
    },

    SET_POST_TAGS(state, payload) {
        state.post.tags = payload;
    },

    SET_POST_TOPIC(state, payload) {
        state.post.topic = payload;
    },

    DELETE_POST(state, post) {
        this.$app
            .request()
            .delete('/api/posts/' + post.id)
            .then(response => {
                state.post = {};

                this.$app.$router.push({name: 'posts'});
            })
            .catch(error => {
                // Add any error debugging...
            });
    }
};

export default {
    mutations,
};
