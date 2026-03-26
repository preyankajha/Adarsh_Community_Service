import React, { useEffect, useState } from 'react';

const AnnouncementBar = () => {
    const [notices, setNotices] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        fetch('/api/notices', { headers })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setNotices(data.slice(0, 8));
            })
            .catch(err => console.error(err));
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'danger': return '🚨';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            default: return '📢';
        }
    };

    return (
        <div className="announcement-bar" style={{
            background: 'linear-gradient(90deg, #1e3a8a, #2563eb)',
            color: 'white',
            padding: '10px 0',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 100
        }}>
            <div className="announcement-content" style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                animation: 'marquee 40s linear infinite',
                gap: '50px',
                paddingLeft: '100%'
            }}>
                {notices.length > 0 ? (
                    notices.map((n, i) => (
                        <span key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            letterSpacing: '0.5px'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>{getIcon(n.type)}</span>
                            <span style={{ color: '#fbbf24' }}>[{n.category}]</span>
                            {n.title}:
                            <span style={{ fontWeight: 400, opacity: 0.9 }}>{n.content.substring(0, 100)}{n.content.length > 100 ? '...' : ''}</span>
                        </span>
                    ))
                ) : (
                    <>
                        <span style={{ fontWeight: 700 }}>🔔 Welcome to Sanatani Swayamsevi Samiti Digital Platform</span>
                        <span style={{ fontWeight: 700 }}>🤝 Transparency, Equality and Collective Growth</span>
                        <span style={{ fontWeight: 700 }}>🌟 Connect with us for a better community</span>
                    </>
                )}
            </div>
            <style>
                {`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-200%); }
                }
                `}
            </style>
        </div>
    );
};

export default AnnouncementBar;
