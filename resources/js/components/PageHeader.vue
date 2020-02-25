<template>
    <div class="shadow">
        <div class="col-xl-10 offset-xl-1 px-xl-5 col-md-12">
            <nav class="navbar justify-content-between flex-nowrap flex-row py-2 px-0">
                <router-link to="/" class="navbar-brand">
                    <svg data-name="Logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 110.981" width="30">
                        <path class="logo-secondary" d="M4.808 100.34c4.66-3.767 11.309-2.044 16.167.307 2.856 1.382 5.563 3.046 8.399 4.468a61.637 61.637 0 008.568 3.538c11.478 3.727 23.997 3.29 34.205-3.595a51.44 51.44 0 0013.321-13.613c1.1-1.592-1.498-3.094-2.59-1.515-6.486 9.38-15.876 17.099-27.622 18.026a43.71 43.71 0 01-18.16-2.759c-5.845-2.102-10.93-5.643-16.62-8.052-5.764-2.44-12.641-3.087-17.79 1.073-1.501 1.213.633 3.324 2.122 2.121zM21.8 66.342L5.422 74.049a.768.768 0 00-.417.503A44.368 44.368 0 01.025 93.85a.768.768 0 00.933.936 42.063 42.063 0 0119.623-4.983.768.768 0 00.511-.43l7.384-16.371a.768.768 0 00-.157-.86l-5.649-5.648a.768.768 0 00-.87-.151z"/>
                        <path class="logo-secondary" d="M96 13.467a13.424 13.424 0 01-4.76 10.271L40.434 67.334l-5.855 4.97a5.744 5.744 0 01-7.77-.324l-4.282-4.28a5.741 5.741 0 01-.282-7.813l6.282-7.24L72.363 4.643A13.466 13.466 0 0196 13.467z"/>
                        <path class="logo-primary" d="M41.388 66.38l-6.808 5.923a5.744 5.744 0 01-7.77-.323l-4.283-4.28a5.741 5.741 0 01-.282-7.813l6.282-7.24z"/>
                    </svg>
                </router-link>

                <ul class="navbar-nav mr-auto flex-row float-right">
                    <li class="text-muted font-weight-bold">
                        <slot name="status" />
                    </li>
                </ul>

                <div class="my-auto ml-auto d-flex align-items-end align-middle">
                    <slot name="action" />
                </div>

                <slot name="menu" />

                <div class="dropdown ml-3" v-cloak>
                    <a href="#" id="navbarDropdown" class="nav-link px-0 text-secondary" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <img :src="avatar" :alt="user.name" class="rounded-circle my-0 shadow-inner" style="width: 31px"/>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
                        <h6 class="dropdown-header">
                            <strong>{{ user.name }}</strong>
                            <br/>
                            {{ user.email }}
                        </h6>
                        <div class="dropdown-divider"></div>

                        <router-link to="/posts" class="dropdown-item">
                            <span>{{ trans.app.posts_simple }}</span>
                        </router-link>
                        <router-link to="/tags" class="dropdown-item">
                            <span>{{ trans.app.tags }}</span>
                        </router-link>
                        <router-link to="/topics" class="dropdown-item">
                            <span>{{ trans.app.topics }}</span>
                        </router-link>
                        <router-link to="/stats" class="dropdown-item">
                            <span>{{ trans.app.stats }}</span>
                        </router-link>
                        <div class="dropdown-divider"></div>
                        <router-link to="/settings" class="dropdown-item">
                            <span>{{ trans.app.settings }}</span>
                        </router-link>
                        <a href="" class="dropdown-item" @click.prevent="sessionLogout">
                            {{ trans.app.sign_out }}
                        </a>
                    </div>
                </div>
            </nav>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'page-header',

        data() {
            return {
                user: Canvas.user,
                avatar: this.$root.avatar,
                token: this.getToken(),
                trans: JSON.parse(Canvas.lang),
            }
        },

        watch: {
            '$root.avatar': function(url){
                this.avatar = url
            }
        },

        methods: {
            sessionLogout() {
                this.logout()
            },
        },
    }
</script>
