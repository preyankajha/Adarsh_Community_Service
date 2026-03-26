import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';
import WhyJoin from '../components/WhyJoin';
import RulesTransparency from '../components/RulesTransparency';
import FinalCTA from '../components/FinalCTA';
import Contact from '../components/Contact';
import PlatformServices from '../components/PlatformServices';
import SocietyNetwork from '../components/SocietyNetwork';


import { useNavigate } from 'react-router-dom';
import { getAuthUser } from '../utils/roleHelper';

function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        const user = getAuthUser();
        // Redirect incomplete family heads to their form immediately
        if (user && user.role === 'family_head' && user.status === 'Profile Incomplete') {
            navigate('/family');
            return;
        }
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '60px', background: 'white' }}>
            <Header />
            <main style={{ flex: 1 }}>
                {/* Product Hero Section */}
                <Hero />

                {/* Platform Services Section */}
                <PlatformServices />

                {/* Platform Features Section */}
                <WhyJoin />

                {/* Platform Governance & Security Highlight */}
                <section style={{ padding: '100px 0', background: '#F8FAFC' }}>
                    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                            <div>
                                <div style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '20px' }}>🔐 ENTERPRISE-GRADE SECURITY</div>
                                <h2 style={{ fontSize: '3rem', fontWeight: 950, color: '#1E293B', lineHeight: 1.1, marginBottom: '24px' }}>
                                    A Private Workspace for Every Community.
                                </h2>
                                <p style={{ fontSize: '1.2rem', color: '#64748B', lineHeight: 1.6, marginBottom: '30px' }}>
                                    Your data is isolated and protected. Each society receives a dedicated instance with custom rules, unique society codes, and restricted access for verified members only.
                                </p>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
                                    {['Multi-Tenant Data Isolation', 'Real-time Audit Trail', 'Role-based Access Control (RBAC)', 'Secure Founder Identification'].map((item, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: '#475569' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>✓</div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div style={{ background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '30px' }}>🛡️</div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E293B', marginBottom: '16px' }}>Transparent by Design</h3>
                                <p style={{ color: '#64748B', fontWeight: 500, lineHeight: 1.6 }}>
                                    Our platform is built to eliminate mistrust within residential societies. Every financial entry and assistance request is visible to the committee and tracked with immutable logs.
                                </p>
                                <div style={{ marginTop: '20px', padding: '15px', background: '#F0F9FF', borderRadius: '12px', color: '#0369A1', fontWeight: 700, fontSize: '0.9rem' }}>
                                    "No more paper ledgers or hidden expenses."
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Community Network Section */}
                <SocietyNetwork />
                
                <FinalCTA />
            </main>

            <Footer />
        </div>
    );
}

export default Landing;
