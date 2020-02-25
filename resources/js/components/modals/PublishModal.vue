<template>
    <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header d-flex align-items-center justify-content-between border-0">
                    <h4 class="modal-title">
                        {{ trans.app.publishing }}
                    </h4>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" class="icon-close-circle">
                            <circle cx="12" cy="12" r="10" class="primary"/>
                            <path class="fill-bg" d="M13.41 12l2.83 2.83a1 1 0 0 1-1.41 1.41L12 13.41l-2.83 2.83a1 1 0 1 1-1.41-1.41L10.59 12 7.76 9.17a1 1 0 0 1 1.41-1.41L12 10.59l2.83-2.83a1 1 0 0 1 1.41 1.41L13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="text-muted">
                        {{ trans.app.post_scheduling_format }} <span class="font-weight-bold">{{ Canvas.timezone }}</span> {{ trans.app.timezone }}. (m/d/y h:m)
                    </p>

                    <div class="row">
                        <div class="col-sm-6 col-12 pb-sm-0 pb-3 pr-sm-0 d-flex justify-content-center justify-content-sm-start">
                            <div class="d-flex align-items-center">
                                <select :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'" class="w-auto custom-select custom-select-sm border-0" v-model="components.month">
                                    <option v-for="value in Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))" :value="value">
                                        {{ value }}
                                    </option>
                                </select>

                                <span class="px-1">/</span>
                                <select :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'" class="w-auto custom-select custom-select-sm border-0" v-model="components.day">
                                    <option v-for="value in Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))" :value="value">
                                        {{ value }}
                                    </option>
                                </select>

                                <span class="px-1">/</span>
                                <select :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'" class="w-auto custom-select custom-select-sm border-0" v-model="components.year">
                                    <option v-for="value in Array.from({ length: 15 }, (_, i) => i + new Date().getFullYear() - 10)" :value="value">
                                        {{ value }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="col-sm-6 col-12 pl-sm-0 d-flex justify-content-center justify-content-sm-start">
                            <div class="d-flex align-items-center">
                                <select :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'" class="w-auto custom-select custom-select-sm border-0" v-model="components.hour">
                                    <option v-for="value in Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))" :value="value">
                                        {{ value }}
                                    </option>
                                </select>

                                <span class="px-1">:</span>
                                <select :class="!Canvas.darkMode ? 'bg-light': 'bg-darker'" class="w-auto custom-select custom-select-sm border-0" v-model="components.minute">
                                    <option v-for="value in Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))" :value="value">
                                        {{ value }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <p class="mt-3 text-success font-italic" v-if="isScheduled">
                        {{ trans.app.your_post_will_publish_at }} {{ moment(this.activePost.published_at).format('h:mm A') }} {{ trans.app.on }} {{ moment(this.activePost.published_at).format('MMMM DD, YYYY') }}.
                    </p>
                </div>
                <div class="modal-footer">
                    <div class="row w-100">
                        <div class="col-lg order-lg-last px-0">
                            <a href="#" v-if="shouldPublish" class="btn btn-success btn-block font-weight-bold mt-0" @click="scheduleOrPublish" data-dismiss="modal">
                                {{ trans.app.publish_now }}
                            </a>

                            <a href="#" v-else class="btn btn-success btn-block font-weight-bold mt-0" @click="scheduleOrPublish">
                                {{ trans.app.schedule_to_publish }}
                            </a>
                        </div>

                        <div class="col-lg order-lg-first px-0">
                            <button
                                v-if="isScheduled"
                                @click="cancelScheduling"
                                type="button"
                                class="btn btn-link btn-block text-muted font-weight-bold text-decoration-none"
                                data-dismiss="modal">
                                {{ trans.app.cancel_scheduling }}
                            </button>

                            <button
                                v-else
                                type="button"
                                class="btn btn-link btn-block text-muted font-weight-bold text-decoration-none"
                                data-dismiss="modal">
                                {{ trans.app.cancel }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import moment from 'moment'
    import {mapState} from 'vuex'

    export default {
        name: 'publish-modal',

        data() {
            return {
                components: {
                    day: '',
                    month: '',
                    year: '',
                    hour: '',
                    minute: '',
                },
                result: '',
                trans: JSON.parse(Canvas.lang),
            }
        },

        computed: {
            ...mapState(['activePost']),

            shouldPublish() {
                return moment(this.result).isBefore(
                    moment(new Date())
                        .format()
                        .slice(0, 19)
                        .replace('T', ' ')
                )
            },

            isScheduled() {
                return (
                    this.activePost.published_at &&
                    moment(this.result).isAfter(
                        moment(new Date())
                            .format()
                            .slice(0, 19)
                            .replace('T', ' ')
                    )
                )
            },
        },

        mounted() {
            this.generateDatePicker(
                this.activePost.published_at ||
                moment(new Date())
                    .format()
                    .slice(0, 19)
                    .replace('T', ' ')
            )
        },

        watch: {
            value(val) {
                this.generateDatePicker(val)
            },

            components: {
                handler: function () {
                    this.result =
                        this.components.year +
                        '-' +
                        this.components.month +
                        '-' +
                        this.components.day +
                        ' ' +
                        this.components.hour +
                        ':' +
                        this.components.minute +
                        ':00'
                },

                deep: true,
            },
        },

        filters: {
            moment: function (date) {
                return moment.tz(date).format('YYYY-MM-DD hh:mm:ss')
            },
        },

        methods: {
            generateDatePicker(val) {
                let date = moment(val + ' Z').utc()

                this.components = {
                    month: date.format('MM'),
                    day: date.format('DD'),
                    year: date.format('YYYY'),
                    hour: date.format('HH'),
                    minute: date.format('mm'),
                }
            },

            scheduleOrPublish() {
                this.activePost.published_at = this.result
                this.$parent.save()
            },

            cancelScheduling() {
                this.activePost.published_at = ''
                this.$parent.save()
            },
        },
    }
</script>

<style lang="scss">
    .bg-darker {
        background-color: #71809630;
    }
</style>
