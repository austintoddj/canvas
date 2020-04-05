export const actions = {
    CREATE_POST(context, {vm}) {
        vm.request()
            .get('/api/posts/create')
            .then(response => {
                context.commit('SET_POST', response.data.post);
            })
            .catch(error => {
                // Add any error debugging...
            })
    },

    SET_POST_TITLE(context, payload) {
        context.commit('SET_POST_TITLE', payload);
    },

    SET_POST_PUBLISHED_AT(context, payload) {
        context.commit('SET_POST_PUBLISHED_AT', payload);
    },

    SET_POST_TAGS(context, payload) {
        context.commit('SET_POST_TAGS', payload);
    },

    SET_POST_TOPIC(context, payload) {
        context.commit('SET_POST_TOPIC', payload);
    },

    // updatePostBody(context, body) {
    //     context.commit('updatePostBody', body)
    // },

    PUT_POST(context, {vm, payload}) {
        vm.request()
            .post('/api/posts', payload.data)
            .then(response => {
                state.activePost.post = response.data;
            })
            .catch(error => {
                state.activePost.errors = error.response.data.errors;
            });
    },

    DELETE_POST(context, payload) {

    },

    // setPostTags(context, payload) {
    //     context.commit('setPostTags', payload);
    // },
    //
    // setPostTopic(context, payload) {
    //     context.commit('setPostTopic', payload);
    // },

    deletePost(context, payload) {
        context.commit('deletePost', payload);
    },
};

export default {
    actions,
}
