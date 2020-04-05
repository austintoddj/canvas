import md5 from 'md5'
import truncate from 'lodash/truncate'
import isEmpty from 'lodash/isEmpty'
import numeral from 'numeral'
import moment from "moment";

export default {
    computed: {
        Canvas() {
            return window.Canvas
        },
    },

    methods: {
        /**
         * Check if a post is a draft.
         *
         * @param date
         * @returns {boolean}
         */
        isDraft(date) {
            return (isEmpty(date) || this.isScheduled(date))
        },

        /**
         * Check if a post is scheduled.
         *
         * @param date
         * @returns {boolean}
         */
        isScheduled(date) {
            return date ? moment(date).isAfter(
                moment(new Date()).format().slice(0, 19).replace('T', ' ')
            ) : false;
        },

        /**
         * Check if a post is published.
         *
         * @param date
         * @returns {boolean}
         */
        isPublished(date) {
            return date ? moment(date).isBefore(
                moment(new Date()).format().slice(0, 19).replace('T', ' ')) : false;
        },

        /**
         * Return a URL-friendly slug.
         *
         * @param text
         * @returns {string}
         * @link https://gist.github.com/mathewbyrne/1280286#gistcomment-2588056
         */
        slugify(text) {
            text = text.toString().toLowerCase().trim();

            const sets = [
                {to: 'a', from: '[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]'},
                {to: 'c', from: '[ÇĆĈČ]'},
                {to: 'd', from: '[ÐĎĐÞ]'},
                {to: 'e', from: '[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]'},
                {to: 'g', from: '[ĜĞĢǴ]'},
                {to: 'h', from: '[ĤḦ]'},
                {to: 'i', from: '[ÌÍÎÏĨĪĮİỈỊ]'},
                {to: 'j', from: '[Ĵ]'},
                {to: 'ij', from: '[Ĳ]'},
                {to: 'k', from: '[Ķ]'},
                {to: 'l', from: '[ĹĻĽŁ]'},
                {to: 'm', from: '[Ḿ]'},
                {to: 'n', from: '[ÑŃŅŇ]'},
                {to: 'o', from: '[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]'},
                {to: 'oe', from: '[Œ]'},
                {to: 'p', from: '[ṕ]'},
                {to: 'r', from: '[ŔŖŘ]'},
                {to: 's', from: '[ßŚŜŞŠ]'},
                {to: 't', from: '[ŢŤ]'},
                {to: 'u', from: '[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]'},
                {to: 'w', from: '[ẂŴẀẄ]'},
                {to: 'x', from: '[ẍ]'},
                {to: 'y', from: '[ÝŶŸỲỴỶỸ]'},
                {to: 'z', from: '[ŹŻŽ]'},
                {to: '-', from: '[·/_,:;\']'}
            ];

            sets.forEach(set => {
                text = text.replace(new RegExp(set.from,'gi'), set.to)
            });

            return text
                .replace(/\s+/g, '-')    // Replace spaces with -
                .replace(/[^\w-]+/g, '') // Remove all non-word chars
                .replace(/--+/g, '-')    // Replace multiple - with single -
                .replace(/^-+/, '')      // Trim - from start of text
                .replace(/-+$/, '')      // Trim - from end of text
        },

        /**
         * Return numbers with their appropriate suffix.
         *
         * @param number
         * @returns {*}
         */
        suffixedNumber(number) {
            if (number < 999) {
                return number
            } else {
                return numeral(number).format('0.[0]a')
            }
        },

        /**
         * Trim a string to a given length.
         *
         * @param string
         * @param length
         * @returns {string}
         */
        trim(string, length = 70) {
            return truncate(string, {
                length: length,
            })
        },

        /**
         * Return a Gravatar URL for a given email.
         *
         * @param email
         * @param size
         * @returns {string}
         */
        defaultGravatar(email, size = 200) {
            let hash = md5(email.trim().toLowerCase())

            return 'https://secure.gravatar.com/avatar/' + hash + '?s=' + size
        },

        /**
         * Return the media upload path.
         *
         * @returns {string}
         */
        mediaUploadPath() {
            return '/' + Canvas.path + '/api/media/uploads'
        }
    },
}
