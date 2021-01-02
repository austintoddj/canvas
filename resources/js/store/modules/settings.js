import request from '../../mixins/request';

const initialState = {
    i18n: window.Canvas.translations,
    languageCodes: window.Canvas.languageCodes,
    maxUpload: window.Canvas.maxUpload,
    path: window.Canvas.path,
    timezone: window.Canvas.timezone,
    unsplash: window.Canvas.unsplash,
    user: window.Canvas.user,
    version: window.Canvas.version,
    roles: window.Canvas.roles,
    logo: window.Canvas.logo,
};

const state = { ...initialState };

const actions = {
    updateDigest(context, payload) {
        request.methods
            .request()
            .post(`/api/users/${state.user.id}`, {
                name: state.user.name,
                email: state.user.email,
                digest: payload,
            })
            .then(({ data }) => {
                context.commit('UPDATE_DIGEST', data.user);
            });
    },

    updateLocale(context, payload) {
        request.methods
            .request()
            .post(`/api/users/${state.user.id}`, {
                name: state.user.name,
                email: state.user.email,
                locale: payload,
            })
            .then(({ data }) => {
                context.commit('UPDATE_LOCALE', data);
            });
    },

    updateDarkMode(context, payload) {
        request.methods
            .request()
            .post(`/api/users/${state.user.id}`, {
                name: state.user.name,
                email: state.user.email,
                dark_mode: payload,
            })
            .then(({ data }) => {
                context.commit('UPDATE_DARK_MODE', data.user);
            });
    },

    setUser(context, user) {
        context.commit('SET_USER', user);
    },
};

const mutations = {
    UPDATE_DIGEST(state, user) {
        state.user.digest = user.digest;
    },

    UPDATE_LOCALE(state, data) {
        state.i18n = data.i18n;
        state.user.locale = data.user.locale;
    },

    UPDATE_DARK_MODE(state, user) {
        state.user.dark_mode = user.dark_mode;
    },

    SET_USER(state, user) {
        state.user = user;
    },
};

const getters = {
    trans(state) {
        return JSON.parse(state.i18n);
    },

    isContributor(state) {
        return state.user.role === 1;
    },

    isEditor(state) {
        return state.user.role === 2;
    },

    isAdmin(state) {
        return state.user.role === 3;
    },
    
    logo(state) { 
        return state.logo
    }
};

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters,
};
