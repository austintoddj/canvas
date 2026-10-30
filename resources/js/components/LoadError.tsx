import { Button } from '@/components/button';
import { ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { cn } from '@/lib/utils';

type LoadErrorProps = {
    message: string;
    onRetry: () => void;
    className?: string;
};

/** One error sentence and a plain retry. Full width below `sm`, inline from `sm`. */
export function LoadError({ message, onRetry, className }: LoadErrorProps) {
    const { t } = useCanvas();

    return (
        <div className={cn('flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
            <ErrorText className="min-w-0 sm:flex-1">{message}</ErrorText>
            <Button type="button" plain className="min-h-11 w-full sm:min-h-0 sm:w-auto" onClick={onRetry}>
                {t('common.try_again')}
            </Button>
        </div>
    );
}
