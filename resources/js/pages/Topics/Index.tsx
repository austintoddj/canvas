import { Navigate, useSearchParams } from 'react-router-dom';

import { legacyTaxonomyRedirectPath } from '@/lib/taxonomy/list';

export default function TopicsIndexRedirect() {
    const [searchParams] = useSearchParams();

    return <Navigate to={legacyTaxonomyRedirectPath('topics', searchParams)} replace />;
}
