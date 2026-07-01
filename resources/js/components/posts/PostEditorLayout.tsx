import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import type { ReactNode } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Heading } from '@/components/heading';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { isPublished, type PostFormState } from '@/lib/posts/form';

type PostEditorLayoutProps = {
    form: PostFormState;
    titleError?: string;
    saveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
    onTitleChange: (title: string) => void;
    onSaveNow: () => void;
    body: ReactNode;
    sidebar: ReactNode;
    disabled?: boolean;
};

function saveStatusLabel(status: PostEditorLayoutProps['saveStatus']): string | null {
    switch (status) {
        case 'pending':
            return 'Unsaved changes';
        case 'saving':
            return 'Saving…';
        case 'saved':
            return 'Saved';
        case 'error':
            return 'Save failed';
        default:
            return null;
    }
}

export default function PostEditorLayout({
    form,
    titleError,
    saveStatus,
    onTitleChange,
    onSaveNow,
    body,
    sidebar,
    disabled = false,
}: PostEditorLayoutProps) {
    const published = isPublished(form);
    const statusLabel = saveStatusLabel(saveStatus);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-950/10 pb-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <Button href="/posts" plain aria-label="Back to posts">
                        <ArrowLeftIcon data-slot="icon" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Heading level={2} className="text-lg/7">
                            {form.title.trim() === '' ? 'Untitled post' : form.title}
                        </Heading>
                        <Badge color={published ? 'green' : 'amber'}>{published ? 'Published' : 'Draft'}</Badge>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {statusLabel ? (
                        <Text
                            className={
                                saveStatus === 'error'
                                    ? 'text-sm text-red-600 dark:text-red-500'
                                    : 'text-sm text-zinc-500 dark:text-zinc-400'
                            }
                        >
                            {statusLabel}
                        </Text>
                    ) : null}
                    <Button type="button" outline disabled={disabled || saveStatus === 'saving'} onClick={onSaveNow}>
                        Save
                    </Button>
                </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="min-w-0 space-y-6">
                    <div>
                        <label htmlFor="post-title" className="sr-only">
                            Title
                        </label>
                        <Input
                            id="post-title"
                            name="title"
                            value={form.title}
                            disabled={disabled}
                            invalid={titleError !== undefined}
                            placeholder="Post title"
                            className="[&_input]:border-0 [&_input]:bg-transparent [&_input]:px-0 [&_input]:py-0 [&_input]:text-3xl/10 [&_input]:font-semibold [&_input]:shadow-none [&_input]:ring-0 [&_input]:placeholder:text-zinc-400 sm:[&_input]:text-4xl/10"
                            onChange={(event) => onTitleChange(event.target.value)}
                        />
                        {titleError ? (
                            <Text className="mt-2 text-sm text-red-600 dark:text-red-500">{titleError}</Text>
                        ) : null}
                    </div>

                    {body}
                </div>

                <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                    <div>
                        <Heading level={3} className="text-base/7">
                            Post settings
                        </Heading>
                        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Slug, summary, and taxonomy
                        </Text>
                    </div>
                    {sidebar}
                </aside>
            </div>
        </div>
    );
}
