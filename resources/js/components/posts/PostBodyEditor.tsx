import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    BoldIcon,
    ChatBubbleBottomCenterTextIcon,
    H1Icon,
    H2Icon,
    ItalicIcon,
    LinkIcon,
    ListBulletIcon,
    NumberedListIcon,
    StrikethroughIcon,
    UnderlineIcon,
} from '@heroicons/react/20/solid';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { bodyFromEditorHtml, bodyHtmlForEditor } from '@/lib/posts/body';

type PostBodyEditorProps = {
    body: string | null;
    disabled?: boolean;
    onChange: (body: string | null) => void;
};

function ToolbarButton({
    active,
    disabled,
    label,
    onClick,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active === undefined ? undefined : active}
            disabled={disabled}
            onClick={onClick}
            className={clsx(
                'inline-flex size-8 items-center justify-center rounded-md text-zinc-600 transition dark:text-zinc-300',
                'hover:bg-zinc-950/5 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-white',
                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                active && 'bg-zinc-950/10 text-zinc-950 dark:bg-white/15 dark:text-white'
            )}
        >
            {children}
        </button>
    );
}

function EditorToolbar({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('https://');
    const linkInputRef = useRef<HTMLInputElement>(null);
    const hasExistingLink = editor.isActive('link');

    function openLinkDialog() {
        if (disabled) {
            return;
        }

        const previous = editor.getAttributes('link').href as string | undefined;
        setLinkUrl(previous && previous.trim() !== '' ? previous : 'https://');
        setLinkOpen(true);
    }

    function closeLinkDialog() {
        setLinkOpen(false);
    }

    function applyLink(event?: FormEvent) {
        event?.preventDefault();

        const trimmed = linkUrl.trim();

        if (trimmed === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
        }

        setLinkOpen(false);
    }

    function removeLink() {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setLinkOpen(false);
    }

    useEffect(() => {
        if (!linkOpen) {
            return;
        }

        const timer = window.setTimeout(() => {
            linkInputRef.current?.focus();
            linkInputRef.current?.select();
        }, 50);

        return () => window.clearTimeout(timer);
    }, [linkOpen]);

    return (
        <>
            <div
                className="flex flex-wrap items-center gap-0.5 border-b border-zinc-950/10 px-2 py-1.5 dark:border-white/10"
                data-post-body-toolbar="true"
                role="toolbar"
                aria-label="Formatting"
            >
                <ToolbarButton
                    label="Bold"
                    active={editor.isActive('bold')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <BoldIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Italic"
                    active={editor.isActive('italic')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <ItalicIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Underline"
                    active={editor.isActive('underline')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Strikethrough"
                    active={editor.isActive('strike')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <StrikethroughIcon className="size-4" />
                </ToolbarButton>

                <span className="mx-1 h-5 w-px bg-zinc-950/10 dark:bg-white/10" aria-hidden="true" />

                <ToolbarButton
                    label="Heading 1"
                    active={editor.isActive('heading', { level: 1 })}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <H1Icon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Heading 2"
                    active={editor.isActive('heading', { level: 2 })}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <H2Icon className="size-4" />
                </ToolbarButton>

                <span className="mx-1 h-5 w-px bg-zinc-950/10 dark:bg-white/10" aria-hidden="true" />

                <ToolbarButton
                    label="Bullet list"
                    active={editor.isActive('bulletList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <ListBulletIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Numbered list"
                    active={editor.isActive('orderedList')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <NumberedListIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Quote"
                    active={editor.isActive('blockquote')}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <ChatBubbleBottomCenterTextIcon className="size-4" />
                </ToolbarButton>

                <span className="mx-1 h-5 w-px bg-zinc-950/10 dark:bg-white/10" aria-hidden="true" />

                <ToolbarButton
                    label="Link"
                    active={editor.isActive('link')}
                    disabled={disabled}
                    onClick={openLinkDialog}
                >
                    <LinkIcon className="size-4" />
                </ToolbarButton>
            </div>

            <Dialog open={linkOpen} onClose={closeLinkDialog} size="sm" data-post-link-dialog="true">
                <form onSubmit={applyLink}>
                    <DialogTitle>Link URL</DialogTitle>
                    <DialogDescription>Add a URL for the selected text, or remove an existing link.</DialogDescription>
                    <DialogBody>
                        <Field>
                            <Label>URL</Label>
                            <Input
                                ref={linkInputRef}
                                name="href"
                                type="url"
                                value={linkUrl}
                                onChange={(event) => setLinkUrl(event.target.value)}
                                placeholder="https://"
                                autoComplete="url"
                            />
                        </Field>
                    </DialogBody>
                    <DialogActions>
                        {hasExistingLink ? (
                            <Button type="button" plain onClick={removeLink}>
                                Remove link
                            </Button>
                        ) : null}
                        <Button type="button" plain onClick={closeLinkDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" color="dark/zinc">
                            Apply
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}

export default function PostBodyEditor({ body, disabled = false, onChange }: PostBodyEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
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
                placeholder: 'Start writing…',
            }),
        ],
        content: bodyHtmlForEditor(body),
        editable: !disabled,
        editorProps: {
            attributes: {
                class: 'canvas-post-body min-h-[28rem] px-4 py-4 focus:outline-none',
                'data-post-body-editor': 'true',
            },
        },
        onUpdate: ({ editor: current }) => {
            onChange(bodyFromEditorHtml(current.getHTML()));
        },
    });

    useEffect(() => {
        if (editor === null) {
            return;
        }

        editor.setEditable(!disabled);
    }, [disabled, editor]);

    useEffect(() => {
        if (editor === null) {
            return;
        }

        const next = bodyHtmlForEditor(body);
        const current = bodyFromEditorHtml(editor.getHTML());

        if (normalizeComparable(next) === normalizeComparable(current ?? '')) {
            return;
        }

        editor.commands.setContent(next, { emitUpdate: false });
    }, [body, editor]);

    return (
        <div
            className="overflow-hidden rounded-lg border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-zinc-900"
            data-post-body-surface="true"
        >
            {editor ? <EditorToolbar editor={editor} disabled={disabled} /> : null}
            <EditorContent editor={editor} />
        </div>
    );
}

function normalizeComparable(html: string): string {
    return bodyFromEditorHtml(html) ?? '';
}
