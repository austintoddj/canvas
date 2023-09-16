<!--<template>-->
<!--    <MobileSidebar-->
<!--        :open="sidebarOpen"-->
<!--        @close-sidebar="closeSidebar"-->
<!--        @logout="logout"-->
<!--    />-->
<!--    <DesktopSidebar @logout="logout" />-->
<!--    <div class="flex flex-1 flex-col md:pl-64">-->
<!--        <div-->
<!--            class="sticky top-0 z-10 bg-white dark:bg-gray-800 pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden"-->
<!--        >-->
<!--            <button-->
<!--                type="button"-->
<!--                class="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"-->
<!--                @click="openSidebar"-->
<!--            >-->
<!--                <span class="sr-only">{{ trans.open_sidebar }}</span>-->
<!--                <Bars3Icon class="h-6 w-6" aria-hidden="true" />-->
<!--            </button>-->
<!--        </div>-->
<!--        <main class="flex-1">-->
<!--            <RouterView :key="route.query"></RouterView>-->
<!--        </main>-->
<!--    </div>-->
<!--    <CommandPalette ref="palette"></CommandPalette>-->
<!--    <SimpleNotification-->
<!--        v-if="!config.assetsUpToDate"-->
<!--        type="update"-->
<!--        :title="trans.heads_up_loud"-->
<!--        :description="trans.new_assets_are_available_to_publish"-->
<!--        url="https://github.com/austintoddj/canvas#updates"-->
<!--    ></SimpleNotification>-->
<!--</template>-->

<!--<script setup>-->
<!--import { computed, ref, onMounted } from 'vue'-->
<!--import { Bars3Icon } from '@heroicons/vue/24/outline'-->
<!--import { useStore } from 'vuex'-->
<!--import CommandPalette from '@/components/CommandPalette'-->
<!--import MobileSidebar from '@/components/MobileSidebar'-->
<!--import DesktopSidebar from '@/components/DesktopSidebar'-->
<!--import request from '@/utils/request'-->
<!--import {-->
<!--    setDarkTheme,-->
<!--    setLightTheme,-->
<!--    prefersDarkColorScheme-->
<!--} from '@/utils/theme'-->
<!--import { useRoute } from 'vue-router'-->
<!--import SimpleNotification from '@/components/SimpleNotification'-->

<!--const route = useRoute()-->
<!--const store = useStore()-->
<!--const config = computed(() => store.state.config)-->
<!--const trans = computed(() => store.getters['config/trans'])-->
<!--const palette = ref(null)-->
<!--const sidebarOpen = ref(false)-->

<!--function openSidebar() {-->
<!--    sidebarOpen.value = true-->
<!--}-->

<!--function closeSidebar() {-->
<!--    sidebarOpen.value = false-->
<!--}-->

<!--function logout() {-->
<!--    return request.post('logout').then(() => {-->
<!--        window.location.href =-->
<!--            config.value.path === '' ? '/' : config.value.path-->
<!--    })-->
<!--}-->

<!--onMounted(() => {-->
<!--    // Set the theme on initial page load-->
<!--    if (-->
<!--        store.getters['config/isDarkAppearance'] ||-->
<!--        (store.getters['config/isSystemAppearance'] && prefersDarkColorScheme())-->
<!--    ) {-->
<!--        setDarkTheme()-->
<!--    } else {-->
<!--        setLightTheme()-->
<!--    }-->

<!--    // Watch for OS System changes-->
<!--    window-->
<!--        .matchMedia('(prefers-color-scheme: dark)')-->
<!--        .addEventListener('change', function () {-->
<!--            if (-->
<!--                store.getters['config/isDarkAppearance'] ||-->
<!--                (store.getters['config/isSystemAppearance'] &&-->
<!--                    prefersDarkColorScheme())-->
<!--            ) {-->
<!--                setDarkTheme()-->
<!--            } else {-->
<!--                setLightTheme()-->
<!--            }-->
<!--        })-->
<!--})-->
<!--</script>-->

<template>
    <div>
        <TransitionRoot as="template" :show="sidebarOpen">
            <Dialog
                as="div"
                class="relative z-50 xl:hidden"
                @close="closeSidebar"
            >
                <TransitionChild
                    as="template"
                    enter="transition-opacity ease-linear duration-300"
                    enter-from="opacity-0"
                    enter-to="opacity-100"
                    leave="transition-opacity ease-linear duration-300"
                    leave-from="opacity-100"
                    leave-to="opacity-0"
                >
                    <div class="fixed inset-0 bg-gray-900/80" />
                </TransitionChild>

                <div class="fixed inset-0 flex">
                    <TransitionChild
                        as="template"
                        enter="transition ease-in-out duration-300 transform"
                        enter-from="-translate-x-full"
                        enter-to="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leave-from="translate-x-0"
                        leave-to="-translate-x-full"
                    >
                        <DialogPanel
                            class="relative mr-16 flex w-full max-w-xs flex-1"
                        >
                            <TransitionChild
                                as="template"
                                enter="ease-in-out duration-300"
                                enter-from="opacity-0"
                                enter-to="opacity-100"
                                leave="ease-in-out duration-300"
                                leave-from="opacity-100"
                                leave-to="opacity-0"
                            >
                                <div
                                    class="absolute left-full top-0 flex w-16 justify-center pt-5"
                                >
                                    <button
                                        type="button"
                                        class="-m-2.5 p-2.5"
                                        @click="closeSidebar"
                                    >
                                        <span class="sr-only">{{
                                            trans.close_sidebar
                                        }}</span>
                                        <XMarkIcon
                                            class="h-6 w-6 text-white"
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>
                            </TransitionChild>
                            <!-- Sidebar component, swap this element with another sidebar if you like -->
                            <div
                                class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 ring-1 ring-white/10"
                            >
                                <div class="flex h-16 shrink-0 items-center">
                                    <img
                                        class="h-8 w-auto"
                                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                                        alt="Your Company"
                                    />
                                </div>
                                <nav class="flex flex-1 flex-col">
                                    <ul
                                        role="list"
                                        class="flex flex-1 flex-col gap-y-7"
                                    >
                                        <li>
                                            <ul
                                                role="list"
                                                class="-mx-2 space-y-1"
                                            >
                                                <li
                                                    v-for="item in navigation"
                                                    :key="item.name"
                                                >
                                                    <a
                                                        :href="item.href"
                                                        :class="[
                                                            item.current
                                                                ? 'bg-gray-800 text-white'
                                                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                        ]"
                                                    >
                                                        <component
                                                            :is="item.icon"
                                                            class="h-6 w-6 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                        {{ item.name }}
                                                    </a>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <div
                                                class="text-xs font-semibold leading-6 text-gray-400"
                                            >
                                                Your teams
                                            </div>
                                            <ul
                                                role="list"
                                                class="-mx-2 mt-2 space-y-1"
                                            >
                                                <li
                                                    v-for="team in teams"
                                                    :key="team.name"
                                                >
                                                    <a
                                                        :href="team.href"
                                                        :class="[
                                                            team.current
                                                                ? 'bg-gray-800 text-white'
                                                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                        ]"
                                                    >
                                                        <span
                                                            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
                                                            >{{
                                                                team.initial
                                                            }}</span
                                                        >
                                                        <span
                                                            class="truncate"
                                                            >{{
                                                                team.name
                                                            }}</span
                                                        >
                                                    </a>
                                                </li>
                                            </ul>
                                        </li>
                                        <li class="-mx-6 mt-auto">
                                            <a
                                                href="#"
                                                class="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-white hover:bg-gray-800"
                                            >
                                                <img
                                                    class="h-8 w-8 rounded-full bg-gray-800"
                                                    :src="
                                                        user.avatar ||
                                                        user.default_avatar
                                                    "
                                                    :alt="user.name"
                                                />
                                                <span class="sr-only">{{
                                                    trans.view_profile
                                                }}</span>
                                                <span aria-hidden="true">{{
                                                    user.name
                                                }}</span>
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Static sidebar for desktop -->
        <div
            class="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col"
        >
            <!-- Sidebar component, swap this element with another sidebar if you like -->
            <div
                class="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 ring-1 ring-white/5"
            >
                <div class="flex h-16 shrink-0 items-center">
                    <img
                        class="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                        alt="Your Company"
                    />
                </div>
                <nav class="flex flex-1 flex-col">
                    <ul role="list" class="flex flex-1 flex-col gap-y-7">
                        <li>
                            <ul role="list" class="-mx-2 space-y-1">
                                <li v-for="item in navigation" :key="item.name">
                                    <a
                                        :href="item.href"
                                        :class="[
                                            item.current
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                        ]"
                                    >
                                        <component
                                            :is="item.icon"
                                            class="h-6 w-6 shrink-0"
                                            aria-hidden="true"
                                        />
                                        {{ item.name }}
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <div
                                class="text-xs font-semibold leading-6 text-gray-400"
                            >
                                Your teams
                            </div>
                            <ul role="list" class="-mx-2 mt-2 space-y-1">
                                <li v-for="team in teams" :key="team.name">
                                    <a
                                        :href="team.href"
                                        :class="[
                                            team.current
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                        ]"
                                    >
                                        <span
                                            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
                                            >{{ team.initial }}</span
                                        >
                                        <span class="truncate">{{
                                            team.name
                                        }}</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li class="-mx-6 mt-auto">
                            <a
                                href="#"
                                class="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-white hover:bg-gray-800 cursor-pointer"
                            >
                                <img
                                    class="h-8 w-8 rounded-full bg-gray-800"
                                    :src="user.avatar || user.default_avatar"
                                    :alt="user.name"
                                />
                                <span class="sr-only">{{
                                    trans.view_profile
                                }}</span>
                                <span aria-hidden="true">{{ user.name }}</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>

        <div class="xl:pl-72">
            <!-- Sticky search header -->
            <div
                class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-white/5 bg-gray-900 px-4 shadow-sm sm:px-6 lg:px-8"
            >
                <button
                    type="button"
                    class="-m-2.5 p-2.5 text-white xl:hidden"
                    @click="openSidebar"
                >
                    <span class="sr-only">Open sidebar</span>
                    <Bars3Icon class="h-5 w-5" aria-hidden="true" />
                </button>

                <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                    <form class="flex flex-1" action="#" method="GET">
                        <label for="search-field" class="sr-only">Search</label>
                        <div class="relative w-full">
                            <MagnifyingGlassIcon
                                class="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-500"
                                aria-hidden="true"
                            />
                            <input
                                id="search-field"
                                class="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white focus:ring-0 sm:text-sm"
                                placeholder="Search..."
                                type="search"
                                name="search"
                            />
                        </div>
                    </form>
                </div>
            </div>

            <main class="lg:pr-96">
                <header
                    class="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
                >
                    <h1 class="text-base font-semibold leading-7 text-white">
                        Deployments
                    </h1>

                    <!-- Sort dropdown -->
                    <Menu as="div" class="relative">
                        <MenuButton
                            class="flex items-center gap-x-1 text-sm font-medium leading-6 text-white"
                        >
                            Sort by
                            <ChevronUpDownIcon
                                class="h-5 w-5 text-gray-500"
                                aria-hidden="true"
                            />
                        </MenuButton>
                        <transition
                            enter-active-class="transition ease-out duration-100"
                            enter-from-class="transform opacity-0 scale-95"
                            enter-to-class="transform opacity-100 scale-100"
                            leave-active-class="transition ease-in duration-75"
                            leave-from-class="transform opacity-100 scale-100"
                            leave-to-class="transform opacity-0 scale-95"
                        >
                            <MenuItems
                                class="absolute right-0 z-10 mt-2.5 w-40 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                            >
                                <MenuItem v-slot="{ active }">
                                    <a
                                        href="#"
                                        :class="[
                                            active ? 'bg-gray-50' : '',
                                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                                        ]"
                                        >Name</a
                                    >
                                </MenuItem>
                                <MenuItem v-slot="{ active }">
                                    <a
                                        href="#"
                                        :class="[
                                            active ? 'bg-gray-50' : '',
                                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                                        ]"
                                        >Date updated</a
                                    >
                                </MenuItem>
                                <MenuItem v-slot="{ active }">
                                    <a
                                        href="#"
                                        :class="[
                                            active ? 'bg-gray-50' : '',
                                            'block px-3 py-1 text-sm leading-6 text-gray-900'
                                        ]"
                                        >Environment</a
                                    >
                                </MenuItem>
                            </MenuItems>
                        </transition>
                    </Menu>
                </header>

                <!-- Deployment list -->
                <ul role="list" class="divide-y divide-white/5">
                    <li
                        v-for="deployment in deployments"
                        :key="deployment.id"
                        class="relative flex items-center space-x-4 px-4 py-4 sm:px-6 lg:px-8"
                    >
                        <div class="min-w-0 flex-auto">
                            <div class="flex items-center gap-x-3">
                                <div
                                    :class="[
                                        statuses[deployment.status],
                                        'flex-none rounded-full p-1'
                                    ]"
                                >
                                    <div
                                        class="h-2 w-2 rounded-full bg-current"
                                    />
                                </div>
                                <h2
                                    class="min-w-0 text-sm font-semibold leading-6 text-white"
                                >
                                    <a
                                        :href="deployment.href"
                                        class="flex gap-x-2"
                                    >
                                        <span class="truncate">{{
                                            deployment.teamName
                                        }}</span>
                                        <span class="text-gray-400">/</span>
                                        <span class="whitespace-nowrap">{{
                                            deployment.projectName
                                        }}</span>
                                        <span class="absolute inset-0" />
                                    </a>
                                </h2>
                            </div>
                            <div
                                class="mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-gray-400"
                            >
                                <p class="truncate">
                                    {{ deployment.description }}
                                </p>
                                <svg
                                    viewBox="0 0 2 2"
                                    class="h-0.5 w-0.5 flex-none fill-gray-300"
                                >
                                    <circle cx="1" cy="1" r="1" />
                                </svg>
                                <p class="whitespace-nowrap">
                                    {{ deployment.statusText }}
                                </p>
                            </div>
                        </div>
                        <div
                            :class="[
                                environments[deployment.environment],
                                'rounded-full flex-none py-1 px-2 text-xs font-medium ring-1 ring-inset'
                            ]"
                        >
                            {{ deployment.environment }}
                        </div>
                        <ChevronRightIcon
                            class="h-5 w-5 flex-none text-gray-400"
                            aria-hidden="true"
                        />
                    </li>
                </ul>
            </main>

            <!-- Activity feed -->
            <aside
                class="bg-black/10 lg:fixed lg:bottom-0 lg:right-0 lg:top-16 lg:w-96 lg:overflow-y-auto lg:border-l lg:border-white/5"
            >
                <header
                    class="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
                >
                    <h2 class="text-base font-semibold leading-7 text-white">
                        Activity feed
                    </h2>
                    <a
                        href="#"
                        class="text-sm font-semibold leading-6 text-indigo-400"
                        >View all</a
                    >
                </header>
                <ul role="list" class="divide-y divide-white/5">
                    <li
                        v-for="item in activityItems"
                        :key="item.commit"
                        class="px-4 py-4 sm:px-6 lg:px-8"
                    >
                        <div class="flex items-center gap-x-3">
                            <img
                                :src="item.user.imageUrl"
                                alt=""
                                class="h-6 w-6 flex-none rounded-full bg-gray-800"
                            />
                            <h3
                                class="flex-auto truncate text-sm font-semibold leading-6 text-white"
                            >
                                {{ item.user.name }}
                            </h3>
                            <time
                                :datetime="item.dateTime"
                                class="flex-none text-xs text-gray-600"
                                >{{ item.date }}</time
                            >
                        </div>
                        <p class="mt-3 truncate text-sm text-gray-500">
                            Pushed to
                            <span class="text-gray-400">{{
                                item.projectName
                            }}</span>
                            (<span class="font-mono text-gray-400">{{
                                item.commit
                            }}</span>
                            on
                            <span class="text-gray-400">{{ item.branch }}</span
                            >)
                        </p>
                    </li>
                </ul>
            </aside>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
    Dialog,
    DialogPanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    TransitionChild,
    TransitionRoot
} from '@headlessui/vue'
import {
    ChartBarSquareIcon,
    Cog6ToothIcon,
    FolderIcon,
    GlobeAltIcon,
    ServerIcon,
    SignalIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'
import {
    Bars3Icon,
    ChevronRightIcon,
    ChevronUpDownIcon,
    MagnifyingGlassIcon
} from '@heroicons/vue/20/solid'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import request from '@/utils/request'

const route = useRoute()
const store = useStore()
const config = computed(() => store.state.config)
const user = computed(() => store.state.config.user)
const trans = computed(() => store.getters['config/trans'])
const sidebarOpen = ref(false)

const navigation = [
    { name: 'Projects', href: '#', icon: FolderIcon, current: false },
    { name: 'Deployments', href: '#', icon: ServerIcon, current: true },
    { name: 'Activity', href: '#', icon: SignalIcon, current: false },
    { name: 'Domains', href: '#', icon: GlobeAltIcon, current: false },
    { name: 'Usage', href: '#', icon: ChartBarSquareIcon, current: false },
    { name: 'Settings', href: '#', icon: Cog6ToothIcon, current: false }
]
const teams = [
    { id: 1, name: 'Planetaria', href: '#', initial: 'P', current: false },
    { id: 2, name: 'Protocol', href: '#', initial: 'P', current: false },
    { id: 3, name: 'Tailwind Labs', href: '#', initial: 'T', current: false }
]
const statuses = {
    offline: 'text-gray-500 bg-gray-100/10',
    online: 'text-green-400 bg-green-400/10',
    error: 'text-rose-400 bg-rose-400/10'
}
const environments = {
    Preview: 'text-gray-400 bg-gray-400/10 ring-gray-400/20',
    Production: 'text-indigo-400 bg-indigo-400/10 ring-indigo-400/30'
}
const deployments = [
    {
        id: 1,
        href: '#',
        projectName: 'ios-app',
        teamName: 'Planetaria',
        status: 'online',
        statusText: 'Initiated 1m 32s ago',
        description: 'Deploys from GitHub',
        environment: 'Preview'
    }
    // More deployments...
]
const activityItems = [
    {
        user: {
            name: 'Michael Foster',
            imageUrl:
                'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        projectName: 'ios-app',
        commit: '2d89f0c8',
        branch: 'main',
        date: '1h',
        dateTime: '2023-01-23T11:00'
    }
    // More items...
]

function openSidebar() {
    sidebarOpen.value = true
}

function closeSidebar() {
    sidebarOpen.value = false
}

function logout() {
    return request.post('logout').then(() => {
        window.location.href =
            config.value.path === '' ? '/' : config.value.path
    })
}
</script>
