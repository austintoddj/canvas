export function DashboardEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-52" aria-hidden="true" data-dashboard-empty-visual="true">
            <div className="absolute top-10 left-0 h-[4.5rem] w-[5.25rem] -rotate-[12deg] rounded-xl border border-zinc-950/10 bg-white px-2.5 py-2 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 dark:from-sky-400/80 dark:to-cyan-400/70" />
                    <span className="h-1.5 flex-1 rounded-full bg-zinc-950/10 dark:bg-white/18" />
                </div>
                <div className="mt-2.5 flex items-end gap-1">
                    <span className="h-2.5 w-2 rounded-sm bg-sky-200 dark:bg-sky-400/35" />
                    <span className="h-4 w-2 rounded-sm bg-sky-300 dark:bg-sky-400/45" />
                    <span className="h-3 w-2 rounded-sm bg-cyan-200 dark:bg-cyan-400/35" />
                    <span className="h-5 w-2 rounded-sm bg-gradient-to-t from-sky-400 to-cyan-300 dark:from-sky-400/60 dark:to-cyan-400/40" />
                </div>
                <span className="mt-2 block h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/12" />
            </div>

            <div className="absolute top-8 right-0 h-[4.5rem] w-[5.25rem] rotate-[10deg] rounded-xl border border-zinc-950/10 bg-white px-2.5 py-2 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-400/80 dark:to-teal-400/70" />
                    <span className="h-1.5 flex-1 rounded-full bg-zinc-950/10 dark:bg-white/18" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="h-3.5 w-9 rounded-md bg-gradient-to-r from-emerald-200 to-teal-100 dark:from-emerald-400/40 dark:to-teal-400/25" />
                    <span className="h-1.5 w-3.5 rounded-full bg-emerald-300/80 dark:bg-emerald-400/40" />
                </div>
                <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-950/5 dark:bg-white/8">
                    <span className="absolute inset-y-0 left-0 w-3/5 rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 dark:from-emerald-400/55 dark:to-teal-400/45" />
                </div>
            </div>

            <div className="absolute top-2 left-1/2 h-[7.5rem] w-[7.5rem] -translate-x-1/2 rounded-xl border border-zinc-950/10 bg-white shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                <div className="flex items-center justify-between border-b border-zinc-950/5 px-2.5 py-2 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 dark:from-indigo-400/80 dark:to-violet-400/70" />
                        <span className="h-1.5 w-11 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                    </div>
                    <span className="h-1.5 w-5 rounded-full bg-zinc-950/6 dark:bg-white/12" />
                </div>
                <div className="relative flex h-[5rem] items-end justify-center gap-1.5 px-3 pb-3 pt-2">
                    <div className="absolute inset-x-3 top-2 bottom-3 rounded-md bg-gradient-to-t from-sky-50/90 via-indigo-50/30 to-transparent dark:from-sky-500/10 dark:via-indigo-500/5" />
                    <span className="relative h-5 w-2.5 rounded-t-sm bg-gradient-to-t from-sky-300 to-sky-100 dark:from-sky-400/45 dark:to-sky-400/15" />
                    <span className="relative h-8 w-2.5 rounded-t-sm bg-gradient-to-t from-sky-400 to-sky-200 dark:from-sky-400/55 dark:to-sky-400/20" />
                    <span className="relative h-6 w-2.5 rounded-t-sm bg-gradient-to-t from-indigo-300 to-indigo-100 dark:from-indigo-400/50 dark:to-indigo-400/15" />
                    <span className="relative h-11 w-2.5 rounded-t-sm bg-gradient-to-t from-indigo-400 to-indigo-200 dark:from-indigo-400/60 dark:to-indigo-400/25" />
                    <span className="relative h-9 w-2.5 rounded-t-sm bg-gradient-to-t from-violet-400 to-violet-200 dark:from-violet-400/55 dark:to-violet-400/20" />
                    <span className="relative h-14 w-2.5 rounded-t-sm bg-gradient-to-t from-violet-500 to-fuchsia-300 shadow-sm shadow-violet-500/20 dark:from-violet-400/70 dark:to-fuchsia-400/35 dark:shadow-none" />
                </div>
            </div>
        </div>
    );
}
