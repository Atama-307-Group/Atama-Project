import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUniversity } from "../api.js";
import "./UniversityPage.css";

const UniversityPage = ({ userId }) => {
    const navigate = useNavigate();
    const [university, setUniversity] = useState(null);

    useEffect(() => {
        if (!userId) return;
        getUniversity(userId)
            .then(setUniversity)
            .catch(console.error);
    }, [userId]);

    return (
        <div className="universityPage">
            <div className="universityHeader">
                <button className="backBtn" onClick={() => navigate('/')}>← Back</button>
                <h1 className="universityTitle">{university ? university.name : "Loading..."}</h1>
            </div>
        </div>
    );
};

export default UniversityPage;