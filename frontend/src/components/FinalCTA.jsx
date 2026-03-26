import React from 'react';
import { useNavigate } from 'react-router-dom';

const FinalCTA = () => {
    const navigate = useNavigate();

    return (
        <section className="final-cta-section">
            <div className="container">
                <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#D87C1D' }}>Be a Part of a Caring Community</h2>
                <p style={{ fontSize: '1.3rem', marginBottom: '40px', color: '#555' }}>
                    Register your family today and stay protected through unity and support.
                </p>
                <button onClick={() => navigate('/signup')} className="btn-pulse">
                    Join Sanatani Swayamsevi Samiti ➔
                </button>
            </div>
        </section>
    );
};

export default FinalCTA;
