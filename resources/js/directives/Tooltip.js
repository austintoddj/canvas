import $ from 'jquery'

/**
 * The Tooltip directive provides simple tooltip functionality using the Bootstrap
 * library. To use this, add a `v-tooltip` directive to the element that should
 * activate the tooltip on mouseover, and set the element's `title` attribute.
 *
 * For example:
 *
 * ```
 * <i class="fas fa-question-circle" title="Tooltip text" v-tooltip></i>
 * ```
 *
 * The `title` attribute can also be a dynamic prop:
 *
 * ```
 * <i class="fas fa-question-circle" :title="myDynamicValue" v-tooltip></i>
 * ```
 *
 * You can also pass Bootstrap options to the `v-tooltip` directive, and they'll override
 * the default options. For example, you can change the tooltip to align on the right
 * side of the element (versus above it) like this:
 *
 * ```
 * <i class="fas fa-question-circle" title="Tooltip text" v-tooltip="{placement: 'right'}"></i>
 * ```
 *
 * All Bootstrap options are supported.
 */
const defaultOptions = {
    animation: true,
    container: false,
    delay: 0,
    html: false,
    placement: top,
    selector: false,
    title: '',
    trigger: 'hover',
    offset: 0,
}

const Tooltip = {
    bind(el, binding) {
        // Get the default configuration options
        const customOptions = binding.value || {}
        const options = { ...defaultOptions, ...customOptions }

        // Initialize the Bootstrap tooltip
        $(el).tooltip(options)
    },
}

export default Tooltip
