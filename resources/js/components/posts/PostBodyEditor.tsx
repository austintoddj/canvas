import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import {
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    Bars3BottomLeftIcon,
    Bars3BottomRightIcon,
    Bars3Icon,
    BoldIcon,
    ChatBubbleBottomCenterTextIcon,
    CheckCircleIcon,
    CheckIcon,
    CodeBracketIcon,
    EllipsisHorizontalIcon,
    H1Icon,
    H2Icon,
    H3Icon,
    ItalicIcon,
    LinkIcon,
    ListBulletIcon,
    MinusIcon,
    NumberedListIcon,
    PhotoIcon,
    SwatchIcon,
    StrikethroughIcon,
    TableCellsIcon,
    TrashIcon,
    UnderlineIcon,
} from '@heroicons/react/20/solid';
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog';
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
} from '@/components/dropdown';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import MediaPicker from '@/components/media/MediaPicker';
import { resolveMediaUrl } from '@/lib/media/list';
import { bodyFromEditorHtml, bodyHtmlForEditor } from '@/lib/posts/body';
import { CODE_BLOCK_LANGUAGES, createPostEditorExtensions } from '@/lib/posts/editor-extensions';

type PostBodyEditorProps = {
    body: string | null;
    disabled?: boolean;
    focusMode?: boolean;
    onToggleFocusMode?: () => void;
    onChange: (body: string | null) => void;
};

function ToolbarButton({
    active,
    disabled,
    label,
    onClick,
    children,
    'data-post-focus-toggle': focusToggle,
}: {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick: () => void;
    children: ReactNode;
    'data-post-focus-toggle'?: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active === undefined ? undefined : active}
            disabled={disabled}
            onClick={onClick}
            data-post-focus-toggle={focusToggle}
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

function ToolbarDivider() {
    return <span className="mx-1 h-5 w-px shrink-0 bg-zinc-950/10 dark:bg-white/10" aria-hidden="true" />;
}

function MarkButtons({ editor, disabled, onOpenLink }: { editor: Editor; disabled?: boolean; onOpenLink: () => void }) {
    return (
        <>
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
            <ToolbarButton label="Link" active={editor.isActive('link')} disabled={disabled} onClick={onOpenLink}>
                <LinkIcon className="size-4" />
            </ToolbarButton>
        </>
    );
}

function ToolbarMenuItem({
    label,
    active,
    disabled,
    onClick,
    children,
}: {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <DropdownItem disabled={disabled} onClick={onClick}>
            {children}
            <DropdownLabel>{label}</DropdownLabel>
            {active ? (
                <DropdownTrailingIcon>
                    <CheckIcon className="size-4 text-zinc-950 dark:text-white" />
                </DropdownTrailingIcon>
            ) : null}
        </DropdownItem>
    );
}

function EditorToolbar({
    editor,
    disabled,
    focusMode = false,
    onOpenLink,
    onOpenMedia,
    onToggleFocusMode,
}: {
    editor: Editor;
    disabled?: boolean;
    focusMode?: boolean;
    onOpenLink: () => void;
    onOpenMedia: () => void;
    onToggleFocusMode?: () => void;
}) {
    const inTable = editor.isActive('table');
    const inCodeBlock = editor.isActive('codeBlock');
    const codeLanguage = (editor.getAttributes('codeBlock').language as string | null | undefined) ?? '';
    const moreActive =
        editor.isActive('strike') ||
        editor.isActive('highlight') ||
        inTable ||
        editor.isActive({ textAlign: 'center' }) ||
        editor.isActive({ textAlign: 'right' });

    return (
        <div
            className="flex flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-zinc-950/10 px-2 py-1.5 dark:border-white/10"
            data-post-body-toolbar="true"
            role="toolbar"
            aria-label="Formatting"
        >
            <MarkButtons editor={editor} disabled={disabled} onOpenLink={onOpenLink} />

            <ToolbarDivider />

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
            <ToolbarButton
                label="Heading 3"
                active={editor.isActive('heading', { level: 3 })}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
                <H3Icon className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

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
                label="Checklist"
                active={editor.isActive('taskList')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
                <CheckCircleIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Quote"
                active={editor.isActive('blockquote')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
                <ChatBubbleBottomCenterTextIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Code block"
                active={inCodeBlock}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
                <CodeBracketIcon className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton label="Image" active={editor.isActive('image')} disabled={disabled} onClick={onOpenMedia}>
                <PhotoIcon className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <Dropdown>
                <DropdownButton
                    as="button"
                    type="button"
                    disabled={disabled}
                    aria-label="More formatting"
                    title="More formatting"
                    data-post-body-toolbar-more="true"
                    className={clsx(
                        'inline-flex size-8 items-center justify-center rounded-md text-zinc-600 transition dark:text-zinc-300',
                        'hover:bg-zinc-950/5 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-white',
                        'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                        moreActive && 'bg-zinc-950/10 text-zinc-950 dark:bg-white/15 dark:text-white'
                    )}
                >
                    <EllipsisHorizontalIcon className="size-4" />
                </DropdownButton>
                <DropdownMenu anchor="bottom end" className="min-w-52">
                    <ToolbarMenuItem
                        label="Strikethrough"
                        active={editor.isActive('strike')}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <StrikethroughIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label="Highlight"
                        active={editor.isActive('highlight')}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                    >
                        <SwatchIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <DropdownDivider />
                    <ToolbarMenuItem
                        label="Horizontal rule"
                        disabled={disabled}
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    >
                        <MinusIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label="Insert table"
                        active={inTable}
                        disabled={disabled}
                        onClick={() =>
                            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                        }
                    >
                        <TableCellsIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <DropdownDivider />
                    <ToolbarMenuItem
                        label="Align left"
                        active={editor.isActive({ textAlign: 'left' })}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    >
                        <Bars3BottomLeftIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label="Align center"
                        active={editor.isActive({ textAlign: 'center' })}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    >
                        <Bars3Icon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label="Align right"
                        active={editor.isActive({ textAlign: 'right' })}
                        disabled={disabled}
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    >
                        <Bars3BottomRightIcon data-slot="icon" />
                    </ToolbarMenuItem>
                </DropdownMenu>
            </Dropdown>

            {inCodeBlock ? (
                <>
                    <ToolbarDivider />
                    <label className="ml-1 flex shrink-0 items-center gap-1.5 text-xs text-canvas-muted dark:text-canvas-muted-dark">
                        <span className="sr-only">Code language</span>
                        <select
                            className="max-w-[9rem] rounded-md border border-zinc-950/10 bg-transparent px-1.5 py-1 text-xs text-zinc-700 dark:border-white/10 dark:text-zinc-200"
                            value={codeLanguage}
                            disabled={disabled}
                            onChange={(event) => {
                                const language = event.target.value;
                                editor
                                    .chain()
                                    .focus()
                                    .updateAttributes('codeBlock', { language: language === '' ? null : language })
                                    .run();
                            }}
                            data-post-code-language="true"
                        >
                            {CODE_BLOCK_LANGUAGES.map((option) => (
                                <option key={option.label} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </>
            ) : null}

            {inTable ? (
                <>
                    <ToolbarDivider />
                    <ToolbarButton
                        label="Add column"
                        disabled={disabled}
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                    >
                        <span className="text-[10px] font-semibold">+Col</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="Add row"
                        disabled={disabled}
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                    >
                        <span className="text-[10px] font-semibold">+Row</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="Delete table"
                        disabled={disabled}
                        onClick={() => editor.chain().focus().deleteTable().run()}
                    >
                        <TrashIcon className="size-4" />
                    </ToolbarButton>
                </>
            ) : null}

            {onToggleFocusMode !== undefined ? (
                <>
                    <ToolbarDivider />
                    <div className="ml-auto shrink-0">
                        <ToolbarButton
                            label={focusMode ? 'Exit focus mode' : 'Focus mode'}
                            active={focusMode}
                            disabled={disabled}
                            onClick={onToggleFocusMode}
                            data-post-focus-toggle="true"
                        >
                            {focusMode ? (
                                <ArrowsPointingInIcon className="size-4" />
                            ) : (
                                <ArrowsPointingOutIcon className="size-4" />
                            )}
                        </ToolbarButton>
                    </div>
                </>
            ) : null}
        </div>
    );
}

function LinkDialog({
    open,
    value,
    hasExistingLink,
    onChange,
    onClose,
    onApply,
    onRemoveLink,
    inputRef,
}: {
    open: boolean;
    value: string;
    hasExistingLink: boolean;
    onChange: (value: string) => void;
    onClose: () => void;
    onApply: (event?: FormEvent) => void;
    onRemoveLink: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
}) {
    return (
        <Dialog open={open} onClose={onClose} size="sm" data-post-link-dialog="true">
            <form onSubmit={onApply}>
                <DialogTitle>Link URL</DialogTitle>
                <DialogDescription>Add a URL for the selected text, or remove an existing link.</DialogDescription>
                <DialogBody>
                    <Field>
                        <Label>URL</Label>
                        <Input
                            ref={inputRef}
                            name="href"
                            type="url"
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            placeholder="https://"
                            autoComplete="url"
                        />
                    </Field>
                </DialogBody>
                <DialogActions>
                    {hasExistingLink ? (
                        <Button type="button" plain onClick={onRemoveLink}>
                            Remove link
                        </Button>
                    ) : null}
                    <Button type="button" plain onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" color="dark/zinc">
                        Apply
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default function PostBodyEditor({
    body,
    disabled = false,
    focusMode = false,
    onToggleFocusMode,
    onChange,
}: PostBodyEditorProps) {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [dialogValue, setDialogValue] = useState('https://');
    const [mediaOpen, setMediaOpen] = useState(false);
    const dialogInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: createPostEditorExtensions(),
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

    useEffect(() => {
        if (!linkDialogOpen) {
            return;
        }

        const timer = window.setTimeout(() => {
            dialogInputRef.current?.focus();
            dialogInputRef.current?.select();
        }, 50);

        return () => window.clearTimeout(timer);
    }, [linkDialogOpen]);

    function openLinkDialog() {
        if (disabled || editor === null) {
            return;
        }

        const previous = editor.getAttributes('link').href as string | undefined;
        setDialogValue(previous && previous.trim() !== '' ? previous : 'https://');
        setLinkDialogOpen(true);
    }

    function closeLinkDialog() {
        setLinkDialogOpen(false);
    }

    function applyLinkDialog(event?: FormEvent) {
        event?.preventDefault();

        if (editor === null) {
            return;
        }

        const trimmed = dialogValue.trim();

        if (trimmed === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
        }

        setLinkDialogOpen(false);
    }

    function removeLink() {
        if (editor === null) {
            return;
        }

        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setLinkDialogOpen(false);
    }

    const characters = editor?.storage.characterCount.characters() ?? 0;
    const words = editor?.storage.characterCount.words() ?? 0;
    const hasExistingLink = editor?.isActive('link') ?? false;

    return (
        <div
            className="overflow-hidden rounded-lg border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-zinc-900"
            data-post-body-surface="true"
        >
            {editor ? (
                <EditorToolbar
                    editor={editor}
                    disabled={disabled}
                    focusMode={focusMode}
                    onOpenLink={openLinkDialog}
                    onOpenMedia={() => {
                        if (!disabled) {
                            setMediaOpen(true);
                        }
                    }}
                    onToggleFocusMode={onToggleFocusMode}
                />
            ) : null}
            <EditorContent editor={editor} />
            {editor ? (
                <div
                    className="flex items-center justify-end gap-3 border-t border-zinc-950/10 px-3 py-1.5 text-xs text-canvas-muted dark:border-white/10 dark:text-canvas-muted-dark"
                    data-post-body-stats="true"
                    aria-live="polite"
                >
                    <span>
                        {words.toLocaleString()} {words === 1 ? 'word' : 'words'}
                    </span>
                    <span>
                        {characters.toLocaleString()} {characters === 1 ? 'character' : 'characters'}
                    </span>
                </div>
            ) : null}

            <LinkDialog
                open={linkDialogOpen}
                value={dialogValue}
                hasExistingLink={hasExistingLink}
                onChange={setDialogValue}
                onClose={closeLinkDialog}
                onApply={applyLinkDialog}
                onRemoveLink={removeLink}
                inputRef={dialogInputRef}
            />

            <MediaPicker
                open={mediaOpen}
                onClose={() => setMediaOpen(false)}
                onSelect={(url, media) => {
                    if (editor === null) {
                        return;
                    }

                    editor
                        .chain()
                        .focus()
                        .setImage({
                            src: resolveMediaUrl(url),
                            alt: media?.alt ?? media?.original_name ?? media?.filename ?? '',
                        })
                        .run();
                }}
            />
        </div>
    );
}

function normalizeComparable(html: string): string {
    return bodyFromEditorHtml(html) ?? '';
}
