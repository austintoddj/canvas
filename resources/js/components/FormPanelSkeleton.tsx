import { Skeleton } from '@/components/Skeleton';

type FormPanelSkeletonProps = {
    fields?: number;
};

export function FormPanelSkeleton({ fields = 5 }: FormPanelSkeletonProps) {
    return (
        <div className="mt-8 space-y-8" aria-hidden="true" data-form-panel-skeleton="true">
            {Array.from({ length: fields }, (_, index) => (
                <div key={index} className="space-y-3">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ))}
            <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
    );
}
