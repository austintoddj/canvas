import { Navigate, useSearchParams } from 'react-router-dom';

import { legacyTaxonomyRedirectPath } from '@/lib/taxonomy/list';

export default function TagsIndexRedirect() {
    const [searchParams] = useSearchParams();

    return <Navigate to={legacyTaxonomyRedirectPath('tags', searchParams)} replace />;
}
