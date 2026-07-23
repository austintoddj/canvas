export function MediaEmptyVisual() {
    return (
        <div className="relative mx-auto h-36 w-52" aria-hidden="true" data-media-empty-visual="true">
            <div className="absolute top-7 left-0 w-[5.25rem] -rotate-[14deg] rounded-lg border border-zinc-950/10 bg-white p-1.5 pb-2.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="relative h-[4.25rem] overflow-hidden rounded-md bg-gradient-to-b from-sky-200 to-sky-50 dark:from-sky-500/45 dark:to-sky-950/40">
                    <span className="absolute top-2 right-2 size-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-sm dark:from-amber-300/85 dark:to-amber-500/70" />
                    <span className="absolute inset-x-0 bottom-0 h-5 rounded-t-[100%] bg-gradient-to-t from-emerald-500/80 to-emerald-300/65 dark:from-emerald-500/50 dark:to-emerald-400/30" />
                    <span className="absolute bottom-0 left-1 h-3.5 w-7 rounded-t-full bg-emerald-600/40 dark:bg-emerald-400/25" />
                </div>
                <span className="mx-auto mt-1.5 block h-1 w-7 rounded-full bg-zinc-950/8 dark:bg-white/15" />
            </div>

            <div className="absolute top-6 right-0 w-[5.25rem] rotate-[12deg] rounded-lg border border-zinc-950/10 bg-white p-1.5 pb-2.5 shadow-lg shadow-zinc-950/10 dark:border-white/12 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
                <div className="relative h-[4.25rem] overflow-hidden rounded-md bg-gradient-to-b from-violet-200 via-fuchsia-100 to-rose-50 dark:from-violet-500/40 dark:via-fuchsia-500/25 dark:to-rose-500/30">
                    <span className="absolute top-2.5 left-2 size-2.5 rounded-full bg-gradient-to-br from-rose-200 to-orange-300 dark:from-rose-300/75 dark:to-orange-400/60" />
                    <span className="absolute inset-x-0 bottom-0 h-6 rounded-t-[90%] bg-gradient-to-t from-violet-400/75 to-fuchsia-300/45 dark:from-violet-500/45 dark:to-fuchsia-400/25" />
                    <span className="absolute bottom-0 left-2 h-4 w-9 rounded-t-[70%] bg-indigo-400/45 dark:bg-indigo-400/30" />
                </div>
                <span className="mx-auto mt-1.5 block h-1 w-7 rounded-full bg-zinc-950/8 dark:bg-white/15" />
            </div>

            <div className="absolute top-1 left-1/2 w-[6.75rem] -translate-x-1/2 rounded-xl border border-zinc-950/10 bg-white p-1.5 pb-3 shadow-xl shadow-zinc-950/15 dark:border-white/15 dark:bg-zinc-800 dark:shadow-none dark:ring-1 dark:ring-white/15">
                <div className="relative h-20 overflow-hidden rounded-lg bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-50 dark:from-sky-500/55 dark:via-sky-800/40 dark:to-emerald-950/35">
                    <div className="absolute inset-x-2.5 top-1.5 h-3.5 rounded-full bg-white/50 blur-md dark:bg-white/12" />
                    <span className="absolute top-2.5 right-2.5 size-4 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 shadow-sm ring-2 ring-white/45 dark:from-amber-300/90 dark:via-amber-400/80 dark:to-orange-400/70 dark:ring-white/20" />
                    <span className="absolute inset-x-0 bottom-0 h-7 rounded-t-[100%] bg-gradient-to-t from-emerald-500/80 to-emerald-300/55 dark:from-emerald-500/50 dark:to-emerald-400/28" />
                    <span className="absolute bottom-0 left-0 h-5 w-11 rounded-tr-[100%] bg-gradient-to-tr from-teal-600/55 to-emerald-400/35 dark:from-teal-500/40 dark:to-emerald-400/22" />
                    <span className="absolute right-1.5 bottom-0.5 h-4 w-12 rounded-t-[75%] bg-gradient-to-t from-lime-500/50 to-emerald-300/30 dark:from-lime-500/30 dark:to-emerald-400/18" />
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-1">
                    <span className="h-1 w-9 rounded-full bg-zinc-950/10 dark:bg-white/20" />
                    <span className="h-1 w-3.5 rounded-full bg-zinc-950/6 dark:bg-white/12" />
                </div>
            </div>
        </div>
    );
}
