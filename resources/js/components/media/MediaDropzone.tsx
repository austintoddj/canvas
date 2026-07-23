import clsx from 'clsx';
import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';

import { Text } from '@/components/text';
import { ALLOWED_MEDIA_MIME_TYPES, getMaxUploadBytes } from '@/lib/api/media';
import { applyDragDepth, isFileDragTypes } from '@/lib/media/drag';
import { formatMediaBytes, mediaFilesFromList } from '@/lib/media/list';
import { IconPhoto, IconUpload } from '@tabler/icons-react';

const ACCEPT = ALLOWED_MEDIA_MIME_TYPES.join(',');

type MediaDropzoneProps = {
    onFiles: (files: File[]) => void;
    uploading?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    /** Larger empty-state treatment. */
    spacious?: boolean;
    /**
     * When true, this zone does not own drag-active styling (parent page
     * provides a full-surface overlay). Click-to-browse still works.
     */
    suppressDragHighlight?: boolean;
    className?: string;
    label?: string;
    hint?: string;
};

export function MediaDropzone({
    onFiles,
    uploading = false,
    disabled = false,
    multiple = true,
    spacious = false,
    suppressDragHighlight = false,
    className,
    label = 'Drop images here, or click to browse',
    hint,
}: MediaDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const dragDepth = useRef(0);
    const [dragging, setDragging] = useState(false);

    const isDisabled = disabled || uploading;
    const showDragging = dragging && !suppressDragHighlight;
    const resolvedHint = hint ?? `JPG, PNG, GIF, or WebP · up to ${formatMediaBytes(getMaxUploadBytes())}`;

    function openPicker() {
        if (isDisabled) {
            return;
        }

        inputRef.current?.click();
    }

    function emitFiles(files: File[]) {
        if (isDisabled || files.length === 0) {
            return;
        }

        onFiles(multiple ? files : files.slice(0, 1));
    }

    function handleDragEnter(event: DragEvent<HTMLDivElement>) {
        if (suppressDragHighlight) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (isDisabled) {
            return;
        }

        const next = applyDragDepth(dragDepth.current, 'enter');
        dragDepth.current = next.depth;

        if (isFileDragTypes(event.dataTransfer.types)) {
            setDragging(next.active);
        }
    }

    function handleDragLeave(event: DragEvent<HTMLDivElement>) {
        if (suppressDragHighlight) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const next = applyDragDepth(dragDepth.current, 'leave');
        dragDepth.current = next.depth;
        setDragging(next.active);
    }

    function handleDragOver(event: DragEvent<HTMLDivElement>) {
        if (suppressDragHighlight) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (!isDisabled) {
            event.dataTransfer.dropEffect = 'copy';
        }
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        if (suppressDragHighlight) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const next = applyDragDepth(dragDepth.current, 'reset');
        dragDepth.current = next.depth;
        setDragging(next.active);

        if (isDisabled) {
            return;
        }

        emitFiles(mediaFilesFromList(event.dataTransfer.files));
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
        }
    }

    return (
        <div
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            aria-disabled={isDisabled || undefined}
            aria-label={uploading ? 'Uploading images' : label}
            onClick={openPicker}
            onKeyDown={handleKeyDown}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={clsx(
                className,
                'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition duration-200',
                spacious ? 'min-h-56 py-14' : 'min-h-28 py-8',
                isDisabled
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:border-zinc-950/25 dark:hover:border-white/20 dark:hover:bg-white/[0.04]',
                showDragging
                    ? 'border-zinc-950 bg-zinc-950/[0.04] dark:border-white/40 dark:bg-white/[0.08]'
                    : 'border-zinc-950/10 bg-zinc-950/[0.02] dark:border-white/10 dark:bg-white/[0.03]',
                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple={multiple}
                className="hidden"
                disabled={isDisabled}
                onChange={(event) => {
                    emitFiles(mediaFilesFromList(event.target.files));
                    event.target.value = '';
                }}
            />

            <span
                className={clsx(
                    'flex size-11 items-center justify-center rounded-full transition duration-200',
                    showDragging
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                        : 'bg-zinc-950/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-300'
                )}
            >
                {uploading ? (
                    <IconUpload className="size-5 animate-pulse" aria-hidden="true" />
                ) : (
                    <IconPhoto className="size-5" aria-hidden="true" />
                )}
            </span>

            <Text className="mt-3 text-sm font-medium text-zinc-950 dark:text-white">
                {uploading ? 'Uploading…' : showDragging ? 'Drop to upload' : label}
            </Text>
            <Text className="mt-1 text-xs text-canvas-muted dark:text-canvas-muted-dark">{resolvedHint}</Text>
        </div>
    );
}
