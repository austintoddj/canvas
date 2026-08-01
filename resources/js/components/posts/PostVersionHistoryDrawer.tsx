import { useEffect, useMemo, useState } from 'react';

import { Alert, AlertActions, AlertBody, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { PillNav, PillNavItem } from '@/components/pill-nav';
import RevisionDiffModal from '@/components/posts/RevisionDiffModal';
import { SideDrawer } from '@/components/SideDrawer';
import { useCanvas } from '@/hooks/useCanvas';
import { postsApi } from '@/lib/api/posts';
import {
    filterRevisions,
    groupRevisionsByPeriod,
    revisionListPrimaryLabel,
    revisionListSecondaryLine,
    revisionMatchesEditor,
    type RevisionFilter,
} from '@/lib/posts/revision-history';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { Post, PostRevision, PostRevisionListItem } from '@/types/api';
import { IconHistory } from '@tabler/icons-react';

type PostVersionHistoryDrawerProps = {
    open: boolean;
    onClose: () => void;
    postId: string | null;
    /** Current editor body/title used as the "after" side when previewing a revision. */
    currentTitle: string;
    currentBody: string | null;
    onRestored: (post: Post) => void;
};

/** Keep selected revision content mounted through the dialog leave transition. */
const DIFF_CLOSE_CLEAR_MS = 180;

export default function PostVersionHistoryDrawer({
    open,
    onClose,
    postId,
    currentTitle,
    currentBody,
    onRestored,
}: PostVersionHistoryDrawerProps) {
    const { t } = useCanvas();
    const [revisions, setRevisions] = useState<PostRevisionListItem[]>([]);
    const [fullById, setFullById] = useState<Map<string, PostRevision>>(() => new Map());
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filter, setFilter] = useState<RevisionFilter>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [diffOpen, setDiffOpen] = useState(false);
    const [selectedLoading, setSelectedLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    useEffect(() => {
        if (!open || postId === null) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            setLoading(true);
            setLoadError(null);
            setFilter('all');
            setSelectedId(null);
            setDiffOpen(false);
            setRenameOpen(false);
            setFullById(new Map());
        });

        postsApi
            .revisions(postId, controller.signal)
            .then((response) => {
                if (cancelled) {
                    return;
                }

                setRevisions(response.revisions);
                setLoadError(null);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setLoadError(t('editor.history_load_error', 'Unable to load version history.'));
                setRevisions([]);
                setLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [open, postId, t]);

    const visibleRevisions = useMemo(() => filterRevisions(revisions, filter), [revisions, filter]);
    const groups = useMemo(
        () =>
            groupRevisionsByPeriod(visibleRevisions, new Date(), {
                today: t('editor.history_today', 'Today'),
                yesterday: t('editor.history_yesterday', 'Yesterday'),
                lastWeek: t('editor.history_last_week', 'Last week'),
            }),
        [visibleRevisions, t]
    );

    const selectedFull = selectedId !== null ? (fullById.get(selectedId) ?? null) : null;
    const selectedList = useMemo(
        () => revisions.find((revision) => revision.id === selectedId) ?? null,
        [revisions, selectedId]
    );

    async function selectRevision(id: string) {
        // Newest checkpoint alone is still openable; restore is disabled when it matches the editor.
        setSelectedId(id);
        setDiffOpen(true);
        setRenameOpen(false);

        if (postId === null || fullById.has(id)) {
            return;
        }

        setSelectedLoading(true);

        try {
            const response = await postsApi.revision(postId, id);
            setFullById((current) => {
                const next = new Map(current);
                next.set(id, response.revision);
                return next;
            });
        } catch {
            toast.error(t('editor.history_load_error', 'Unable to load version history.'));
            setSelectedId(null);
            setDiffOpen(false);
        } finally {
            setSelectedLoading(false);
        }
    }

    function closeDiff() {
        setDiffOpen(false);
        setRenameOpen(false);
    }

    function openRename() {
        setRenameValue(selectedList?.label ?? selectedFull?.label ?? '');
        setRenameOpen(true);
    }

    function closeRename() {
        if (busyId !== null) {
            return;
        }

        setRenameOpen(false);
    }

    useEffect(() => {
        if (diffOpen || selectedId === null) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSelectedId(null);
            setRenameValue('');
            setRenameOpen(false);
        }, DIFF_CLOSE_CLEAR_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [diffOpen, selectedId]);

    async function handleRestore(revision: PostRevisionListItem) {
        if (postId === null || busyId !== null) {
            return;
        }

        setBusyId(revision.id);

        try {
            const post = await postsApi.restoreRevision(postId, revision.id);
            onRestored(post);
            if (post.has_pending_changes) {
                toast.success(t('editor.history_restored_pending', 'Restored as pending edits — Update to publish.'));
            } else {
                toast.success(t('editor.history_restored', 'Version restored.'));
            }
            setDiffOpen(false);
            setSelectedId(null);
            setRenameOpen(false);
            onClose();
        } catch {
            toast.error(t('editor.history_restore_error', 'Unable to restore this version.'));
        } finally {
            setBusyId(null);
        }
    }

    async function submitRename() {
        if (postId === null || selectedId === null || busyId !== null) {
            return;
        }

        const revisionId = selectedId;
        const nextLabel = renameValue.trim() === '' ? null : renameValue.trim();
        setBusyId(revisionId);

        try {
            const response = await postsApi.renameRevision(postId, revisionId, { label: nextLabel });
            setRevisions((current) => current.map((item) => (item.id === revisionId ? response.revision : item)));
            setFullById((current) => {
                const full = current.get(revisionId);
                if (!full) {
                    return current;
                }
                const next = new Map(current);
                next.set(revisionId, {
                    ...full,
                    label: response.revision.label,
                    user: response.revision.user,
                });
                return next;
            });
            setRenameOpen(false);
            toast.success(t('editor.history_renamed', 'Version renamed.'));
        } catch {
            toast.error(t('editor.history_rename_error', 'Unable to rename this version.'));
        } finally {
            setBusyId(null);
        }
    }

    const afterTitle = currentTitle;
    const afterBody = currentBody ?? '';
    const beforeTitle = selectedFull?.title ?? '';
    const beforeBody = selectedFull?.body ?? '';
    const versionLabel =
        selectedList !== null
            ? revisionListPrimaryLabel(selectedList)
            : t('editor.history_this_version', 'This version');
    const matchesEditor = selectedFull !== null && revisionMatchesEditor(selectedFull, currentTitle, currentBody);

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={t('editor.history_title', 'Version history')}
                closeLabel={t('common.close')}
            >
                <div className="flex min-h-0 flex-1 flex-col" data-version-history-drawer="true">
                    {loading ? (
                        <p className="px-5 py-4 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            {t('common.loading')}
                        </p>
                    ) : null}

                    {loadError !== null ? (
                        <div className="space-y-3 px-5 py-4">
                            <p className="text-sm text-canvas-danger dark:text-canvas-danger-dark">{loadError}</p>
                            <Button
                                type="button"
                                outline
                                onClick={() => {
                                    if (postId === null) {
                                        return;
                                    }

                                    setLoading(true);
                                    setLoadError(null);
                                    void postsApi
                                        .revisions(postId)
                                        .then((response) => {
                                            setRevisions(response.revisions);
                                            setLoading(false);
                                        })
                                        .catch(() => {
                                            setLoadError(
                                                t('editor.history_load_error', 'Unable to load version history.')
                                            );
                                            setRevisions([]);
                                            setLoading(false);
                                        });
                                }}
                            >
                                {t('editor.history_retry', 'Try again')}
                            </Button>
                        </div>
                    ) : null}

                    {!loading && loadError === null ? (
                        <div
                            className="border-b border-canvas-border px-5 py-3 dark:border-canvas-border-dark"
                            data-revision-filter="true"
                        >
                            <PillNav
                                value={filter}
                                onChange={setFilter}
                                aria-label={t('editor.history_filter_label', 'Filter versions')}
                                className="w-full"
                            >
                                <PillNavItem value="all" className="flex-1 justify-center">
                                    {t('editor.history_filter_all', 'All versions')}
                                </PillNavItem>
                                <PillNavItem value="named" className="flex-1 justify-center">
                                    {t('editor.history_filter_named', 'Named versions')}
                                </PillNavItem>
                            </PillNav>
                        </div>
                    ) : null}

                    {!loading && loadError === null && revisions.length === 0 ? (
                        <div
                            className="flex flex-col items-center gap-2 px-5 py-12 text-center"
                            data-version-history-empty="true"
                        >
                            <IconHistory className="size-8 text-canvas-muted dark:text-canvas-muted-dark" />
                            <p className="text-sm font-medium text-canvas-fg dark:text-canvas-fg-dark">
                                {t('editor.history_empty_title', 'No versions yet')}
                            </p>
                            <p className="max-w-xs text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                {t(
                                    'editor.history_empty_blurb',
                                    'Versions are saved when you publish, update, or leave the editor.'
                                )}
                            </p>
                        </div>
                    ) : null}

                    {!loading && loadError === null && revisions.length > 0 && visibleRevisions.length === 0 ? (
                        <div
                            className="flex flex-col items-center gap-2 px-5 py-12 text-center"
                            data-version-history-empty-filter="true"
                        >
                            <p className="text-sm font-medium text-canvas-fg dark:text-canvas-fg-dark">
                                {t('editor.history_named_empty_title', 'No named versions')}
                            </p>
                            <p className="max-w-xs text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                {t(
                                    'editor.history_named_empty_blurb',
                                    'Rename a version to pin a label, then filter here.'
                                )}
                            </p>
                        </div>
                    ) : null}

                    {!loading && loadError === null && groups.length > 0 ? (
                        <div className="space-y-5 px-5 py-4" data-version-history-list="true">
                            {groups.map((group) => (
                                <section
                                    key={group.periodKey}
                                    data-revision-period={group.periodKey}
                                    data-revision-period-count={group.revisions.length}
                                >
                                    <h3 className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-canvas-muted dark:text-canvas-muted-dark">
                                        {group.periodLabel}
                                    </h3>
                                    <ul className="rounded-xl border border-zinc-950/10 dark:border-white/10">
                                        {group.revisions.map((revision, index) => (
                                            <RevisionRow
                                                key={revision.id}
                                                revision={revision}
                                                selected={selectedId === revision.id && diffOpen}
                                                isFirst={index === 0}
                                                isLast={index === group.revisions.length - 1}
                                                showTopRule={index > 0}
                                                onSelect={() => void selectRevision(revision.id)}
                                            />
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    ) : null}
                </div>
            </SideDrawer>

            <RevisionDiffModal
                open={diffOpen}
                onClose={closeDiff}
                versionLabel={versionLabel}
                currentLabel={t('editor.history_current_version', 'Current version')}
                beforeTitle={beforeTitle}
                afterTitle={afterTitle}
                beforeBody={beforeBody}
                afterBody={afterBody}
                loading={selectedLoading || (diffOpen && selectedFull === null && selectedId !== null)}
                restoreBusy={busyId !== null}
                canRestore={!matchesEditor}
                matchesEditor={matchesEditor}
                matchesEditorLabel={t('editor.history_matches_editor', 'This matches what’s in the editor.')}
                onRename={openRename}
                renameLabel={t('editor.history_rename', 'Rename')}
                onRestore={() => {
                    if (matchesEditor) {
                        return;
                    }

                    if (selectedList !== null) {
                        void handleRestore(selectedList);
                        return;
                    }

                    if (selectedFull !== null) {
                        void handleRestore({
                            id: selectedFull.id,
                            post_id: selectedFull.post_id,
                            user_id: selectedFull.user_id,
                            label: selectedFull.label,
                            reason: selectedFull.reason,
                            title: selectedFull.title,
                            created_at: selectedFull.created_at,
                            updated_at: selectedFull.updated_at,
                            user: selectedFull.user,
                        });
                    }
                }}
                closeLabel={t('common.close')}
                changesLabel={t('editor.history_changes', 'Compare versions')}
                restoreLabel={t('editor.history_restore', 'Restore')}
                titleFieldLabel={t('editor.title_label', 'Title')}
                bodyFieldLabel={t('editor.history_body', 'Body')}
                loadingLabel={t('common.loading')}
                noTitleChangesLabel={t('editor.history_no_title_changes', 'No title changes')}
                noBodyChangesLabel={t('editor.history_no_body_changes', 'No body changes')}
            />

            <Alert open={renameOpen} onClose={closeRename} size="sm" data-revision-rename-dialog="true">
                <AlertTitle>{t('editor.history_rename_title', 'Rename version')}</AlertTitle>
                <AlertDescription>
                    {t(
                        'editor.history_rename_help',
                        'Named versions show up under the Named filter so you can find them quickly.'
                    )}
                </AlertDescription>
                <AlertBody>
                    <form
                        id="canvas-revision-rename-form"
                        data-revision-renaming="true"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submitRename();
                        }}
                    >
                        <Field>
                            <Label>{t('editor.history_rename_placeholder', 'Version name')}</Label>
                            <Input
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                placeholder={t('editor.history_rename_placeholder', 'Version name')}
                                // eslint-disable-next-line jsx-a11y/no-autofocus -- rename dialog opens from explicit user action
                                autoFocus
                                disabled={busyId !== null}
                                data-revision-rename-input="true"
                                maxLength={120}
                            />
                        </Field>
                    </form>
                </AlertBody>
                <AlertActions>
                    <Button type="button" plain disabled={busyId !== null} onClick={closeRename}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        form="canvas-revision-rename-form"
                        color="dark/zinc"
                        disabled={busyId !== null}
                        data-revision-rename-save="true"
                    >
                        {t('common.save')}
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}

type RevisionRowProps = {
    revision: PostRevisionListItem;
    selected: boolean;
    isFirst: boolean;
    isLast: boolean;
    showTopRule: boolean;
    onSelect: () => void;
};

function RevisionRow({ revision, selected, isFirst, isLast, showTopRule, onSelect }: RevisionRowProps) {
    const { t } = useCanvas();
    const primary = revisionListPrimaryLabel(revision);
    const secondary = revisionListSecondaryLine(revision, t);

    return (
        <li
            className={cn(
                isFirst && 'rounded-t-[calc(0.75rem-1px)]',
                isLast && 'rounded-b-[calc(0.75rem-1px)]',
                showTopRule && 'border-t border-zinc-950/5 dark:border-white/5'
            )}
            data-revision-row={revision.id}
            data-revision-reason={revision.reason ?? undefined}
        >
            <button
                type="button"
                className={cn(
                    'flex w-full min-h-[4.75rem] flex-col justify-center px-4 py-3 text-left transition-colors sm:px-5',
                    'hover:bg-zinc-950/[0.02] dark:hover:bg-white/[0.03]',
                    'outline-none focus-visible:bg-zinc-950/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 dark:focus-visible:bg-white/5',
                    selected && 'bg-zinc-950/5 dark:bg-white/5'
                )}
                onClick={onSelect}
                data-revision-select="true"
            >
                <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-white">{primary}</span>
                {secondary ? (
                    <span className="mt-0.5 block truncate text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {secondary}
                    </span>
                ) : null}
            </button>
        </li>
    );
}
