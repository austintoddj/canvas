export function PostsEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-52" aria-hidden="true" data-posts-empty-visual="true">
            <div className="absolute top-8 left-0 h-24 w-[5.25rem] -rotate-[16deg] rounded-lg border border-zinc-950/10 bg-white px-2 pt-2.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <span className="block h-1.5 w-3/4 rounded-full bg-zinc-950/12 dark:bg-white/20" />
                <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1">
                        <span className="size-1 shrink-0 rounded-full bg-zinc-950/20 dark:bg-white/25" />
                        <span className="h-1 w-full rounded-full bg-zinc-950/8 dark:bg-white/12" />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="size-1 shrink-0 rounded-full bg-zinc-950/20 dark:bg-white/25" />
                        <span className="h-1 w-4/5 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="size-1 shrink-0 rounded-full bg-zinc-950/20 dark:bg-white/25" />
                        <span className="h-1 w-3/5 rounded-full bg-zinc-950/6 dark:bg-white/10" />
                    </div>
                </div>
                <div className="mt-2 h-6 overflow-hidden rounded bg-gradient-to-br from-zinc-100 to-zinc-200/80 dark:from-white/10 dark:to-white/5">
                    <div className="m-1 h-1 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/15" />
                    <div className="mx-1 h-1 w-1/3 rounded-full bg-zinc-950/6 dark:bg-white/10" />
                </div>
            </div>

            <div className="absolute top-7 right-0 h-24 w-[5.25rem] rotate-[14deg] rounded-lg border border-zinc-950/10 bg-white px-2 pt-2.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <span className="block h-1.5 w-2/3 rounded-full bg-zinc-950/12 dark:bg-white/20" />
                <span className="mt-1.5 block h-1 w-full rounded-full bg-zinc-950/8 dark:bg-white/12" />
                <span className="mt-1 block h-1 w-4/5 rounded-full bg-zinc-950/6 dark:bg-white/10" />
                <div className="mt-2 overflow-hidden rounded-md bg-zinc-900 px-1.5 py-1.5 dark:bg-black/50">
                    <div className="flex gap-0.5">
                        <span className="h-1 w-2 rounded-full bg-rose-400/80" />
                        <span className="h-1 w-3 rounded-full bg-amber-400/70" />
                        <span className="h-1 w-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <span className="mt-1 block h-1 w-4/5 rounded-full bg-sky-400/50" />
                    <span className="mt-0.5 block h-1 w-1/2 rounded-full bg-violet-400/40" />
                </div>
            </div>

            <div className="absolute top-2 left-1/2 h-[7.5rem] w-[7.25rem] -translate-x-1/2 rounded-xl border border-zinc-950/10 bg-white px-2.5 pt-2.5 shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                <span className="block h-2 w-4/5 rounded-full bg-gradient-to-r from-sky-200 via-indigo-200 to-violet-200 dark:from-sky-400/40 dark:via-indigo-400/30 dark:to-violet-400/35" />
                <span className="mt-1.5 block h-1 w-full rounded-full bg-zinc-950/10 dark:bg-white/16" />
                <span className="mt-1 block h-1 w-5/6 rounded-full bg-zinc-950/8 dark:bg-white/12" />

                <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="size-1.5 shrink-0 rounded-full bg-indigo-400 dark:bg-indigo-400/70" />
                        <span className="h-1 flex-1 rounded-full bg-zinc-950/10 dark:bg-white/16" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="size-1.5 shrink-0 rounded-full bg-indigo-400 dark:bg-indigo-400/70" />
                        <span className="h-1 w-3/4 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                    </div>
                </div>

                <div className="mt-2 flex gap-1.5">
                    <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/25 dark:via-indigo-500/20 dark:to-violet-500/25">
                        <div className="absolute inset-x-1 top-1 h-2 rounded-full bg-white/55 blur-[2px] dark:bg-white/15" />
                        <div className="absolute right-1 bottom-1 size-2 rounded-sm bg-white/70 ring-1 ring-white/40 dark:bg-white/30 dark:ring-white/20" />
                    </div>
                    <div className="w-[2.6rem] overflow-hidden rounded-md bg-zinc-900 px-1 py-1 dark:bg-black/55">
                        <div className="flex gap-0.5">
                            <span className="h-0.5 w-1.5 rounded-full bg-rose-400/90" />
                            <span className="h-0.5 w-2 rounded-full bg-amber-400/80" />
                        </div>
                        <span className="mt-0.5 block h-0.5 w-full rounded-full bg-sky-400/55" />
                        <span className="mt-0.5 block h-0.5 w-2/3 rounded-full bg-emerald-400/50" />
                        <span className="mt-0.5 block h-0.5 w-4/5 rounded-full bg-violet-400/45" />
                    </div>
                </div>
            </div>
        </div>
    );
}
