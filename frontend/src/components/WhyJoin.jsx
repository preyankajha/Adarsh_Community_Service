import React from 'react';

const WhyJoin = () => {
    const cards = [
        { icon: '📊', title: 'Absolute Transparency', desc: 'Eliminate internal conflicts with immutable digital ledgers and real-time oversight.' },
        { icon: '🚀', title: 'Seamless Scalability', desc: 'Our multi-tenant architecture grows with your society—from 10 to 10,000+ members.' },
        { icon: '🛡️', title: 'Founder Empowerment', desc: 'Maintain long-term governance with dedicated tools designed specifically for original visionaries.' },
        { icon: '🆔', title: 'Verified Participation', desc: 'Secure, rule-based onboarding and membership ensures only legitimate members access benefits.' }
    ];

    return (
        <section className="section-padding" style={{ background: 'var(--bg-page)', padding: '120px 0' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <div style={{ color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '20px', letterSpacing: '4px', textTransform: 'uppercase' }}>PLATFORM ADVANTAGES</div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 950, color: '#1E293B', letterSpacing: '-1px', marginBottom: '20px' }}>
                        Why Leading Societies Trust Priyanka Digitech Services
                    </h2>
                    <p style={{ fontSize: '1.2rem', color: '#64748B', maxWidth: '800px', margin: '0 auto', fontWeight: 500 }}>
                        We provide the enterprise-grade tools necessary for modern, transparent, and resilient community governance.
                    </p>
                </div>

                <div className="grid-layout">
                    {cards.map((card, idx) => (
                        <div key={idx} className="why-join-card" style={{ 
                            background: 'white', 
                            padding: '40px', 
                            borderRadius: '30px', 
                            border: '1px solid #F1F5F9',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-10px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '25px' }}>{card.icon}</div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E293B', marginBottom: '15px' }}>{card.title}</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6, fontWeight: 500 }}>{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyJoin;
