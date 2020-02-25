<template>
    <div style="height: 300px">
        <canvas id="stats"/>
    </div>
</template>

<script>
    import Vue from 'vue'
    import moment from 'moment'
    import Chart from 'chart.js'

    Vue.prototype.moment = moment

    export default {
        name: 'line-chart',

        components: {
            Chart
        },

        props: {
            views: {
                type: Object,
                required: true,
            },

            visits: {
                type: Object,
                required: true,
            },
        },

        data() {
            return {
                trans: JSON.parse(Canvas.lang),
            }
        },

        mounted() {
            let ref = this
            let chartData = {
                type: 'line',
                data: {
                    labels: Object.keys(this.views),
                    datasets: [
                        {
                            label: this.trans.app.visits,
                            data: Object.values(this.visits),
                            backgroundColor: [
                                'rgba(158, 213, 237, 0.5)',
                            ],
                            borderColor: [
                                'rgb(84, 175, 204)',
                            ],
                            borderWidth: 3,
                        },
                        {
                            label: this.trans.app.views,
                            data: Object.values(this.views),
                            backgroundColor: [
                                'rgba(3, 168, 124, .5)',
                            ],
                            borderColor: [
                                '#03a87c',
                            ],
                            borderWidth: 3,
                        }
                    ]
                },
                options: {
                    legend: {
                        display: false
                    },
                    animation: {
                        duration: 0
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true,
                        animationDuration: 0
                    },
                    responsiveAnimationDuration: 0,
                    maintainAspectRatio: false,
                    responsive: true,
                    lineTension: 1,
                    elements: {
                        point: {
                            radius: 0,
                            backgroundColor: '#03a87c',
                            borderColor: '#03a87c'
                        }
                    },
                    tooltips: {
                        mode: 'index',
                        displayColors: false,
                        intersect: false,
                        position: 'nearest',
                        callbacks: {
                            label: function (tooltipItem, data) {
                                if (tooltipItem.datasetIndex === 0) {
                                    return ref.uniqueVisitorLabel(tooltipItem.value)
                                } else if (tooltipItem.datasetIndex === 1) {
                                    return ref.viewLabel(tooltipItem.value)
                                }
                            },
                            labelTextColor: function (tooltipItem, data) {
                                if (tooltipItem.datasetIndex === 0) {
                                    return 'rgb(84, 175, 204)';
                                } else if (tooltipItem.datasetIndex === 1) {
                                    return '#03a87c';
                                }
                            },
                            title: function(tooltipItem) {
                                return moment(tooltipItem[0].label, 'YYYY-MM-DD').format('dddd, MMMM Do YYYY')
                            }
                        }
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                fontColor: '#718096',
                                beginAtZero: true,
                                padding: 25,
                                display: true,
                                autoSkip: true,
                                maxTicksLimit: 6
                            },
                            gridLines: {
                                borderDash: [8, 4],
                                color: "#718096"
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                fontColor: '#718096',
                                display: true,
                                autoSkip: true,
                                maxTicksLimit: 8,
                                callback: function (value, index, values) {
                                    return moment(value, 'YYYY-MM-DD').format('MMM Do')
                                }
                            },
                            gridLines: {
                                display: false
                            }
                        }]
                    },
                }
            }

            this.createChart('stats', chartData);
        },

        methods: {
            createChart(chartId, chartData) {
                const ctx = document.getElementById(chartId);

                const myChart = new Chart(ctx, {
                    type: chartData.type,
                    data: chartData.data,
                    options: chartData.options,
                });
            },

            viewLabel(value) {
                if (Number(value) === 1) {
                    return value + ' ' + this.trans.app.view
                } else {
                    return value + ' ' + this.trans.app.views_simple
                }
            },

            uniqueVisitorLabel(value) {
                if (Number(value) === 1) {
                    return value + ' ' + this.trans.app.unique_visit
                } else {
                    return value + ' ' + this.trans.app.unique_visits
                }
            }
        },
    }
</script>
