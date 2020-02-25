export const actions = {
    setActivePost(context, payload) {
        context.commit('setActivePost', payload)
    },

    updatePostBody(context, body) {
        context.commit('updatePostBody', body)
    },

    saveActivePost(context, payload) {
        context.commit('saveActivePost', payload)
    },

    setPostTags(context, payload) {
        context.commit('setPostTags', payload)
    },

    setPostTopic(context, payload) {
        context.commit('setPostTopic', payload)
    },

    deletePost(context, payload) {
        context.commit('deletePost', payload)
    },
}

export default {
    actions,
}
