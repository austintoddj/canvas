import { Navigate, useParams } from 'react-router-dom';

export default function MediaShow() {
    const { id } = useParams();

    if (id === undefined || id === '') {
        return <Navigate to="/media" replace />;
    }

    return <Navigate to={`/media?detail=${encodeURIComponent(id)}`} replace />;
}
