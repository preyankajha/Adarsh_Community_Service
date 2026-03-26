import React from 'react';

const PlatformServices = () => {
    const services = [
        {
            icon: '🏢',
            title: 'Society Digitization',
            desc: 'Convert your paper-based society records into a secure digital database with professional registration modules.'
        },
        {
            icon: '👥',
            title: 'Directory Management',
            desc: 'Powerful family and member tracking with unique IDs, relationship mapping, and hierarchy management.'
        },
        {
            icon: '📊',
            title: 'Financial Oversight',
            desc: 'Real-time monitoring of society funds, voluntary contributions, and automated audit trails for every rupee.'
        },
        {
            icon: '🆘',
            title: 'Assistance Workflows',
            desc: 'Standardized applications for medical help, student scholarships, and emergency community support.'
        },
        {
            icon: '🗳️',
            title: 'Digital Governance',
            desc: 'Manage committee elections, roles, mandates, and formal community bylaws in a transparent digital environment.'
        },
        {
            icon: '📢',
            title: 'Smart Announcements',
            desc: 'Instantly broadcast urgent notices, meeting minutes, and billboard updates to every member via a unified dashboard.'
        }
    ];

    return (
        <section id="services" style={{ padding: '100px 0', background: 'white' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <div style={{ 
                        color: 'var(--primary-blue)', 
                        fontWeight: 900, 
                        fontSize: '0.9rem', 
                        letterSpacing: '2px', 
                        marginBottom: '15px',
                        textTransform: 'uppercase'
                    }}>
                        Core Platform Capabilities
                    </div>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 950, color: '#1E293B', marginBottom: '20px', letterSpacing: '-1px' }}>
                        Professional Services for <br/> <span style={{ color: 'var(--primary-blue)' }}>Modern Societies.</span>
                    </h2>
                    <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                        Adarsh Society Service provides the essential infrastructure needed to run a transparent and thriving community.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                    gap: '30px' 
                }}>
                    {services.map((service, idx) => (
                        <div key={idx} style={{ 
                            padding: '40px', 
                            borderRadius: '32px', 
                            background: '#F8FAFC', 
                            border: '1px solid #F1F5F9',
                            transition: 'all 0.3s ease',
                            cursor: 'default'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.borderColor = 'var(--primary-blue)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(52, 152, 219, 0.1)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#F1F5F9';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                            <div style={{ 
                                width: '70px', 
                                height: '70px', 
                                borderRadius: '20px', 
                                background: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '2.5rem', 
                                marginBottom: '30px',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.03)'
                            }}>
                                {service.icon}
                            </div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E293B', marginBottom: '15px' }}>{service.title}</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.7, fontSize: '1.05rem', fontWeight: 500 }}>{service.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlatformServices;
