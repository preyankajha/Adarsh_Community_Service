import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { isCommitteeMember, getRoleLabel, getAuthUser } from '../utils/roleHelper';

const Header = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', content: null });

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const openModal = (type) => {
        let title = '';
        let content = null;

        switch (type) {
            case 'about':
                title = t.about.title;
                content = (
                    <div>
                        <p>{t.about.para1}</p>
                        <p>{t.about.para2}</p>
                        <p style={{ fontStyle: 'italic', color: 'var(--primary-saffron)', fontWeight: 600 }}>{t.about.highlight}</p>
                    </div>
                );
                break;
            case 'services':
                title = t.services.title;
                content = (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        {t.services.items.map((service, i) => (
                            <div key={i} style={{ padding: '15px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <h4 style={{ color: 'var(--primary-blue)', marginBottom: '8px', fontWeight: 800 }}>{service.title}</h4>
                                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>{service.desc}</p>
                            </div>
                        ))}
                    </div>
                );
                break;
            case 'membership':
                title = t.membership.title;
                content = (
                    <ul style={{ paddingLeft: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>
                        {t.membership.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                );
                break;
            case 'contact':
                title = t.contact.title;
                content = (
                    <div style={{ padding: '10px' }}>
                        <p><strong>{t.contact.address_label}</strong> {t.contact.address_value}</p>
                        <p style={{ marginTop: '20px', color: 'var(--primary-saffron)', fontWeight: 700 }}>{t.contact.alert}</p>
                    </div>
                );
                break;
            default: break;
        }

        setModalConfig({ isOpen: true, title, content });
        setIsMenuOpen(false);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    return (
        <>{/* ... existing code ... */}
            <header className="site-header">
                <div className="container">
                    <div className="logo-area" onClick={() => handleNavigation('/')} style={{ cursor: 'pointer' }}>
                        <h1>{t.header.title_line1} <br /><span>{t.header.title_line2}</span></h1>
                    </div>
                    <nav className="main-nav">
                        <button
                            className="mobile-menu-toggle"
                            aria-label="Menu"
                            aria-expanded={isMenuOpen}
                            onClick={toggleMenu}
                        >
                            {isMenuOpen ? '✕' : '☰'}
                        </button>
                        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                            <li><a href="/" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }}>{t.header.nav.home}</a></li>
                            <li><a href="#about" onClick={(e) => { e.preventDefault(); openModal('about'); }}>{t.header.nav.about}</a></li>
                            <li><a href="#services" onClick={(e) => { e.preventDefault(); openModal('services'); }}>{t.header.nav.services}</a></li>
                            <li><a href="#membership" onClick={(e) => { e.preventDefault(); openModal('membership'); }}>{t.header.nav.membership}</a></li>
                            <li><a href="#contact" onClick={(e) => { e.preventDefault(); openModal('contact'); }}>{t.header.nav.contact}</a></li>
                            <li><a href="/#network" onClick={(e) => { 
                                if (window.location.pathname === '/') {
                                    e.preventDefault();
                                    document.getElementById('network')?.scrollIntoView({ behavior: 'smooth' });
                                }
                                setIsMenuOpen(false);
                            }}>{t.header.nav.network}</a></li>

                            <li className="action-buttons-container">
                                {(() => {
                                    const u = getAuthUser();
                                    if (!u) {
                                        return (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => handleNavigation('/register-society')} className="nav-btn-outline">Register Society</button>
                                                <button onClick={() => handleNavigation('/login')} className="nav-btn-filled">Login</button>
                                            </div>
                                        );
                                    }

                                    const handleClick = () => {
                                        let path = u.role === 'treasurer' ? '/treasurer' :
                                            (['secretary', 'joint_secretary'].includes(u.role) ? '/secretary' :
                                                (isCommitteeMember(u) ? '/admin' :
                                                    (u.role === 'family_head' ? '/family' : '/member')));
                                        handleNavigation(path);
                                    };

                                    const label = u.role === 'family_head' ? 'Family Portal' :
                                        (u.role === 'family_member' ? 'Member Portal' :
                                            getRoleLabel(u));

                                    const handleLogout = () => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                        navigate('/');
                                        window.location.reload(); // Refresh to clear all context
                                    };

                                    return (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <button onClick={handleClick} className="nav-btn-filled">
                                                {label}
                                            </button>
                                            <button onClick={handleLogout} className="nav-btn-outline" style={{ padding: '8px 15px', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                                                Logout
                                            </button>
                                        </div>
                                    );
                                })()}
                            </li>

                            <li>
                                <button onClick={toggleLanguage} className="lang-toggle">
                                    {language === 'hi' ? 'EN' : 'हिन्दी'}
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>

            {/* Information Modal */}
            {modalConfig.isOpen && (
                <div className="info-modal-overlay" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>
                    <div className="info-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="info-modal-header">
                            <h3>{modalConfig.title}</h3>
                            <button className="close-btn" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>✕</button>
                        </div>
                        <div className="info-modal-body">
                            {modalConfig.content}
                        </div>
                        <div className="info-modal-footer">
                            <button className="nav-btn-filled" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
