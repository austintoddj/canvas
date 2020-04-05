import Vue from 'vue'
import Vuex from 'vuex'
import {state} from './state'
import {actions} from './actions'
import {mutations} from './mutations'

Vue.use(Vuex)

export const store = new Vuex.Store({
    state: state,
    mutations: mutations,
    actions: actions,
})
