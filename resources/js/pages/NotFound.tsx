import { Button } from '@/components/button';
import { PageHeader } from '@/components/PageHeader';
import { PageDescription, Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFound() {
    const { t } = useCanvas();

    useDocumentTitle(t('errors.not_found_title', 'Page not found'));

    return (
        <div className="space-y-8">
            <PageHeader title={t('errors.not_found_title', 'Page not found')}>
                <PageDescription>
                    {t('errors.not_found_description', 'That page does not exist or is no longer available.')}
                </PageDescription>
            </PageHeader>
            <Text>{t('errors.not_found_hint', 'Check the URL or go back to the dashboard.')}</Text>
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
