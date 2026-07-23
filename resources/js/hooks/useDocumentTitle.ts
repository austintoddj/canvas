import { useEffect } from 'react';

import { formatDocumentTitle } from '@/lib/document-title';

export function useDocumentTitle(page?: string | null): void {
    useEffect(() => {
        document.title = formatDocumentTitle(page);
    }, [page]);
}
