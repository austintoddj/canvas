import { Navigate, useParams, useSearchParams } from 'react-router-dom';

import { legacyTaxonomyRedirectPath } from '@/lib/taxonomy/list';

export default function TopicsEditor() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();

    if (id === undefined || id === '') {
        return <Navigate to={legacyTaxonomyRedirectPath('topics', searchParams)} replace />;
    }

    return <Navigate to={legacyTaxonomyRedirectPath('topics', searchParams, id)} replace />;
}
