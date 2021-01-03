<template>
    <div class="border-bottom">
        <div class="col-xl-8 offset-xl-2 col-lg-10 offset-lg-1 col-md-12">
            <nav class="navbar d-flex px-0 py-1">
                <a :href="basePath" class="navbar-brand hover font-weight-bolder font-serif mr-3">
                    <img v-if="logo" class="h-8 w-auto" :src="logo" />
                </a>

                <slot name="status" />

                <a href="#" class="ml-auto" @click="showSearchModal">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" class="icon-search pr-1">
                        <circle cx="10" cy="10" r="7" style="fill: none" />
                        <path
                            class="fill-light-gray"
                            d="M16.32 14.9l1.1 1.1c.4-.02.83.13 1.14.44l3 3a1.5 1.5 0 0 1-2.12 2.12l-3-3a1.5 1.5 0 0 1-.44-1.14l-1.1-1.1a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
                        />
                    </svg>
                </a>

                <slot name="options" />

                <div v-cloak class="dropdown ml-3">
                    <a
                        id="navbarDropdown"
                        href="#"
                        class="nav-link px-0 text-secondary"
                        role="button"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                    >
                        <img
                            :src="settings.user.avatar || settings.user.default_avatar"
                            :alt="settings.user.name"
                            class="rounded-circle my-0 shadow-inner"
                            style="width: 33px"
                        />
                    </a>
                    <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
                        <h6 class="dropdown-header">
                            <strong>{{ settings.user.name }}</strong>
                            <br />
                            {{ settings.user.email }}
                        </h6>

                        <div class="dropdown-divider" />

                        <router-link :to="{ name: 'stats' }" class="dropdown-item">
                            <span>{{ trans.stats }}</span>
                        </router-link>

                        <router-link
                            :to="{ name: 'edit-user', params: { id: settings.user.id } }"
                            class="dropdown-item"
                        >
                            {{ trans.your_profile }}
                        </router-link>

                        <router-link :to="{ name: 'posts' }" class="dropdown-item">
                            <span>{{ trans.posts }}</span>
                        </router-link>
                        <router-link v-if="isAdmin" :to="{ name: 'users' }" class="dropdown-item">
                            <span>{{ trans.users }}</span>
                        </router-link>
                        <router-link v-if="isAdmin" :to="{ name: 'tags' }" class="dropdown-item">
                            <span>{{ trans.tags }}</span>
                        </router-link>
                        <router-link v-if="isAdmin" :to="{ name: 'topics' }" class="dropdown-item">
                            <span>{{ trans.topics }}</span>
                        </router-link>

                        <div class="dropdown-divider" />

                        <router-link :to="{ name: 'edit-settings' }" class="dropdown-item">
                            <span>{{ trans.settings }}</span>
                        </router-link>
                        <a href="" class="dropdown-item" @click.prevent="logout">
                            {{ trans.sign_out }}
                        </a>
                    </div>
                </div>
            </nav>
        </div>

        <search-modal ref="searchModal" />
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import $ from 'jquery';
import SearchModal from './modals/SearchModal';

export default {
    name: 'page-header',

    components: {
        SearchModal,
    },

    computed: {
        ...mapState(['settings']),
        ...mapGetters({
            isAdmin: 'settings/isAdmin',
            trans: 'settings/trans',
        }),
    },

    data() {
        return {
            logo: window.Canvas.logo,
            basePath: window.Canvas.base_url,
        };
    },

    methods: {
        logout() {
            window.location.href = window.location.href + window.Canvas.path + '/logout';
        },

        showSearchModal() {
            $(this.$refs.searchModal.$el).modal('show');
        },
    },
};
</script>
