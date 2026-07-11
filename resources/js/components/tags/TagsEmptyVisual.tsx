export function TagsEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-52" aria-hidden="true" data-tags-empty-visual="true">
            <div className="absolute top-10 left-1 h-9 w-[5.5rem] -rotate-[18deg] rounded-full border border-zinc-950/10 bg-white px-2.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="flex h-full items-center gap-1.5">
                    <span className="size-2.5 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 dark:from-violet-400/80 dark:to-fuchsia-400/70" />
                    <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-violet-200 to-fuchsia-100 dark:from-violet-400/35 dark:to-fuchsia-400/20" />
                </div>
            </div>

            <div className="absolute top-4 right-0 h-9 w-24 rotate-[14deg] rounded-full border border-zinc-950/10 bg-white px-2.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="flex h-full items-center gap-1.5">
                    <span className="size-2.5 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 dark:from-sky-400/80 dark:to-cyan-400/70" />
                    <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-sky-200 to-cyan-100 dark:from-sky-400/35 dark:to-cyan-400/20" />
                </div>
            </div>

            <div className="absolute bottom-6 left-6 h-9 w-[5.25rem] -rotate-6 rounded-full border border-zinc-950/10 bg-white px-2.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="flex h-full items-center gap-1.5">
                    <span className="size-2.5 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-400/80 dark:to-orange-400/70" />
                    <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-amber-200 to-orange-100 dark:from-amber-400/35 dark:to-orange-400/20" />
                </div>
            </div>

            <div className="absolute top-1/2 left-1/2 h-11 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-950/10 bg-white px-3 shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                <div className="flex h-full items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 via-pink-400 to-violet-500 text-[10px] font-bold text-white shadow-sm dark:from-rose-400/90 dark:via-pink-400/80 dark:to-violet-400/80">
                        #
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                        <span className="block h-2 w-full rounded-full bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 dark:from-rose-400/40 dark:via-pink-400/30 dark:to-violet-400/35" />
                        <span className="block h-1.5 w-2/3 rounded-full bg-zinc-950/8 dark:bg-white/15" />
                    </div>
                </div>
            </div>
        </div>
    );
}
