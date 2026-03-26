import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SocietyNetwork = () => {
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.getCommunities()
            .then(res => {
                setSocieties(Array.isArray(res.data) ? res.data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Network Fetch Failed", err);
                setLoading(false);
            });
    }, []);

    if (loading) return null;
    if (societies.length === 0) return null;

    return (
        <section id="network" style={{ padding: '100px 0', background: 'white' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>🌐 OUR GLOBAL NETWORK</div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 950, color: '#1E293B', marginBottom: '20px', letterSpacing: '-0.03em' }}>
                        Trusted by Modern Societies.
                    </h2>
                    <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                        Join the growing list of residential and cultural communities digitizing their governance through Priyanka Digitech Services.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                    {societies.map((society) => (
                        <div 
                            key={society.id} 
                            className="premium-card animate-fade"
                            style={{ 
                                padding: '30px', 
                                border: '1px solid #F1F5F9', 
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                background: '#FBFDFF',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onClick={() => navigate(`/login/${society.society_code}`)}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'var(--primary-blue)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = '#F1F5F9';
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px 15px', background: 'var(--primary-blue)', color: 'white', fontSize: '0.75rem', fontWeight: 900, borderBottomLeftRadius: '15px' }}>
                                {society.society_code}
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ width: '50px', height: '50px', background: '#EFF6FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '15px' }}>
                                    🏛️
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>{society.name}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '20px', lineHeight: 1.5, minHeight: '45px' }}>
                                    {society.description || "Active community workspace for transparent governance and member coordination."}
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px', borderTop: '1px solid #F1F5F9', color: '#1E293B', fontWeight: 700, fontSize: '0.85rem' }}>
                                <span style={{ opacity: 0.6 }}>📍</span> {society.city}, {society.state}
                            </div>

                            <div style={{ marginTop: '20px', color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Launch Portal <span>→</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '60px', textAlign: 'center' }}>
                    <button 
                        onClick={() => navigate('/register-society')}
                        className="premium-btn"
                        style={{ padding: '18px 40px' }}
                    >
                        Register Your Society Today
                    </button>
                </div>
            </div>
        </section>
    );
};

export default SocietyNetwork;
