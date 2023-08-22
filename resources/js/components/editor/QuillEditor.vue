<template>
    <div v-cloak class="position-relative">
        <div v-closable="handleClicksOutsideEditor" ref="sidebarControls" class="sidebar-controls">
            <button ref="toggle" class="btn btn-circle border" type="button" @click="toggleSidebarControls">
                <span v-if="controlIsActive">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-close">
                        <path
                            class="fill-body-color"
                            fill-rule="evenodd"
                            d="M15.78 14.36a1 1 0 0 1-1.42 1.42l-2.82-2.83-2.83 2.83a1 1 0 1 1-1.42-1.42l2.83-2.82L7.3 8.7a1 1 0 0 1 1.42-1.42l2.83 2.83 2.82-2.83a1 1 0 0 1 1.42 1.42l-2.83 2.83 2.83 2.82z"
                        />
                    </svg>
                </span>
                <span v-else>
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-add-circle">
                        <circle cx="12" cy="12" r="10" style="fill: none" />
                        <path
                            class="fill-body-color"
                            d="M13 11h4a1 1 0 0 1 0 2h-4v4a1 1 0 0 1-2 0v-4H7a1 1 0 0 1 0-2h4V7a1 1 0 0 1 2 0v4z"
                        />
                    </svg>
                </span>
            </button>
            <div class="controls pl-3 d-none">
                <button class="btn btn-circle border mr-1" type="button" @click="showEmbedImageModal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-camera">
                        <path
                            class="fill-body-color"
                            d="M6.59 6l2.7-2.7A1 1 0 0 1 10 3h4a1 1 0 0 1 .7.3L17.42 6H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h2.59zM19 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-7 8a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
                        />
                        <path class="fill-body-color" d="M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    </svg>
                </button>
                <button class="btn btn-circle border mr-1" type="button" @click="showEmbedContentModal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-code">
                        <rect width="18" height="18" x="3" y="3" class="fill-bg" rx="2" />
                        <path
                            class="fill-body-color"
                            d="M8.7 13.3a1 1 0 0 1-1.4 1.4l-2-2a1 1 0 0 1 0-1.4l2-2a1 1 0 1 1 1.4 1.4L7.42 12l1.3 1.3zm6.6 0l1.29-1.3-1.3-1.3a1 1 0 1 1 1.42-1.4l2 2a1 1 0 0 1 0 1.4l-2 2a1 1 0 0 1-1.42-1.4zm-3.32 3.9a1 1 0 0 1-1.96-.4l2-10a1 1 0 0 1 1.96.4l-2 10z"
                        />
                    </svg>
                </button>
                <button class="btn btn-circle border mr-2" type="button" @click="insertDivider">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-dots-horizontal">
                        <path
                            class="fill-body-color"
                            fill-rule="evenodd"
                            d="M5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
                        />
                    </svg>
                </button>
            </div>
        </div>

        <div ref="editor" v-cloak class="mb-5" />

        <nav class="navbar fixed-bottom navbar-expand-sm mt-5 d-xl-none p-0 navbar-mini shadow">
            <div class="btn-group d-flex justify-content-center">
                <button
                    class="btn border border-bottom-0 border-left-0 py-2"
                    type="button"
                    @click="showEmbedImageModal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-camera">
                        <path
                            class="fill-body-color"
                            d="M6.59 6l2.7-2.7A1 1 0 0 1 10 3h4a1 1 0 0 1 .7.3L17.42 6H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h2.59zM19 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-7 8a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
                        />
                        <path class="fill-body-color" d="M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    </svg>
                </button>
                <button
                    class="btn border border-bottom-0 border-left-0 py-2"
                    type="button"
                    @click="showEmbedContentModal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-code">
                        <rect width="18" height="18" x="3" y="3" class="fill-bg" rx="2" />
                        <path
                            class="fill-body-color"
                            d="M8.7 13.3a1 1 0 0 1-1.4 1.4l-2-2a1 1 0 0 1 0-1.4l2-2a1 1 0 1 1 1.4 1.4L7.42 12l1.3 1.3zm6.6 0l1.29-1.3-1.3-1.3a1 1 0 1 1 1.42-1.4l2 2a1 1 0 0 1 0 1.4l-2 2a1 1 0 0 1-1.42-1.4zm-3.32 3.9a1 1 0 0 1-1.96-.4l2-10a1 1 0 0 1 1.96.4l-2 10z"
                        />
                    </svg>
                </button>
                <button class="btn border border-bottom-0 border-right-0 py-2" type="button" @click="insertDivider">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" viewBox="0 0 24 24" class="icon-dots-horizontal">
                        <path
                            class="fill-body-color"
                            fill-rule="evenodd"
                            d="M5 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
                        />
                    </svg>
                </button>
            </div>
        </nav>

        <embed-content-modal ref="embedContentModal" @adding-embed-content="insertEmbedContent" />
        <embed-image-modal
            ref="embedImageModal"
            @adding-embed-image="insertEmbedImage"
            @removing-embed-image="removeEmbedImage"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import $ from 'jquery';
import Closable from '../../../js/directives/Closable';
import DividerBlot from './DividerBlot';
import EmbedContentBlot from './EmbedContentBlot';
import EmbedContentModal from './EmbedContentModal';
import EmbedImageBlot from './EmbedImageBlot';
import EmbedImageModal from './EmbedImageModal';
import Parchment from 'parchment';
import Quill from 'quill';
import debounce from 'lodash/debounce';

export default {
    name: 'quill-editor',

    directives: {
        Closable,
    },

    components: {
        EmbedContentModal,
        EmbedImageModal,
    },

    props: {
        post: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            editor: null,
            controlIsActive: false,
        };
    },

    computed: {
        ...mapGetters({
            trans: 'settings/trans',
        }),
    },

    async mounted() {
        await Promise.all([this.createEditor(), this.handleEditorValue()]);

        this.handleClicksInsideEditor();
        this.initSideControls();

        this.editor.on('text-change', () => {
            this.controlIsActive = false;
            this.post.body = this.editor.getText() ? this.editor.root.innerHTML : '';
            this.update();
        });
    },

    methods: {
        createEditor() {
            Quill.register(DividerBlot, true);
            Quill.register(EmbedImageBlot, true);
            Quill.register(EmbedContentBlot, true);

            let Block = Quill.import('blots/block');
            Block.tagName = 'div';
            Block.blotName = 'P';
            Quill.register(Block);

            const icons = Quill.import('ui/icons');
            icons.header[3] = require('!html-loader!quill/assets/icons/header-3.svg');

            let quill = new Quill(this.$refs.editor, {
                modules: {
                    syntax: true,
                    toolbar: [
                        ['bold', 'italic', 'code', 'link'],
                        [{ header: '2' }, { header: '3' }],
                        ['blockquote', 'code-block'],
                    ],
                },
                theme: 'bubble',
                scrollingContainer: 'html, body',
                placeholder: this.trans.tell_your_story,
            });

            /**
             * Temporary workaround for customizing the link tooltip.
             *
             * @link https://github.com/quilljs/quill/issues/1107#issuecomment-259938173
             */
            let tooltip = quill.theme.tooltip;
            let input = tooltip.root.querySelector('input[data-link]');

            input.dataset.link = this.trans.paste_or_type_a_link;

            return (this.editor = quill);
        },

        handleEditorValue() {
            return (this.editor.root.innerHTML = this.post.body);
        },

        handleClicksInsideEditor() {
            this.editor.root.addEventListener('click', (event) => {
                let blot = Parchment.find(event.target, true);

                if (blot instanceof EmbedImageBlot) {
                    let values = blot.value(blot.domNode)['embed-image'];
                    values.existingBlot = blot;
                    this.showEmbedImageModal(values);
                }

                if (blot instanceof EmbedContentBlot) {
                    let content = blot.value(blot.domNode)['embed-content'];
                    content.existingBlot = blot;
                    this.showEmbedContentModal(content);
                }
            });
        },

        handleClicksOutsideEditor() {
            if (this.$refs.sidebarControls.classList.contains('active')) {
                this.$refs.sidebarControls.classList.toggle('active');
                this.controlIsActive = false;
            }
        },

        initSideControls() {
            let Block = Quill.import('blots/block');

            this.editor.on(Quill.events.EDITOR_CHANGE, (eventType, range) => {
                let sidebarControls = this.$refs.sidebarControls;

                if (eventType !== Quill.events.SELECTION_CHANGE) {
                    return;
                }

                if (range == null) {
                    return;
                }

                if (range.length === 0) {
                    let [block] = this.editor.scroll.descendant(Block, range.index);

                    if (block != null && block.domNode.firstChild instanceof HTMLBRElement) {
                        let lineBounds = this.editor.getBounds(range);
                        sidebarControls.classList.remove('active');
                        sidebarControls.style.display = 'block';
                        sidebarControls.style.left = lineBounds.left - 50 + 'px';
                        sidebarControls.style.top = lineBounds.top - 2 + 'px';
                    } else {
                        sidebarControls.style.display = 'none';
                        sidebarControls.classList.remove('active');
                    }
                } else {
                    sidebarControls.style.display = 'none';
                    sidebarControls.classList.remove('active');
                }
            });
        },

        toggleSidebarControls() {
            this.editor.focus();

            if (this.$refs.sidebarControls.classList.contains('active')) {
                this.$refs.sidebarControls.classList.toggle('active');
                this.controlIsActive = false;
            } else {
                this.$refs.sidebarControls.classList.toggle('active');
                this.controlIsActive = true;
            }
        },

        showEmbedImageModal(data = null) {
            this.$emit('opening-embed-image-modal', data);
            $(this.$refs.embedImageModal.$el).modal('show');
        },

        showEmbedContentModal(data = null) {
            this.$emit('opening-embed-content-modal', data);
            $(this.$refs.embedContentModal.$el).modal('show');
        },

        insertEmbedImage({ url, caption, existingBlot, layout }) {
            let values = {
                url: url,
                caption: caption,
                layout: layout,
            };

            if (existingBlot) {
                return existingBlot.replaceWith('embed-image', values);
            }

            let range = this.editor.getSelection(true);
            this.editor.insertEmbed(range.index, 'embed-image', values, Quill.sources.USER);
            this.editor.setSelection(range.index + 1, Quill.sources.SILENT);
        },

        removeEmbedImage({ existingBlot }) {
            let range = this.editor.getSelection(true);
            existingBlot.remove();
            this.editor.setSelection(range.index - 1, Quill.sources.SILENT);
        },

        insertEmbedContent({ content, existingBlot }) {
            let range = this.editor.getSelection(true);
            let values = {
                content: content,
            };

            if (existingBlot) {
                return existingBlot.replaceWith('embed-content', values);
            }

            this.editor.insertEmbed(range.index, 'embed-content', values, Quill.sources.USER);
            this.editor.setSelection(range.index + 1, Quill.sources.SILENT);
        },

        insertDivider() {
            let range = this.editor.getSelection(true);
            this.editor.insertText(range.index, '', Quill.sources.USER);
            this.editor.insertEmbed(range.index, 'divider', true, Quill.sources.USER);
            this.editor.setSelection(range.index + 2, Quill.sources.SILENT);
        },

        update: debounce(function () {
            this.$emit('update-post');
        }, 3000),
    },
};
</script>

<style lang="scss">
@import '../../../sass/utilities/variables';
@import '~quill/dist/quill.bubble.css';

.ql-container {
    font-size: 1.1rem;
    line-height: 2;
    word-wrap: normal;
    font-family: $font-family-serif;
}

.ql-editor {
    font-family: $font-family-serif;
    font-size: 1.1rem !important;
    line-height: 2 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    overflow-y: visible !important;
    min-width: 100%;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
}

.ql-editor p {
    margin: 1.5em 0 0 0 !important;
}

.ql-editor a {
    text-decoration: underline;
}

.ql-editor h1,
h2,
h3 {
    margin: 1.5em 0 0 0 !important;
}

.ql-editor blockquote {
    margin: 2em 0 1em 0 !important;
    font-style: italic;
    font-size: 28px;
    border: none !important;
    color: $gray-500;
    padding-left: 1.5em !important;
    line-height: 1.5;
}

div.embedded_image {
    margin-top: 2em;
}

div.embedded_image > img {
    width: 100%;
    height: auto;
    display: block;
}

div.embedded_image > p {
    text-align: center;
    color: $gray-500;
    margin-top: 0.5em;
    font-size: 0.9rem;
    font-family: $font-family-sans-serif, sans-serif;
}

div.ql-embed-content {
    // This is here because we have no way to control the dimensions
    // of the content being embedded, so hide any overlap to avoid
    // breaking either the editor or the screen.
    overflow: hidden;
}

div.embedded_image:hover img,
div.ql-embed-content:hover {
    cursor: pointer !important;
    box-shadow: 0 0 0 3px $green;
}

div.embedded_image[data-layout='wide'] img {
    max-width: 1024px;
    margin: 0 auto 30px;
}

div.embedded_image[data-layout='wide'] {
    width: 100vw;
    position: relative;
    left: 50%;
    margin-left: -50vw;
}

.ql-container hr {
    border: none;
    margin: 2em 0 3em 0;
    letter-spacing: 1em;
    text-align: center;
}

.ql-container hr:before {
    content: '...';
}

.ql-editor pre.ql-syntax {
    border-radius: $border-radius !important;
    padding: 1em !important;
    margin-top: 2em !important;
}

.ql-editor.ql-blank::before {
    left: 0 !important;
}

.btn-circle {
    width: 40px;
    height: 40px;
    padding: 6px 0;
    border-radius: 9999px;
    text-align: center;
    line-height: 1.42857;
}

.sidebar-controls {
    margin-top: -8px;
    top: 0;
    display: none;
    position: absolute;
    z-index: 10;
    left: -60px;
}

.sidebar-controls button:hover {
    background-color: transparent;
}

.sidebar-controls button:focus {
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
    outline: none;
}

.sidebar-controls.active .controls {
    display: inline-block !important;
}

.navbar div.btn-group {
    flex: auto;
}

.navbar div.btn-group button {
    border-radius: 0;
}

div.ql-editor.ql-blank::before {
    margin-top: 26.4px !important;
}

div.embedded_image[data-layout='wide'] {
    width: 100vw;
    position: relative;
    left: 50%;
    margin-left: -50vw;
}

@media screen and (max-width: 1024px) {
    .embedded_image[data-layout='wide'] img {
        max-width: 100%;
    }
}

@media (max-width: 1200px) {
    .sidebar-controls {
        display: none !important;
    }
}
</style>
