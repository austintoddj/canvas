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
    SparklesIcon,
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
import { Textarea } from '@/components/textarea';
import ImageSourcePicker from '@/components/media/ImageSourcePicker';
import { useCanvas } from '@/hooks/useCanvas';
import { aiApi, type AiRewriteAction } from '@/lib/api/ai';
import { resolveMediaUrl } from '@/lib/media/list';
import { AI_REWRITE_SETTLE_MS, rangeAfterPlainTextReplace } from '@/lib/posts/ai-rewrite-decoration';
import { AI_WRITING_ACTIONS, rewriteErrorMessage, selectionText } from '@/lib/posts/ai-writing';
import { bodyFromEditorHtml, bodyHtmlForEditor } from '@/lib/posts/body';
import { CODE_BLOCK_LANGUAGES, createPostEditorExtensions } from '@/lib/posts/editor-extensions';
import { toast } from '@/lib/toast';

type PostBodyEditorProps = {
    body: string | null;
    title?: string;
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
    const { t } = useCanvas();

    return (
        <>
            <ToolbarButton
                label={t('editor.bold')}
                active={editor.isActive('bold')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <BoldIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.italic')}
                active={editor.isActive('italic')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <ItalicIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.underline')}
                active={editor.isActive('underline')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                <UnderlineIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.link')}
                active={editor.isActive('link')}
                disabled={disabled}
                onClick={onOpenLink}
            >
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
    aiEnabled = false,
    aiBusy = false,
    onOpenLink,
    onOpenMedia,
    onAiAction,
    onOpenAiCustom,
    onToggleFocusMode,
}: {
    editor: Editor;
    disabled?: boolean;
    focusMode?: boolean;
    aiEnabled?: boolean;
    aiBusy?: boolean;
    onOpenLink: () => void;
    onOpenMedia: () => void;
    onAiAction: (action: Exclude<AiRewriteAction, 'custom'>) => void;
    onOpenAiCustom: () => void;
    onToggleFocusMode?: () => void;
}) {
    const { t } = useCanvas();
    const inTable = editor.isActive('table');
    const inCodeBlock = editor.isActive('codeBlock');
    const codeLanguage = (editor.getAttributes('codeBlock').language as string | null | undefined) ?? '';
    const toolbarDisabled = disabled || aiBusy;
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
            aria-label={t('editor.formatting')}
        >
            <MarkButtons editor={editor} disabled={toolbarDisabled} onOpenLink={onOpenLink} />

            <ToolbarDivider />

            <ToolbarButton
                label={t('editor.heading_1')}
                active={editor.isActive('heading', { level: 1 })}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
                <H1Icon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.heading_2')}
                active={editor.isActive('heading', { level: 2 })}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
                <H2Icon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.heading_3')}
                active={editor.isActive('heading', { level: 3 })}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
                <H3Icon className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
                label={t('editor.bullet_list')}
                active={editor.isActive('bulletList')}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                <ListBulletIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.numbered_list')}
                active={editor.isActive('orderedList')}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <NumberedListIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.checklist')}
                active={editor.isActive('taskList')}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleTaskList().run()}
            >
                <CheckCircleIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.quote')}
                active={editor.isActive('blockquote')}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
                <ChatBubbleBottomCenterTextIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                label={t('editor.code_block')}
                active={inCodeBlock}
                disabled={toolbarDisabled}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
                <CodeBracketIcon className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
                label={t('editor.image')}
                active={editor.isActive('image')}
                disabled={toolbarDisabled}
                onClick={onOpenMedia}
            >
                <PhotoIcon className="size-4" />
            </ToolbarButton>

            {aiEnabled ? (
                <>
                    <ToolbarDivider />
                    <Dropdown>
                        <DropdownButton
                            as="button"
                            type="button"
                            disabled={toolbarDisabled}
                            aria-label={aiBusy ? t('editor.rewriting') : t('editor.ai_writing')}
                            title={aiBusy ? t('editor.rewriting') : t('editor.ai_writing')}
                            data-post-body-toolbar-ai="true"
                            className={clsx(
                                'inline-flex size-8 items-center justify-center rounded-md text-zinc-600 transition dark:text-zinc-300',
                                'hover:bg-zinc-950/5 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-white',
                                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                                aiBusy && 'bg-zinc-950/10 text-zinc-950 dark:bg-white/15 dark:text-white'
                            )}
                        >
                            <SparklesIcon className="size-4" />
                        </DropdownButton>
                        <DropdownMenu anchor="bottom end" className="min-w-52">
                            {AI_WRITING_ACTIONS.map((item) => (
                                <DropdownItem
                                    key={item.action}
                                    disabled={toolbarDisabled}
                                    onClick={() => onAiAction(item.action)}
                                >
                                    <DropdownLabel>{t(item.labelKey)}</DropdownLabel>
                                </DropdownItem>
                            ))}
                            <DropdownDivider />
                            <DropdownItem disabled={toolbarDisabled} onClick={onOpenAiCustom}>
                                <DropdownLabel>{t('editor.custom_prompt_label')}</DropdownLabel>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </>
            ) : null}

            <ToolbarDivider />

            <Dropdown>
                <DropdownButton
                    as="button"
                    type="button"
                    disabled={toolbarDisabled}
                    aria-label={t('editor.more_formatting')}
                    title={t('editor.more_formatting')}
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
                        label={t('editor.strikethrough')}
                        active={editor.isActive('strike')}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <StrikethroughIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label={t('editor.highlight')}
                        active={editor.isActive('highlight')}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                    >
                        <SwatchIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <DropdownDivider />
                    <ToolbarMenuItem
                        label={t('editor.horizontal_rule')}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    >
                        <MinusIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label={t('editor.insert_table')}
                        active={inTable}
                        disabled={toolbarDisabled}
                        onClick={() =>
                            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                        }
                    >
                        <TableCellsIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <DropdownDivider />
                    <ToolbarMenuItem
                        label={t('editor.align_left')}
                        active={editor.isActive({ textAlign: 'left' })}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    >
                        <Bars3BottomLeftIcon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label={t('editor.align_center')}
                        active={editor.isActive({ textAlign: 'center' })}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    >
                        <Bars3Icon data-slot="icon" />
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        label={t('editor.align_right')}
                        active={editor.isActive({ textAlign: 'right' })}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    >
                        <Bars3BottomRightIcon data-slot="icon" />
                    </ToolbarMenuItem>
                </DropdownMenu>
            </Dropdown>

            {inCodeBlock ? (
                <>
                    <ToolbarDivider />
                    <Dropdown>
                        <DropdownButton
                            as="button"
                            type="button"
                            disabled={toolbarDisabled}
                            aria-label={t('editor.code_language')}
                            title={t('editor.code_language')}
                            data-post-code-language="true"
                            className={clsx(
                                'inline-flex h-8 max-w-[9.5rem] shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-600 transition dark:text-zinc-300',
                                'hover:bg-zinc-950/5 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-white',
                                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                                'bg-zinc-950/5 dark:bg-white/10'
                            )}
                        >
                            <span className="truncate">
                                {CODE_BLOCK_LANGUAGES.find((option) => option.value === codeLanguage)?.label ??
                                    CODE_BLOCK_LANGUAGES[0].label}
                            </span>
                        </DropdownButton>
                        <DropdownMenu anchor="bottom start" className="min-w-44 max-h-72 overflow-y-auto">
                            {CODE_BLOCK_LANGUAGES.map((option) => {
                                const active = option.value === codeLanguage;

                                return (
                                    <DropdownItem
                                        key={option.label}
                                        disabled={toolbarDisabled}
                                        onClick={() => {
                                            editor
                                                .chain()
                                                .focus()
                                                .updateAttributes('codeBlock', {
                                                    language: option.value === '' ? null : option.value,
                                                })
                                                .run();
                                        }}
                                    >
                                        <DropdownLabel>{option.label}</DropdownLabel>
                                        {active ? (
                                            <DropdownTrailingIcon>
                                                <CheckIcon className="size-4 text-zinc-950 dark:text-white" />
                                            </DropdownTrailingIcon>
                                        ) : null}
                                    </DropdownItem>
                                );
                            })}
                        </DropdownMenu>
                    </Dropdown>
                </>
            ) : null}

            {inTable ? (
                <>
                    <ToolbarDivider />
                    <ToolbarButton
                        label={t('editor.add_column')}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                    >
                        <span className="text-[10px] font-semibold">+Col</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label={t('editor.add_row')}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                    >
                        <span className="text-[10px] font-semibold">+Row</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label={t('editor.delete_table')}
                        disabled={toolbarDisabled}
                        onClick={() => editor.chain().focus().deleteTable().run()}
                    >
                        <TrashIcon className="size-4" />
                    </ToolbarButton>
                </>
            ) : null}

            {onToggleFocusMode !== undefined ? (
                <>
                    <ToolbarDivider />
                    <div className="ms-auto shrink-0">
                        <ToolbarButton
                            label={focusMode ? t('editor.exit_focus') : t('editor.focus')}
                            active={focusMode}
                            disabled={toolbarDisabled}
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
    const { t } = useCanvas();

    return (
        <Dialog open={open} onClose={onClose} size="sm" data-post-link-dialog="true">
            <form onSubmit={onApply}>
                <DialogTitle>{t('editor.link_url')}</DialogTitle>
                <DialogDescription>{t('editor.link_help')}</DialogDescription>
                <DialogBody>
                    <Field>
                        <Label>{t('editor.url')}</Label>
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
                            {t('editor.remove_link')}
                        </Button>
                    ) : null}
                    <Button type="button" plain onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" color="dark/zinc">
                        {t('editor.apply')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

function AiCustomDialog({
    open,
    value,
    busy,
    onChange,
    onClose,
    onApply,
    inputRef,
}: {
    open: boolean;
    value: string;
    busy: boolean;
    onChange: (value: string) => void;
    onClose: () => void;
    onApply: (event?: FormEvent) => void;
    inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
    const { t } = useCanvas();

    return (
        <Dialog open={open} onClose={busy ? () => undefined : onClose} size="sm" data-post-ai-dialog="true">
            <form onSubmit={onApply}>
                <DialogTitle>{t('editor.ai_custom_prompt')}</DialogTitle>
                <DialogDescription>{t('editor.ai_custom_help')}</DialogDescription>
                <DialogBody>
                    <Field>
                        <Label>{t('editor.ai_instruction')}</Label>
                        <Textarea
                            ref={inputRef}
                            name="instruction"
                            rows={4}
                            value={value}
                            disabled={busy}
                            onChange={(event) => onChange(event.target.value)}
                            placeholder={t('editor.ai_custom_instruction_placeholder')}
                        />
                    </Field>
                </DialogBody>
                <DialogActions>
                    <Button type="button" plain disabled={busy} onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" color="dark/zinc" disabled={busy || value.trim() === ''}>
                        {busy ? t('editor.rewriting') : t('editor.rewrite')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default function PostBodyEditor({
    body,
    title = '',
    disabled = false,
    focusMode = false,
    onToggleFocusMode,
    onChange,
}: PostBodyEditorProps) {
    const { boot, t } = useCanvas();
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [dialogValue, setDialogValue] = useState('https://');
    const [mediaOpen, setMediaOpen] = useState(false);
    const [aiBusy, setAiBusy] = useState(false);
    const [aiCustomOpen, setAiCustomOpen] = useState(false);
    const [aiInstruction, setAiInstruction] = useState('');
    const dialogInputRef = useRef<HTMLInputElement>(null);
    const aiInstructionRef = useRef<HTMLTextAreaElement>(null);
    const aiSelectionRef = useRef<{ from: number; to: number; text: string } | null>(null);
    const aiAbortRef = useRef<AbortController | null>(null);
    const aiSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const editor = useEditor({
        extensions: createPostEditorExtensions(),
        content: bodyHtmlForEditor(body),
        editable: !disabled,
        // Toolbar reads isActive() / getAttributes(); re-render on selection so
        // code-language (and mark toggles) stay in sync when the caret moves.
        shouldRerenderOnTransaction: true,
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

    useEffect(() => {
        if (!aiCustomOpen) {
            return;
        }

        const timer = window.setTimeout(() => {
            aiInstructionRef.current?.focus();
        }, 50);

        return () => window.clearTimeout(timer);
    }, [aiCustomOpen]);

    useEffect(() => {
        return () => {
            aiAbortRef.current?.abort();
            if (aiSettleTimerRef.current !== null) {
                clearTimeout(aiSettleTimerRef.current);
            }
        };
    }, []);

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

    function captureAiSelection(): { from: number; to: number; text: string } | null {
        if (editor === null || disabled || aiBusy) {
            return null;
        }

        const { from, to } = editor.state.selection;
        const text = selectionText(from, to, (a, b) => editor.state.doc.textBetween(a, b, '\n'));

        if (text === '') {
            toast.error(t('editor.ai_select_text'));

            return null;
        }

        return { from, to, text };
    }

    async function runAiRewrite(action: AiRewriteAction, instruction?: string | null) {
        if (editor === null) {
            return;
        }

        const selection = action === 'custom' ? aiSelectionRef.current : captureAiSelection();

        if (selection === null) {
            return;
        }

        if (aiSettleTimerRef.current !== null) {
            clearTimeout(aiSettleTimerRef.current);
            aiSettleTimerRef.current = null;
        }

        aiAbortRef.current?.abort();
        const controller = new AbortController();
        aiAbortRef.current = controller;

        setAiBusy(true);
        editor.commands.setAiRewriteDecoration(selection.from, selection.to, 'pending');

        try {
            const response = await aiApi.rewrite(
                {
                    action,
                    text: selection.text,
                    instruction: instruction ?? null,
                    title: title.trim() === '' ? null : title.trim(),
                },
                controller.signal
            );

            const next = response.text.trim();

            if (next === '') {
                editor.commands.clearAiRewriteDecoration();
                toast.error(t('editor.ai_empty_result'));

                return;
            }

            editor
                .chain()
                .focus()
                .setTextSelection({ from: selection.from, to: selection.to })
                .insertContent(next)
                .run();

            // Prefer live selection end after insert; plain-text length is a fallback.
            const settleFrom = selection.from;
            const settleTo = Math.max(settleFrom, editor.state.selection.to);
            const fallback = rangeAfterPlainTextReplace(selection.from, next);
            const to = settleTo > settleFrom ? settleTo : fallback.to;

            editor.commands.setAiRewriteDecoration(settleFrom, to, 'settled');

            aiSettleTimerRef.current = setTimeout(() => {
                aiSettleTimerRef.current = null;
                if (!editor.isDestroyed) {
                    editor.commands.clearAiRewriteDecoration();
                }
            }, AI_REWRITE_SETTLE_MS);

            if (action === 'custom') {
                setAiCustomOpen(false);
                setAiInstruction('');
                aiSelectionRef.current = null;
            }
        } catch (error) {
            // A newer rewrite owns decorations / busy state when this request was aborted.
            if (controller.signal.aborted || aiAbortRef.current !== controller) {
                return;
            }

            editor.commands.clearAiRewriteDecoration();
            toast.error(rewriteErrorMessage(error, t('editor.ai_rewrite_error')));
        } finally {
            if (aiAbortRef.current === controller) {
                aiAbortRef.current = null;
                setAiBusy(false);
            }
        }
    }

    function openAiCustomDialog() {
        const selection = captureAiSelection();

        if (selection === null) {
            return;
        }

        aiSelectionRef.current = selection;
        setAiInstruction('');
        setAiCustomOpen(true);
    }

    function closeAiCustomDialog() {
        if (aiBusy) {
            return;
        }

        setAiCustomOpen(false);
        setAiInstruction('');
        aiSelectionRef.current = null;
    }

    function applyAiCustomDialog(event?: FormEvent) {
        event?.preventDefault();

        const instruction = aiInstruction.trim();

        if (instruction === '') {
            return;
        }

        void runAiRewrite('custom', instruction);
    }

    const characters = editor?.storage.characterCount.characters() ?? 0;
    const words = editor?.storage.characterCount.words() ?? 0;
    const hasExistingLink = editor?.isActive('link') ?? false;
    const aiEnabled = boot.ai === true;

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
                    aiEnabled={aiEnabled}
                    aiBusy={aiBusy}
                    onOpenLink={openLinkDialog}
                    onOpenMedia={() => {
                        if (!disabled && !aiBusy) {
                            setMediaOpen(true);
                        }
                    }}
                    onAiAction={(action) => {
                        void runAiRewrite(action);
                    }}
                    onOpenAiCustom={openAiCustomDialog}
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
                        {words === 1
                            ? t('common.words_one', { count: words.toLocaleString() })
                            : t('common.words_other', { count: words.toLocaleString() })}
                    </span>
                    <span>
                        {characters === 1
                            ? t('common.characters_one', { count: characters.toLocaleString() })
                            : t('common.characters_other', { count: characters.toLocaleString() })}
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

            <AiCustomDialog
                open={aiCustomOpen}
                value={aiInstruction}
                busy={aiBusy}
                onChange={setAiInstruction}
                onClose={closeAiCustomDialog}
                onApply={applyAiCustomDialog}
                inputRef={aiInstructionRef}
            />

            <ImageSourcePicker
                open={mediaOpen}
                onClose={() => setMediaOpen(false)}
                onSelect={(selection) => {
                    if (editor === null) {
                        return;
                    }

                    editor
                        .chain()
                        .focus()
                        .setImage({
                            src: resolveMediaUrl(selection.url),
                            alt: selection.alt ?? '',
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
