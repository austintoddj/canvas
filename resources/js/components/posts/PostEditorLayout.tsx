import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import type { ReactNode } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Heading } from '@/components/heading';
import { Input } from '@/components/input';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { isPublished, saveStatusLabel, type PostFormState, type PostSaveStatus } from '@/lib/posts/form';

type PostEditorLayoutProps = {
    form: PostFormState;
    titleError?: string;
    saveStatus: PostSaveStatus;
    onTitleChange: (title: string) => void;
    onSaveNow: () => void;
    body: ReactNode;
    sidebar: ReactNode;
    disabled?: boolean;
};

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
        <div className="space-y-8">
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
                                    ? 'text-sm text-canvas-danger dark:text-canvas-danger-dark'
                                    : 'text-sm text-canvas-muted dark:text-canvas-muted-dark'
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

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
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
                        {titleError ? <ErrorText className="mt-2">{titleError}</ErrorText> : null}
                    </div>

                    {body}
                </div>

                <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                    <div>
                        <Heading level={3} className="text-base/7">
                            Post settings
                        </Heading>
                        <PageDescription>Slug, summary, and taxonomy</PageDescription>
                    </div>
                    {sidebar}
                </aside>
            </div>
        </div>
    );
}
