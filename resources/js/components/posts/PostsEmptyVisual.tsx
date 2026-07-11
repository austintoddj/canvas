export function PostsEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-52" aria-hidden="true" data-posts-empty-visual="true">
            <div className="absolute top-8 left-1 h-[5.5rem] w-28 -rotate-[10deg] rounded-xl border border-zinc-950/10 bg-white shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="h-2.5 rounded-t-[0.65rem] bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-600/80 dark:to-zinc-500/70" />
                <div className="space-y-1.5 p-2.5">
                    <div className="h-1.5 w-3/4 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                    <div className="h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                    <div className="mt-2 h-6 rounded-md bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-white/5 dark:to-white/10" />
                </div>
            </div>

            <div className="absolute top-6 right-1 h-[5.5rem] w-28 rotate-[12deg] rounded-xl border border-zinc-950/10 bg-white shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="h-2.5 rounded-t-[0.65rem] bg-gradient-to-r from-amber-300 to-orange-400 dark:from-amber-400/50 dark:to-orange-400/45" />
                <div className="space-y-1.5 p-2.5">
                    <div className="h-1.5 w-2/3 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                    <div className="h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                    <div className="mt-2 h-6 rounded-md bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-400/15 dark:to-orange-400/20" />
                </div>
            </div>

            <div className="absolute top-2 left-1/2 h-28 w-32 -translate-x-1/2 rounded-xl border border-zinc-950/10 bg-white shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                <div className="relative h-3 overflow-hidden rounded-t-[0.7rem] bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 dark:from-sky-400/70 dark:via-indigo-400/65 dark:to-violet-400/70">
                    <div className="absolute inset-x-4 top-0.5 h-2 rounded-full bg-white/35 blur-[2px]" />
                </div>
                <div className="space-y-2 p-3">
                    <div className="h-2 w-4/5 rounded-full bg-zinc-950/12 dark:bg-white/25" />
                    <div className="h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/15" />
                    <div className="relative mt-1 h-10 overflow-hidden rounded-lg bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/15 dark:via-indigo-500/15 dark:to-violet-500/20">
                        <div className="absolute inset-x-3 top-2 h-2 rounded-full bg-zinc-950/8 dark:bg-white/15" />
                        <div className="absolute inset-x-3 top-5 h-1.5 w-2/3 rounded-full bg-zinc-950/6 dark:bg-white/10" />
                        <div className="absolute right-2 bottom-2 size-4 rounded-md bg-white/70 ring-1 ring-white/50 dark:bg-white/30 dark:ring-white/20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
