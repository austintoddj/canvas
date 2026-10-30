import { IconSearch } from '@tabler/icons-react';

import { cn } from '@/lib/utils';

type SearchFieldProps = {
    id: string;
    name?: string;
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    className?: string;
};

/** Quiet list search. `h-9` and 16px below `sm`, `h-8` and 14px from `sm`. */
export function SearchField({ id, name, label, value, placeholder, onChange, className }: SearchFieldProps) {
    return (
        <div className={cn('min-w-0', className)}>
            <label className="sr-only" htmlFor={id}>
                {label}
            </label>
            <div className="flex h-9 w-full min-w-0 items-center gap-1.5 rounded-full bg-zinc-950/[0.04] px-3 ring-1 ring-zinc-950/8 focus-within:ring-2 focus-within:ring-blue-500 sm:h-8 sm:px-2.5 dark:bg-white/5 dark:ring-white/10 dark:focus-within:ring-blue-500">
                <IconSearch className="size-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                <input
                    id={id}
                    name={name ?? id}
                    type="search"
                    value={value}
                    placeholder={placeholder ?? label}
                    className="min-w-0 flex-1 appearance-none bg-transparent p-0 text-base/6 text-zinc-950 outline-none placeholder:text-zinc-400 sm:text-sm/6 dark:text-white dark:placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                    onChange={(event) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}
