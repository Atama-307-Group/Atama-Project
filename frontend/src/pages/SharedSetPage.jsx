import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveSharedLink } from '../api.js';

const SharedSetPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        resolveSharedLink(token)
            .then((setData) => navigate(`/sets/${setData.id}`, { replace: true }))
            .catch((e) => setError(e.message));
    }, [token]);

    if (error) return <div className="set-page-error">{error}</div>;
    return <div className="set-page-loading">Loading...</div>;
};

export default SharedSetPage;