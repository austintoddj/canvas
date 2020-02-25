import moment from 'moment'

export const getters = {
    activePost(state) {
        return state.activePost
    },

    isDraft(state) {
        const date = state.activePost.published_at

        return (
            date === null ||
            date === '' ||
            moment(date).isAfter(
                moment(new Date())
                    .format()
                    .slice(0, 19)
                    .replace('T', ' ')
            )
        )
    },
}

export default {
    getters,
}
