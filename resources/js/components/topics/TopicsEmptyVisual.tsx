export function TopicsEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-52" aria-hidden="true" data-topics-empty-visual="true">
            <div className="absolute top-9 left-0 w-24 -rotate-[14deg]">
                <div className="relative pt-2.5">
                    <div className="absolute top-0 left-2 z-10 h-2.5 w-8 rounded-t-[0.35rem] bg-gradient-to-r from-emerald-300 to-teal-400 dark:from-emerald-400/75 dark:to-teal-400/65" />
                    <div className="rounded-lg border border-zinc-950/10 bg-white p-2 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                        <span className="block h-1.5 w-3/4 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                        <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                        <span className="mt-2 block h-5 rounded-md bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-400/15 dark:to-teal-400/20" />
                    </div>
                </div>
            </div>

            <div className="absolute top-7 right-0 w-24 rotate-[12deg]">
                <div className="relative pt-2.5">
                    <div className="absolute top-0 left-2 z-10 h-2.5 w-8 rounded-t-[0.35rem] bg-gradient-to-r from-amber-300 to-orange-400 dark:from-amber-400/75 dark:to-orange-400/65" />
                    <div className="rounded-lg border border-zinc-950/10 bg-white p-2 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                        <span className="block h-1.5 w-2/3 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                        <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                        <span className="mt-2 block h-5 rounded-md bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-400/15 dark:to-orange-400/20" />
                    </div>
                </div>
            </div>

            <div className="absolute top-2 left-1/2 w-[7.25rem] -translate-x-1/2">
                <div className="relative pt-3">
                    <div className="absolute top-0 left-2.5 z-10 h-3 w-11 overflow-hidden rounded-t-md bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 dark:from-sky-400/80 dark:via-indigo-400/75 dark:to-violet-400/80">
                        <div className="absolute inset-x-1.5 top-0.5 h-1.5 rounded-full bg-white/40 blur-[1px]" />
                    </div>
                    <div className="rounded-xl border border-zinc-950/10 bg-white p-2.5 shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                        <span className="block h-2 w-4/5 rounded-full bg-gradient-to-r from-sky-200 via-indigo-200 to-violet-200 dark:from-sky-400/40 dark:via-indigo-400/30 dark:to-violet-400/35" />
                        <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-zinc-950/8 dark:bg-white/15" />
                        <div className="mt-2.5 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 shrink-0 rounded-full bg-sky-400/70 dark:bg-sky-400/50" />
                                <span className="h-1.5 flex-1 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 shrink-0 rounded-full bg-indigo-400/70 dark:bg-indigo-400/50" />
                                <span className="h-1.5 w-3/4 rounded-full bg-zinc-950/8 dark:bg-white/12" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-1.5 shrink-0 rounded-full bg-violet-400/70 dark:bg-violet-400/50" />
                                <span className="h-1.5 w-2/3 rounded-full bg-zinc-950/6 dark:bg-white/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
