import { Text } from '@/components/text';

export default function BodyEditorPlaceholder() {
    return (
        <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-950/10 bg-zinc-950/2.5 px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.03] dark:ring-1 dark:ring-inset dark:ring-white/5">
            <Text className="text-base font-medium text-zinc-700 dark:text-zinc-200">Rich text editor coming soon</Text>
            <Text className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                Post metadata, SEO, and publishing work today.
            </Text>
        </div>
    );
}
