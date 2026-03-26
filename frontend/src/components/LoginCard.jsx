import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { isCommitteeMember } from '../utils/roleHelper';
import { useParams } from 'react-router-dom';

const LoginCard = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const { societyCode } = useParams();
    const [formData, setFormData] = useState({ phone: '', password: '', role: 'family_head', society_code: societyCode || '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [communityInfo, setCommunityInfo] = useState(null);
    const [multiSocieties, setMultiSocieties] = useState(null);
    const [loading, setLoading] = useState(false);

    // Dynamic Branding Fetch with Cross-Field & Backend Lookup
    useEffect(() => {
        let identifier = (formData.phone || societyCode)?.toString();
        if (!identifier) {
            setCommunityInfo(null);
            return;
        }

        // 1. Try extraction from Member ID format
        let extractedCode = null;
        if (identifier.includes('-F-')) {
            const parts = identifier.split('-F-');
            if (parts[0] && parts[0].length >= 3) {
                extractedCode = parts[0].toUpperCase();
            }
        }

        // 2. Decide how to lookup
        const isPotentialCode = identifier.length >= 3 && identifier.length <= 10 && !identifier.includes('@') && !identifier.includes('-') && !/^\d+$/.test(identifier);
        const isPotentialPhone = /^\d{10}$/.test(identifier);
        const isPotentialEmail = identifier.includes('@') && identifier.includes('.');

        if (extractedCode) {
            api.getCommunityByCode(extractedCode)
                .then(res => setCommunityInfo(res.data))
                .catch(() => setCommunityInfo(null));
        } else if (isPotentialCode) {
            api.getCommunityByCode(identifier.toUpperCase())
                .then(res => setCommunityInfo(res.data))
                .catch(() => setCommunityInfo(null));
        } else if (isPotentialPhone || isPotentialEmail) {
            // New Backend Lookup by Phone/Email
            api.lookupCommunity(identifier)
                .then(res => {
                    if (res.data) setCommunityInfo(res.data);
                    else setCommunityInfo(null);
                })
                .catch(() => setCommunityInfo(null));
        } else {
            setCommunityInfo(null);
        }
    }, [formData.phone, societyCode]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (role) => {
        setFormData({ ...formData, role: role });
        setError('');
    };

    const handleSubmit = async (e, selectedCommId = null) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loginPayload = { ...formData };
            if (selectedCommId) loginPayload.community_id = selectedCommId;
            if (societyCode) loginPayload.society_code = societyCode;
            else if (communityInfo && communityInfo.society_code) loginPayload.society_code = communityInfo.society_code;

            const res = await api.login(loginPayload);
            const data = res.data;

            if (data.status === 'multiple_societies') {
                setMultiSocieties(data.communities);
                setLoading(false);
                return;
            }

            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                const user = data.user;
                const selectedRole = formData.role; 

                if (selectedRole === 'admin') {
                    if (isCommitteeMember(user)) navigate('/admin/overview');
                    else {
                        setError('❌ No Committee Role Assigned.');
                        localStorage.clear();
                    }
                } else if (selectedRole === 'family_head') {
                    navigate('/family/overview');
                } else if (selectedRole === 'family_member') {
                    navigate('/member/overview');
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'System Error: Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-card premium-card animate-slide-up" style={{ padding: isEmbedded ? '30px' : '48px', width: '100%', maxWidth: '460px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ color: 'var(--secondary)', fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    {communityInfo ? (
                        <>
                            <span style={{ color: 'var(--primary)' }}>{communityInfo.name.split(' ')[0]}</span> {communityInfo.name.split(' ').slice(1).join(' ')}
                        </>
                    ) : (
                        <>Authorized <span style={{ color: 'var(--primary)' }}>Login</span></>
                    )}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 700 }}>
                    {communityInfo ? `Authorized ${communityInfo.society_code} Portal` : 'Access your community workspace'}
                </p>
                {communityInfo && (communityInfo.city || communityInfo.state) && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 800 }}>
                        📍 {communityInfo.city}{communityInfo.city && communityInfo.state ? ', ' : ''}{communityInfo.state}
                    </div>
                )}
            </div>

            {/* Role Nav Toggles */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '14px', padding: '6px', marginBottom: '28px', border: '1px solid #E2E8F0' }}>
                {['family_head', 'family_member', 'admin'].map((role) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        style={{ 
                            flex: 1, 
                            padding: '10px 4px', 
                            border: 'none', 
                            background: formData.role === role ? 'white' : 'transparent', 
                            borderRadius: '10px', 
                            cursor: 'pointer', 
                            fontSize: '0.85rem',
                            fontWeight: formData.role === role ? 800 : 600, 
                            color: formData.role === role ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: formData.role === role ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        {role === 'family_head' && '👨‍👩‍👧 Head'}
                        {role === 'family_member' && '👤 Member'}
                        {role === 'admin' && '🏛️ Committee'}
                    </button>
                ))}
            </div>

            {formData.role === 'admin' && (
                <div className="animate-fade" style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FBD38D' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', textAlign: 'center', margin: 0, fontWeight: 700 }}>
                        Internal Access for Authorized Committee Members only
                    </p>
                </div>
            )}

            {error && (
                <div className="animate-fade" style={{ background: '#FFF5F5', color: 'var(--danger)', padding: '14px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center', fontWeight: 700, border: '1px solid #FED7D7' }}>
                    {error}
                </div>
            )}

            {multiSocieties ? (
                <div className="animate-slide-up">
                    <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', border: '1px solid var(--primary)' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                            Multiple societies found for this account.
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: 'var(--secondary)', fontSize: '0.85rem', opacity: 0.8 }}>
                            Please select which one you want to enter:
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                        {multiSocieties.map((soc) => (
                            <button
                                key={soc.id}
                                type="button"
                                onClick={() => handleSubmit(null, soc.id)}
                                disabled={loading}
                                style={{
                                    display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px',
                                    background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px',
                                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white'; }}
                            >
                                <div style={{ fontWeight: 850, color: 'var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {soc.name}
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}>{soc.society_code}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                    📍 {soc.city || 'Regional Office'}
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setMultiSocieties(null)}
                        style={{ width: '100%', background: 'none', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '14px', fontWeight: 800, color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                        ← Back to ID Entry
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="animate-fade">
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>
                            {formData.role === 'family_member' ? 'Member ID or Mobile Number' : 'Mobile Number or Email'}
                        </label>
                        <input
                            type="text"
                            name="phone"
                            className="premium-input"
                            placeholder={formData.role === 'family_member' ? 'F-XXXX-MXX or 9876543210' : '9876543210 or user@example.com'}
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            style={{ textTransform: formData.phone.includes('-') ? 'uppercase' : 'none' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>Password</label>
                            {formData.role === 'family_member' && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>Use Family Password</span>}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="premium-input"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ paddingRight: '46px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                                onMouseOut={e => e.currentTarget.style.opacity = 0.6}
                            >
                                {showPassword ? '👁️' : '🙈'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="premium-btn shadow-premium"
                        disabled={loading}
                        style={{ width: '100%', position: 'relative', overflow: 'hidden' }}
                    >
                        {loading ? 'Authenticating...' : (formData.role === 'family_head' ? 'Login as Head' : (formData.role === 'admin' ? 'Enter Committee Portal' : 'Login as Member'))}
                    </button>

                    <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                            Not a member yet?
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                            Register your family →
                        </button>
                    </div>
                </form>
            )}

            {!isEmbedded && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button 
                        onClick={() => navigate('/')} 
                        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '20px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = 'var(--secondary)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        ← Back to Home
                    </button>
                </div>
            )}
        </div>
    );
};

export default LoginCard;
