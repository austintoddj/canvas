import axios from 'axios'

export default {
    methods: {
        getToken() {
            return document.head.querySelector('meta[name="csrf-token"]').content
        },

        request() {
            let instance = axios.create()

            instance.defaults.headers.common['X-CSRF-TOKEN'] = this.getToken()
            instance.defaults.baseURL = '/' + Canvas.path

            const requestHandler = request => {
                // Add any request modifiers...
                return request
            }

            const errorHandler = error => {
                // Add any error modifiers...
                switch (error.response.status) {
                    case 405:
                    case 401:
                        this.logout()
                        break
                    default:
                        break
                }

                return Promise.reject({...error})
            }

            const successHandler = response => {
                // Add any response modifiers...
                return response
            }

            instance.interceptors.request.use(request =>
                requestHandler(request)
            )

            instance.interceptors.response.use(
                response => successHandler(response),
                error => errorHandler(error)
            )

            return instance
        },

        logout() {
            let instance = axios.create()

            instance.defaults.headers.common['X-CSRF-TOKEN'] = this.getToken()
            instance.defaults.baseURL = '/'

            instance.post('/logout').then(response => {
                window.location.href = '/login'
            })
        }
    },
}
