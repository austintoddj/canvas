import { IconCopy } from '@tabler/icons-react';

import { Input } from '@/components/input';
import { useCanvas } from '@/hooks/useCanvas';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type CopyableInputProps = {
    value: string;
    onChange?: (value: string) => void;
    name: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    type?: 'text' | 'password';
    className?: string;
    'data-unsplash-access-key'?: string;
    'data-ai-api-key'?: string;
    'data-masked-secret'?: string;
};

export function CopyableInput({
    value,
    onChange,
    name,
    placeholder,
    disabled = false,
    readOnly = false,
    invalid = false,
    type = 'text',
    className,
    ...dataAttrs
}: CopyableInputProps) {
    const { t } = useCanvas();
    const canCopy = value.trim() !== '' && !disabled;

    async function copy() {
        if (!canCopy) {
            return;
        }

        if (typeof navigator.clipboard?.writeText !== 'function') {
            toast.error(t('integrations.copy_error', 'Unable to copy.'));
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            toast.success(t('integrations.copied', 'Copied.'));
        } catch {
            toast.error(t('integrations.copy_error', 'Unable to copy.'));
        }
    }

    return (
        <div data-slot="control" className={cn('relative', className)}>
            <Input
                type={type}
                name={name}
                autoComplete="off"
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                invalid={invalid}
                onChange={(event) => onChange?.(event.target.value)}
                className="[&_input]:pr-10 [&_input]:font-mono"
                {...dataAttrs}
            />
            <button
                type="button"
                className="absolute top-1/2 right-1.5 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
                disabled={!canCopy}
                aria-label={t('integrations.copy', 'Copy')}
                data-copy-value="true"
                onClick={() => void copy()}
            >
                <IconCopy className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}
