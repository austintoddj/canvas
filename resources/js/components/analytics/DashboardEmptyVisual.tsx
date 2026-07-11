export function DashboardEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-52" aria-hidden="true" data-dashboard-empty-visual="true">
            <div className="absolute top-8 left-1 h-[5.5rem] w-28 -rotate-[8deg] rounded-xl border border-zinc-950/10 bg-white shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="space-y-1.5 p-3 pt-4">
                    <div className="h-1.5 w-3/4 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                    <div className="h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                    <div className="mt-3 flex items-end gap-1">
                        <span className="h-4 w-2.5 rounded-sm bg-sky-200 dark:bg-sky-400/40" />
                        <span className="h-6 w-2.5 rounded-sm bg-indigo-200 dark:bg-indigo-400/40" />
                        <span className="h-3 w-2.5 rounded-sm bg-violet-200 dark:bg-violet-400/35" />
                    </div>
                </div>
            </div>

            <div className="absolute top-6 right-1 h-[5.5rem] w-28 rotate-[10deg] rounded-xl border border-zinc-950/10 bg-white shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="h-2.5 rounded-t-[0.65rem] bg-gradient-to-r from-emerald-300 to-teal-400 dark:from-emerald-400/50 dark:to-teal-400/45" />
                <div className="space-y-1.5 p-2.5">
                    <div className="h-1.5 w-2/3 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                    <div className="h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                </div>
            </div>

            <div className="absolute top-2 left-1/2 h-28 w-32 -translate-x-1/2 rounded-xl border border-zinc-950/10 bg-white shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                <div className="relative h-3 overflow-hidden rounded-t-[0.7rem] bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 dark:from-sky-400/70 dark:via-indigo-400/65 dark:to-violet-400/70">
                    <div className="absolute inset-x-4 top-0.5 h-2 rounded-full bg-white/35 blur-[2px]" />
                </div>
                <div className="flex items-end justify-center gap-1.5 px-4 pt-4 pb-3">
                    <span className="h-6 w-3 rounded-sm bg-gradient-to-t from-sky-200 to-sky-100 dark:from-sky-400/40 dark:to-sky-400/15" />
                    <span className="h-10 w-3 rounded-sm bg-gradient-to-t from-indigo-300 to-indigo-100 dark:from-indigo-400/50 dark:to-indigo-400/20" />
                    <span className="h-8 w-3 rounded-sm bg-gradient-to-t from-violet-300 to-violet-100 dark:from-violet-400/45 dark:to-violet-400/15" />
                    <span className="h-12 w-3 rounded-sm bg-gradient-to-t from-blue-300 to-blue-100 dark:from-blue-400/50 dark:to-blue-400/20" />
                </div>
            </div>
        </div>
    );
}
