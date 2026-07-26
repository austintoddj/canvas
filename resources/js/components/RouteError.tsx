import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { Button } from '@/components/button';
import { PageHeader } from '@/components/PageHeader';
import { PageDescription, Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';

/**
 * Shown when a matched route throws or React Router reports a response error.
 * Replaces the default “Unexpected Application Error!” developer screen.
 */
export function RouteError() {
    const { t } = useCanvas();
    const error = useRouteError();

    const isNotFound = isRouteErrorResponse(error) && error.status === 404;

    const title = isNotFound
        ? t('errors.not_found_title', 'Page not found')
        : t('errors.generic_title', 'Something went wrong');

    const description = isNotFound
        ? t('errors.not_found_description', 'That page does not exist or is no longer available.')
        : t('errors.generic_description', 'An unexpected error occurred. Try again or return home.');

    return (
        <div className="mx-auto max-w-lg space-y-6 px-4 py-16 sm:px-6">
            <PageHeader title={title}>
                <PageDescription>{description}</PageDescription>
            </PageHeader>
            {!isNotFound ? (
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t('errors.generic_hint', 'If this keeps happening, refresh the page.')}
                </Text>
            ) : null}
            <div className="flex flex-wrap gap-3">
                <Button href="/" color="dark/zinc">
                    {t('errors.not_found_home', 'Back to dashboard')}
                </Button>
                <Button href="/posts" outline>
                    {t('nav.posts')}
                </Button>
            </div>
        </div>
    );
}
