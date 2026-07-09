export function MediaEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-48" aria-hidden="true" data-media-empty-visual="true">
            <div className="absolute top-6 left-2 h-24 w-28 -rotate-12 rounded-xl border border-zinc-950/10 bg-white shadow-lg shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/40">
                <div className="m-2 h-[4.5rem] rounded-lg bg-gradient-to-br from-sky-200 via-indigo-200 to-violet-300 dark:from-sky-900/60 dark:via-indigo-900/50 dark:to-violet-900/60" />
            </div>
            <div className="absolute top-4 right-2 h-24 w-28 rotate-12 rounded-xl border border-zinc-950/10 bg-white shadow-lg shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/40">
                <div className="m-2 h-[4.5rem] rounded-lg bg-gradient-to-br from-amber-100 via-rose-200 to-orange-200 dark:from-amber-900/50 dark:via-rose-900/40 dark:to-orange-900/50" />
            </div>
            <div className="absolute top-2 left-1/2 h-28 w-32 -translate-x-1/2 rounded-xl border border-zinc-950/10 bg-white shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-900 dark:shadow-black/50">
                <div className="relative m-2.5 h-[5.25rem] overflow-hidden rounded-lg bg-gradient-to-br from-zinc-100 via-blue-100 to-emerald-100 dark:from-zinc-800 dark:via-blue-950/50 dark:to-emerald-950/40">
                    <div className="absolute inset-x-3 top-4 h-8 rounded-full bg-white/50 blur-md dark:bg-white/10" />
                    <div className="absolute right-3 bottom-3 size-6 rounded-full bg-white/70 ring-2 ring-white/40 dark:bg-zinc-200/30 dark:ring-white/10" />
                    <div className="absolute bottom-3 left-3 h-2 w-10 rounded-full bg-zinc-950/10 dark:bg-white/15" />
                </div>
            </div>
        </div>
    );
}
