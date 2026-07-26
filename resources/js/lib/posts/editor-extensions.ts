import { Extension } from '@tiptap/core';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';

import { AiRewriteDecoration } from '@/lib/posts/ai-rewrite-decoration';
import { CanvasEmbed } from '@/lib/posts/embed-extension';

const ImageCreditParagraph = Extension.create({
    name: 'imageCreditParagraph',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph'],
                attributes: {
                    class: {
                        default: null,
                        parseHTML: (element) => {
                            if (
                                element.getAttribute('class') === 'canvas-post-body-image-credit' ||
                                element.getAttribute('data-canvas-image-credit') === 'true'
                            ) {
                                return 'canvas-post-body-image-credit';
                            }

                            return null;
                        },
                        renderHTML: (attributes) => {
                            if (attributes.class !== 'canvas-post-body-image-credit') {
                                return {};
                            }

                            return {
                                class: 'canvas-post-body-image-credit',
                                'data-canvas-image-credit': 'true',
                            };
                        },
                    },
                },
            },
        ];
    },
});

const lowlight = createLowlight(common);

/** Default language for newly inserted code blocks (Auto remains available). */
export const DEFAULT_CODE_BLOCK_LANGUAGE = 'javascript';

export const CODE_BLOCK_LANGUAGES = [
    { value: '', label: 'Auto' },
    { value: 'bash', label: 'Bash' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'css', label: 'CSS' },
    { value: 'diff', label: 'Diff' },
    { value: 'go', label: 'Go' },
    { value: 'graphql', label: 'GraphQL' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'json', label: 'JSON' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'php', label: 'PHP' },
    { value: 'python', label: 'Python' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'rust', label: 'Rust' },
    { value: 'scss', label: 'SCSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'swift', label: 'Swift' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'xml', label: 'HTML / XML' },
    { value: 'yaml', label: 'YAML' },
] as const;

export function createPostEditorExtensions(options?: { placeholder?: string }) {
    return [
        StarterKit.configure({
            heading: { levels: [1, 2, 3] },
            codeBlock: false,
        }),
        CodeBlockLowlight.configure({
            lowlight,
            defaultLanguage: DEFAULT_CODE_BLOCK_LANGUAGE,
            HTMLAttributes: {
                class: 'canvas-post-body-code',
            },
        }),
        Underline,
        Link.configure({
            openOnClick: false,
            autolink: true,
            HTMLAttributes: {
                class: 'text-blue-600 underline underline-offset-2 dark:text-blue-400',
            },
        }),
        Placeholder.configure({
            placeholder: options?.placeholder ?? 'Start writing…',
        }),
        Highlight.configure({
            multicolor: false,
        }),
        Typography,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        TaskList,
        TaskItem.configure({
            nested: true,
        }),
        Image.configure({
            allowBase64: false,
            HTMLAttributes: {
                class: 'canvas-post-body-image',
            },
        }),
        ImageCreditParagraph,
        Youtube.configure({
            controls: true,
            nocookie: true,
            modestBranding: true,
            // Match CSS 16:9 box; fixed 640×480 attrs clipped the thumbnail.
            width: 640,
            height: 360,
            HTMLAttributes: {
                class: 'canvas-post-body-youtube',
            },
        }),
        CanvasEmbed,
        TableKit.configure({
            table: {
                resizable: true,
                HTMLAttributes: {
                    class: 'canvas-post-body-table',
                },
            },
        }),
        CharacterCount,
        AiRewriteDecoration,
    ];
}
