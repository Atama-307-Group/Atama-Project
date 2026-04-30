import { useNavigate } from 'react-router-dom';
import './BackButton.css';

const BackButton = ({ onClick }) => {
    const navigate = useNavigate();
    return (
        <button className="back-btn" onClick={onClick || (() => navigate(-1))} title="Go back">
            ⟵
        </button>
    );
};

export default BackButton;
