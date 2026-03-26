import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import LoginCard from './LoginCard';
import { getAuthUser } from '../utils/roleHelper';

const Hero = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [counts, setCounts] = useState({ families: 0, funds: 0 });
    const [liveStats, setLiveStats] = useState({ families_helped: 0, total_assistance_given: 0 });

    useEffect(() => {
        let timer;
        fetch('/api/finance/stats')
            .then(res => res.json())
            .then(data => {
                setLiveStats(data);
                // Simple animation
                let fam = 0;
                let fund = 0;
                const targetFam = data.families_helped || 0;
                const targetFund = data.total_assistance_given || 0;

                timer = setInterval(() => {
                    fam += Math.ceil(targetFam / 20);
                    fund += Math.ceil(targetFund / 20);

                    if (fam >= targetFam && fund >= targetFund) {
                        setCounts({ families: targetFam, funds: targetFund });
                        clearInterval(timer);
                    } else {
                        setCounts({
                            families: fam > targetFam ? targetFam : fam,
                            funds: fund > targetFund ? targetFund : fund
                        });
                    }
                }, 50);
            })
            .catch(err => console.error(err));

        return () => {
            if (timer) clearInterval(timer);
        };
    }, []);


    return (
        <section id="home" className="hero-section" style={{ padding: '100px 0', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
            <div className="hero-overlay" style={{ opacity: 0.05 }}></div>
            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'center' }}>
                    
                    {/* LEFT SIDE: Platform Value Prop */}
                    <div className="hero-content-left" style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                background: 'rgba(52, 152, 219, 0.1)', 
                                padding: '8px 16px', 
                                borderRadius: '100px', 
                                color: 'var(--primary-blue)', 
                                fontWeight: 800, 
                                fontSize: '0.85rem',
                                border: '1px solid rgba(52, 152, 219, 0.2)'
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>⚡</span> THE COMPLETE SOCIETY GOVERNANCE SUITE
                            </div>
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                background: '#F8FAFC', 
                                padding: '8px 16px', 
                                borderRadius: '100px', 
                                color: '#64748B', 
                                fontWeight: 700, 
                                fontSize: '0.85rem',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <span>Designed by</span> <span style={{ color: '#1E293B', fontWeight: 800 }}>Priyanka Digitech Services</span>
                            </div>
                        </div>
                        
                        <h1 style={{ 
                            fontSize: '4.5rem', 
                            fontWeight: 950, 
                            color: '#1E293B', 
                            lineHeight: 1, 
                            marginBottom: '24px', 
                            letterSpacing: '-2px' 
                        }}>
                            The Ultimate <br />
                            <span style={{ color: 'var(--accent-blue)' }}>Governance Suite.</span>
                        </h1>
                        
                        <p style={{ 
                            fontSize: '1.25rem', 
                            color: '#64748B', 
                            lineHeight: 1.6, 
                            marginBottom: '40px', 
                            fontWeight: 500,
                            maxWidth: '600px'
                        }}>
                            Adarsh Society Service provides a transparent, secure, and highly efficient platform to manage community funds, member assistance, and digital governance for modern residential and cultural samitis.
                        </p>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button 
                                onClick={() => navigate('/register-society')}
                                className="premium-btn shadow-premium" 
                                style={{ padding: '20px 40px', fontSize: '1.1rem' }}
                            >
                                Launch Your Society Portal
                            </button>
                            <button 
                                onClick={() => navigate('/login')}
                                style={{ 
                                    padding: '20px 40px', 
                                    fontSize: '1.1rem', 
                                    background: 'white', 
                                    border: '1px solid #E2E8F0', 
                                    borderRadius: '16px', 
                                    color: '#1E293B', 
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                                onMouseOut={e => e.currentTarget.style.background = 'white'}
                            >
                                Member Login 
                            </button>
                        </div>

                        <div style={{ marginTop: '50px', display: 'flex', gap: '40px', borderTop: '1px solid #F1F5F9', paddingTop: '30px' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.8rem', color: '#1E293B', fontWeight: 900 }}>100%</h4>
                                <p style={{ margin: 0, color: '#94A3B8', fontWeight: 700, fontSize: '0.85rem' }}>TRANSPARENT</p>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.8rem', color: '#1E293B', fontWeight: 900 }}>Real-Time</h4>
                                <p style={{ margin: 0, color: '#94A3B8', fontWeight: 700, fontSize: '0.85rem' }}>MONITORING</p>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.8rem', color: '#1E293B', fontWeight: 900 }}>Founder</h4>
                                <p style={{ margin: 0, color: '#94A3B8', fontWeight: 700, fontSize: '0.85rem' }}>DEDICATED PANEL</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Product Illustration / Dashboard Demo */}
                    <div className="hero-auth-right" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                        <div className="animate-float" style={{ 
                            background: 'white', 
                            padding: '10px', 
                            borderRadius: '30px', 
                            boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
                            border: '1px solid #F1F5F9',
                            width: '100%',
                            position: 'relative'
                        }}>
                             <div style={{ 
                                background: '#F8FAFC', 
                                height: '400px', 
                                borderRadius: '22px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '1rem', 
                                color: '#94A3B8', 
                                fontWeight: 600,
                                textAlign: 'center',
                                padding: '40px',
                                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)'
                             }}>
                                <div>
                                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📊</div>
                                    <h3 style={{ color: '#1E293B', fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px' }}>Interactive Governance</h3>
                                    <p>One unified dashboard to track <br/> Assistances, Nominees, and Elections.</p>
                                </div>
                             </div>
                             
                             {/* Floating Elements */}
                             <div style={{ position: 'absolute', top: '-30px', right: '-20px', background: 'white', padding: '15px 25px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
                                <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.9rem' }}>Live Audit Trail Active</span>
                             </div>

                             <div style={{ position: 'absolute', bottom: '40px', left: '-40px', background: '#2C3E50', padding: '15px 25px', borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', color: 'white' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, marginBottom: '4px' }}>FOUNDER STATUS</div>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '1px' }}>🛡️ VERIFIED</div>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Hero;
