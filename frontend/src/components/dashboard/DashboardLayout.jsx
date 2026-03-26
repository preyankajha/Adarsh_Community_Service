import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
    LayoutDashboard, Users, FileText, Settings, LogOut, 
    Bell, ChevronLeft, ChevronRight, Menu, X, ShieldCheck,
    Globe, HelpCircle, User, CreditCard, PieChart, Info,
    ArrowLeft
} from 'lucide-react';
import { getRoleLabel } from '../../utils/roleHelper';
import { useLanguage } from '../../context/LanguageContext';

const DashboardLayout = ({ children, role, title, showTitle = true, sidebarMenuItems = [], headerItems = [], banner = null }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tab } = useParams();
    const { language, setLanguage } = useLanguage();
    
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 1200);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'member' };
    const activeTab = tab || 'overview';

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 900);
            if (window.innerWidth > 1200) setIsCollapsed(false);
            if (window.innerWidth <= 1200) setIsCollapsed(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleNavClick = (targetTab) => {
        const currentBase = location.pathname.split('/')[1];
        navigate(`/${currentBase}/${targetTab}`);
        if (isMobile) setIsSidebarOpen(false);
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'hi' : 'en');
    };

    // Filter out duplicate or conflicting items
    const finalSidebarItems = sidebarMenuItems.filter(item => item.tab !== 'profile');
    const finalHeaderItems = headerItems.filter(item => item.tab !== 'profile');

    // Icons Mapping for sidebar items that might be passed as strings or partial objects
    const getIcon = (tabName) => {
        const icons = {
            overview: <LayoutDashboard size={20} />,
            family: <Users size={20} />,
            coordinator: <Users size={20} />,
            update: <FileText size={20} />,
            nominee: <ShieldCheck size={20} />,
            profile: <User size={20} />,
            help: <HelpCircle size={20} />,
            recommend: <Plus size={20} />,
            funds: <CreditCard size={20} />,
            contributions: <PieChart size={20} />,
            settings: <Settings size={20} />,
            notices: <Bell size={20} />
        };
        return icons[tabName] || <Info size={20} />;
    };

    // --- SHARED COMPONENTS ---
    const UserProfilePill = () => (
        <div
            onClick={() => handleNavClick('profile')}
            className={`premium-card ${activeTab === 'profile' ? 'active' : ''}`}
            style={{
                display: 'flex', alignItems: 'center', background: 'white',
                padding: '6px 16px 6px 6px', borderRadius: '16px',
                gap: '12px', border: '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
        >
            <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                overflow: 'hidden', background: 'var(--primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white'
            }}>
                {user?.profile_photo ? (
                    <img src={user.profile_photo} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <span style={{ color: 'white', fontWeight: 900, fontSize: '0.9rem' }}>{user?.name?.charAt(0)}</span>
                )}
            </div>
            {!isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {user?.name.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', opacity: 0.8 }}>
                        {getRoleLabel(user)}
                    </span>
                </div>
            )}
        </div>
    );

    // --- MOBILE LAYOUT ---
    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-page)', fontFamily: "'Outfit', sans-serif" }}>
                {/* Mobile Header */}
                <header style={{
                    height: '70px', background: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0,
                    zIndex: 1100, borderBottom: '1px solid var(--border-color)'
                }}>
                    <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--secondary)' }}>
                        <Menu size={28} />
                    </button>
                    <div style={{ fontWeight: 900, color: 'var(--secondary)', fontSize: '1.2rem' }}>
                        {user?.community_name?.split(' ')[0] || "Samiti"}
                    </div>
                    <UserProfilePill />
                </header>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setIsSidebarOpen(false)}>
                        <div style={{ width: '85%', height: '100%', background: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                <div style={{ fontWeight: 950, color: 'var(--primary)', fontSize: '1.4rem' }}>Workspace</div>
                                <button onClick={() => setIsSidebarOpen(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '12px', padding: '10px' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <nav style={{ flex: 1 }}>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[...finalSidebarItems, ...finalHeaderItems].map((item, idx) => {
                                        const isActive = activeTab === (item.tab || item.id);
                                        return (
                                            <li key={idx} onClick={() => handleNavClick(item.tab || item.id)} style={{
                                                padding: '16px', borderRadius: '14px', background: isActive ? 'var(--primary-light)' : 'transparent',
                                                color: isActive ? 'var(--primary)' : 'var(--secondary)', fontWeight: 800, fontSize: '1rem',
                                                display: 'flex', alignItems: 'center', gap: '16px', border: isActive ? '1px solid var(--primary-glow)' : '1px solid transparent'
                                            }}>
                                                <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                                                {item.label}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>

                            <button onClick={handleLogout} style={{ marginTop: '30px', width: '100%', padding: '16px', background: '#FFF5F5', color: 'var(--danger)', border: 'none', borderRadius: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                <LogOut size={20} /> Logout
                            </button>
                        </div>
                    </div>
                )}

                <main style={{ padding: '20px' }}>
                    {banner}
                    {children}
                </main>
            </div>
        );
    }

    // --- DESKTOP PREMIUM LAYOUT ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>

            {/* TOP HEADER */}
            <header style={{
                height: '84px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                zIndex: 1100,
                flexShrink: 0,
                position: 'sticky',
                top: 0
            }}>
                <div style={{
                    width: isCollapsed ? '80px' : '320px',
                    height: '100%',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', padding: isCollapsed ? '0' : '0 24px', gap: '14px',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}>
                    <div style={{
                        width: '46px', height: '46px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        borderRadius: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 900, fontSize: '1.2rem',
                        boxShadow: '0 8px 16px var(--primary-glow)',
                        flexShrink: 0, border: '2.5px solid white'
                    }}>
                        {user?.community_name?.charAt(0) || 'S'}
                    </div>
                    {!isCollapsed && (
                        <div className="animate-fade" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h2 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', whiteSpace: 'nowrap', lineHeight: '1.1' }}>
                                {user?.community_name || "Sanatan Samiti"}
                            </h2>
                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.1em', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px', whiteSpace: 'nowrap', opacity: 0.9 }}>
                                SEVA • SANKALP • SAMARPAN
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', minWidth: 0 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        {finalHeaderItems.map((item, idx) => {
                            const isActive = activeTab === (item.tab);
                            return (
                                <div key={idx} onClick={() => handleNavClick(item.tab)} style={{
                                    padding: '10px 18px', borderRadius: '12px', cursor: 'pointer',
                                    fontSize: '0.95rem', fontWeight: isActive ? 800 : 600,
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    background: isActive ? 'var(--primary)' : 'transparent',
                                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isActive ? '0 8px 16px var(--primary-glow)' : 'none'
                                }}>
                                    <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                                    {item.label}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0, marginLeft: '24px' }}>
                        <button onClick={toggleLanguage} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe size={16} /> {language === 'en' ? 'ENGLISH' : 'हिंदी'}
                        </button>
                        <UserProfilePill />
                    </div>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <aside style={{
                    width: isCollapsed ? '80px' : '320px',
                    background: 'white', borderRight: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0, zIndex: 1000, position: 'relative'
                }}>
                    <nav style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
                        {!isCollapsed && <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', margin: '12px 12px 10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Workspace</p>}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {finalSidebarItems.map((item, idx) => {
                                const isActive = activeTab === (item.id || item.tab || 'overview');
                                return (
                                    <li key={idx} onClick={() => handleNavClick(item.id || item.tab)} style={{
                                        padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '16px', borderRadius: '16px',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: isActive ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' : 'transparent',
                                        color: isActive ? 'white' : 'var(--secondary)', fontWeight: isActive ? 800 : 700, fontSize: '0.95rem',
                                        boxShadow: isActive ? '0 8px 20px var(--primary-glow)' : 'none'
                                    }}>
                                        <span style={{ fontSize: '1.4rem', opacity: 1, display: 'flex', justifyContent: 'center' }}>{item.icon}</span>
                                        {!isCollapsed && <span style={{ whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>}
                                        {!isCollapsed && item.count > 0 && (
                                            <span style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--danger)', color: 'white', minWidth: '22px', height: '22px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, padding: '0 6px' }}>{item.count}</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div style={{ padding: '20px 16px', borderTop: '2px dashed #F1F5F9' }}>
                        <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ width: '100%', padding: '12px', background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 700, fontSize: '0.8rem' }}>
                            {isCollapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Minimize Sidebar</>}
                        </button>
                    </div>

                    <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: '#FDFBF7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'white', padding: isCollapsed ? '10px' : '16px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', justifyContent: isCollapsed ? 'center' : 'flex-start', cursor: 'pointer', transition: 'all 0.2s' }} onClick={handleLogout}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--danger)' }}>
                                <LogOut size={22} />
                            </div>
                            {!isCollapsed && (
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--danger)' }}>Logout</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>End Session</div>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {banner}
                    <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-page)', padding: '40px' }}>
                        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                            {showTitle && activeTab !== 'overview' && (
                                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <button onClick={() => handleNavClick('overview')} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px' }}>
                                        <ArrowLeft size={18} color="var(--primary)" />
                                    </button>
                                    <div>
                                        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--secondary)', fontWeight: 950, letterSpacing: '-0.03em' }}>
                                            {title || [...finalSidebarItems, ...finalHeaderItems].find(i => (i.tab || 'overview') === activeTab)?.label || 'Dashboard'}
                                        </h1>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px', fontWeight: 700 }}>{user?.community_name}</p>
                                    </div>
                                </div>
                            )}
                            <div className="animate-slide-up">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
