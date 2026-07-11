export function UsersEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-48" aria-hidden="true" data-users-empty-visual="true">
            <div className="absolute top-8 left-4 size-16 -rotate-6 rounded-2xl border border-zinc-950/10 bg-white p-1.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-200 dark:from-sky-400/30 dark:to-cyan-400/35">
                    <span className="size-6 rounded-full bg-gradient-to-br from-sky-300 to-cyan-500 ring-2 ring-white/60 dark:from-sky-400/70 dark:to-cyan-400/70 dark:ring-white/20" />
                    <span className="h-1 w-8 rounded-full bg-zinc-950/10 dark:bg-white/25" />
                </div>
            </div>

            <div className="absolute top-8 right-4 size-16 rotate-6 rounded-2xl border border-zinc-950/10 bg-white p-1.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-200 dark:from-violet-400/30 dark:to-fuchsia-400/35">
                    <span className="size-6 rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-500 ring-2 ring-white/60 dark:from-violet-400/70 dark:to-fuchsia-400/70 dark:ring-white/20" />
                    <span className="h-1 w-8 rounded-full bg-zinc-950/10 dark:bg-white/25" />
                </div>
            </div>

            <div className="absolute top-2 left-1/2 size-[4.75rem] -translate-x-1/2 rounded-2xl border border-zinc-950/10 bg-white p-1.5 shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                <div className="relative flex h-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 via-rose-100 to-orange-100 dark:from-amber-400/25 dark:via-rose-400/25 dark:to-orange-400/30">
                    <div className="absolute inset-x-2 top-2 h-6 rounded-full bg-white/40 blur-md dark:bg-white/15" />
                    <span className="relative size-7 rounded-full bg-gradient-to-br from-amber-300 via-rose-400 to-orange-500 ring-2 ring-white/70 dark:from-amber-400/80 dark:via-rose-400/75 dark:to-orange-400/80 dark:ring-white/25" />
                    <span className="relative h-1.5 w-10 rounded-full bg-zinc-950/12 dark:bg-white/30" />
                </div>
            </div>

            <div className="absolute right-[3.25rem] bottom-5 flex size-7 items-center justify-center rounded-full border border-zinc-950/10 bg-white text-sm font-semibold text-zinc-500 shadow-md shadow-zinc-950/10 dark:border-white/15 dark:bg-zinc-700 dark:text-zinc-200 dark:shadow-none dark:ring-1 dark:ring-white/15">
                +
            </div>
        </div>
    );
}
