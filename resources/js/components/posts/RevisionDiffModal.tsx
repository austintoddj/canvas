import { useState } from 'react';

import { Button } from '@/components/button';
import { Dialog, DialogBody, DialogCloseButton, DialogTitle } from '@/components/dialog';
import { computeDiffStats, computeTextDiff, stripHtml, type DiffPart, type DiffStats } from '@/lib/posts/text-diff';
import { cn } from '@/lib/utils';

type RevisionDiffModalProps = {
    open: boolean;
    onClose: () => void;
    versionLabel: string;
    currentLabel: string;
    beforeTitle: string;
    afterTitle: string;
    beforeBody: string;
    afterBody: string;
    loading?: boolean;
    restoreBusy?: boolean;
    /** When false, restore is a no-op (snapshot matches the editor). */
    canRestore?: boolean;
    matchesEditor?: boolean;
    matchesEditorLabel?: string;
    onRename?: () => void;
    renameLabel?: string;
    onRestore: () => void;
    closeLabel: string;
    changesLabel: string;
    restoreLabel: string;
    titleFieldLabel: string;
    bodyFieldLabel: string;
    loadingLabel: string;
    noTitleChangesLabel: string;
    noBodyChangesLabel: string;
};

type DiffSnapshot = {
    versionLabel: string;
    currentLabel: string;
    beforeTitle: string;
    afterTitle: string;
    beforeBody: string;
    afterBody: string;
    matchesEditor: boolean;
    canRestore: boolean;
};

function snapshotsEqual(a: DiffSnapshot, b: DiffSnapshot): boolean {
    return (
        a.versionLabel === b.versionLabel &&
        a.currentLabel === b.currentLabel &&
        a.beforeTitle === b.beforeTitle &&
        a.afterTitle === b.afterTitle &&
        a.beforeBody === b.beforeBody &&
        a.afterBody === b.afterBody &&
        a.matchesEditor === b.matchesEditor &&
        a.canRestore === b.canRestore
    );
}

function sideClass(type: DiffPart['type'], side: 'before' | 'after'): string {
    if (type === 'equal') {
        return 'text-canvas-fg dark:text-canvas-fg-dark';
    }

    if (side === 'before' && type === 'deleted') {
        return 'bg-red-500/15 text-red-800 line-through dark:bg-red-400/15 dark:text-red-300';
    }

    if (side === 'after' && type === 'added') {
        return 'bg-green-500/15 text-green-800 dark:bg-green-400/15 dark:text-green-300';
    }

    return 'text-canvas-fg dark:text-canvas-fg-dark';
}

function SideDiff({
    before,
    after,
    side,
    emptyLabel,
}: {
    before: string;
    after: string;
    side: 'before' | 'after';
    emptyLabel: string;
}) {
    const parts = computeTextDiff(before, after);
    const visible = parts.filter((part) => {
        if (part.type === 'equal') {
            return true;
        }

        return side === 'before' ? part.type === 'deleted' : part.type === 'added';
    });
    const hasChanges = parts.some((part) => part.type === 'added' || part.type === 'deleted');

    if (parts.length === 0 || !hasChanges) {
        const plain = stripHtml(side === 'before' ? before : after);
        const text = plain === '' ? emptyLabel : plain;

        return (
            <p
                className={cn(
                    'whitespace-pre-wrap break-words text-sm leading-relaxed',
                    plain === ''
                        ? 'text-canvas-muted dark:text-canvas-muted-dark'
                        : 'text-canvas-fg dark:text-canvas-fg-dark'
                )}
            >
                {text}
            </p>
        );
    }

    return (
        <div
            className="whitespace-pre-wrap break-words text-sm leading-relaxed text-canvas-fg dark:text-canvas-fg-dark"
            data-revision-diff-side={side}
        >
            {visible.map((part, index) => (
                <span
                    key={`${side}-${part.type}-${index}`}
                    data-diff-type={part.type}
                    className={cn(sideClass(part.type, side), part.type !== 'equal' && 'rounded-sm px-0.5')}
                >
                    {part.value}
                </span>
            ))}
        </div>
    );
}

/** Single-column plain snapshot (used when the revision matches the editor). */
function SnapshotField({ value }: { value: string }) {
    const plain = stripHtml(value);

    return (
        <p
            className={cn(
                'whitespace-pre-wrap break-words text-sm leading-relaxed',
                plain === ''
                    ? 'text-canvas-muted dark:text-canvas-muted-dark'
                    : 'text-canvas-fg dark:text-canvas-fg-dark'
            )}
            data-revision-snapshot-field="true"
        >
            {plain === '' ? '—' : plain}
        </p>
    );
}

/** GitHub-style +N −N character counts for a field header. */
function FieldDiffStats({ stats }: { stats: DiffStats }) {
    if (stats.added === 0 && stats.deleted === 0) {
        return null;
    }

    return (
        <span
            className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums"
            data-revision-diff-stats="true"
            aria-label={`+${stats.added} −${stats.deleted}`}
        >
            {stats.added > 0 ? (
                <span className="text-green-700 dark:text-green-400" data-diff-stat="added">
                    +{stats.added}
                </span>
            ) : null}
            {stats.deleted > 0 ? (
                <span className="text-red-700 dark:text-red-400" data-diff-stat="deleted">
                    −{stats.deleted}
                </span>
            ) : null}
        </span>
    );
}

function FieldHeading({ label, before, after }: { label: string; before: string; after: string }) {
    const stats = computeDiffStats(before, after);

    return (
        <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-canvas-muted dark:text-canvas-muted-dark">
                {label}
            </p>
            <FieldDiffStats stats={stats} />
        </div>
    );
}

function FieldLabel({ label }: { label: string }) {
    return (
        <p className="text-xs font-medium uppercase tracking-wide text-canvas-muted dark:text-canvas-muted-dark">
            {label}
        </p>
    );
}

export default function RevisionDiffModal({
    open,
    onClose,
    versionLabel,
    currentLabel,
    beforeTitle,
    afterTitle,
    beforeBody,
    afterBody,
    loading = false,
    restoreBusy = false,
    canRestore = true,
    matchesEditor = false,
    matchesEditorLabel = 'This matches what’s in the editor.',
    onRename,
    renameLabel = 'Rename',
    onRestore,
    closeLabel,
    changesLabel,
    restoreLabel,
    titleFieldLabel,
    bodyFieldLabel,
    loadingLabel,
    noTitleChangesLabel,
    noBodyChangesLabel,
}: RevisionDiffModalProps) {
    const live: DiffSnapshot = {
        versionLabel,
        currentLabel,
        beforeTitle,
        afterTitle,
        beforeBody,
        afterBody,
        matchesEditor,
        canRestore,
    };

    // Freeze the last rendered snapshot so leave animations never swap to empty
    // or a different revision while Headless is still painting the close transition.
    const [frozen, setFrozen] = useState<DiffSnapshot>(live);

    if (open && !loading && !snapshotsEqual(frozen, live)) {
        setFrozen(live);
    }

    const view = open && !loading ? live : frozen;
    const titleChanged = view.beforeTitle !== view.afterTitle;
    const bodyChanged = view.beforeBody !== view.afterBody;
    const showLoading = open && loading;
    const restoreEnabled = view.canRestore && !view.matchesEditor;
    const canRename = onRename !== undefined;
    const dialogTitle = view.matchesEditor ? view.versionLabel : changesLabel;

    return (
        <Dialog open={open} onClose={onClose} size="5xl" className="relative max-h-[min(90vh,56rem)] overflow-hidden">
            <div className="flex items-start justify-between gap-3">
                <DialogTitle>{dialogTitle}</DialogTitle>
                <div className="flex shrink-0 items-center gap-2">
                    {canRename ? (
                        <Button
                            type="button"
                            outline
                            disabled={restoreBusy || showLoading}
                            onClick={onRename}
                            data-revision-rename-trigger="true"
                        >
                            {renameLabel}
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        color="dark/zinc"
                        disabled={restoreBusy || showLoading || !restoreEnabled}
                        onClick={onRestore}
                        data-revision-restore-primary="true"
                    >
                        {restoreLabel}
                    </Button>
                    <DialogCloseButton label={closeLabel} disabled={restoreBusy} />
                </div>
            </div>

            <DialogBody className="mt-4 max-h-[min(70vh,42rem)] overflow-y-auto" data-version-history-diff="true">
                {showLoading ? (
                    <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">{loadingLabel}</p>
                ) : view.matchesEditor ? (
                    <div className="space-y-6" data-revision-snapshot="true">
                        <div
                            className="rounded-xl border border-zinc-950/10 bg-zinc-950/[0.03] px-3.5 py-2.5 dark:border-white/10 dark:bg-white/[0.04]"
                            data-revision-diff-matches="true"
                        >
                            <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                {matchesEditorLabel}
                            </p>
                        </div>

                        <section className="space-y-2">
                            <FieldLabel label={titleFieldLabel} />
                            <div className="rounded-xl border border-zinc-950/10 bg-zinc-950/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                <SnapshotField value={view.beforeTitle} />
                            </div>
                        </section>

                        <section className="space-y-2">
                            <FieldLabel label={bodyFieldLabel} />
                            <div className="rounded-xl border border-zinc-950/10 bg-zinc-950/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                <SnapshotField value={view.beforeBody} />
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                            <p className="text-sm font-semibold text-zinc-950 dark:text-white">{view.versionLabel}</p>
                            <p className="text-sm font-semibold text-zinc-950 dark:text-white">{view.currentLabel}</p>
                        </div>

                        {titleChanged ? (
                            <section className="space-y-2">
                                <FieldHeading
                                    label={titleFieldLabel}
                                    before={view.beforeTitle}
                                    after={view.afterTitle}
                                />
                                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                                    <div className="rounded-xl border border-zinc-950/10 bg-zinc-950/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <SideDiff
                                            before={view.beforeTitle}
                                            after={view.afterTitle}
                                            side="before"
                                            emptyLabel={noTitleChangesLabel}
                                        />
                                    </div>
                                    <div className="rounded-xl border border-zinc-950/10 bg-zinc-950/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <SideDiff
                                            before={view.beforeTitle}
                                            after={view.afterTitle}
                                            side="after"
                                            emptyLabel={noTitleChangesLabel}
                                        />
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        <section className="space-y-2">
                            <FieldHeading label={bodyFieldLabel} before={view.beforeBody} after={view.afterBody} />
                            {bodyChanged || !titleChanged ? (
                                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                                    <div className="rounded-xl border border-zinc-950/10 bg-zinc-950/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <SideDiff
                                            before={view.beforeBody}
                                            after={view.afterBody}
                                            side="before"
                                            emptyLabel={noBodyChangesLabel}
                                        />
                                    </div>
                                    <div className="rounded-xl border border-zinc-950/10 bg-zinc-950/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <SideDiff
                                            before={view.beforeBody}
                                            after={view.afterBody}
                                            side="after"
                                            emptyLabel={noBodyChangesLabel}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                    {noBodyChangesLabel}
                                </p>
                            )}
                        </section>
                    </div>
                )}
            </DialogBody>
        </Dialog>
    );
}
