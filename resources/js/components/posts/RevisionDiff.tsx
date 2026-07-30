import { computeTextDiff, type DiffPart } from '@/lib/posts/text-diff';
import { cn } from '@/lib/utils';

type RevisionDiffProps = {
    before: string;
    after: string;
    emptyLabel?: string;
    className?: string;
};

function partClass(type: DiffPart['type']): string {
    switch (type) {
        case 'added':
            return 'bg-green-500/15 text-green-800 dark:bg-green-400/15 dark:text-green-300';
        case 'deleted':
            return 'bg-red-500/15 text-red-800 line-through dark:bg-red-400/15 dark:text-red-300';
        default:
            return 'text-canvas-fg dark:text-canvas-fg-dark';
    }
}

export default function RevisionDiff({ before, after, emptyLabel = 'No changes', className }: RevisionDiffProps) {
    const parts = computeTextDiff(before, after);
    const hasChanges = parts.some((part) => part.type === 'added' || part.type === 'deleted');

    if (parts.length === 0 || !hasChanges) {
        return (
            <p
                className={cn('text-sm text-canvas-muted dark:text-canvas-muted-dark', className)}
                data-revision-diff-empty="true"
            >
                {emptyLabel}
            </p>
        );
    }

    return (
        <div
            className={cn(
                'whitespace-pre-wrap break-words text-sm leading-relaxed text-canvas-fg dark:text-canvas-fg-dark',
                className
            )}
            data-revision-diff="true"
        >
            {parts.map((part, index) => (
                <span
                    key={`${part.type}-${index}`}
                    data-diff-type={part.type}
                    className={cn(partClass(part.type), part.type !== 'equal' && 'rounded-sm px-0.5')}
                >
                    {part.value}
                </span>
            ))}
        </div>
    );
}
