import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

// Society detail card shown after searching by code
const SocietyCard = ({ society, onSelect, onClear }) => (
    <div className="premium-card animate-fade" style={{
        background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%)',
        border: '2px solid var(--primary-glow)',
        padding: '24px',
        marginTop: '16px',
        position: 'relative'
    }}>
        <button onClick={onClear} style={{
            position: 'absolute', top: '16px', right: '16px',
            background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
            fontSize: '0.9rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} title="Clear">✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white' }}>🏘️</div>
            <div>
                <h3 style={{ margin: 0, color: 'var(--secondary)', fontWeight: 900, fontSize: '1.25rem' }}>{society.name}</h3>
                <span style={{
                    display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
                    fontWeight: 800, fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', letterSpacing: '1px', marginTop: '4px'
                }}>
                    SOCIETY CODE: {society.society_code}
                </span>
            </div>
        </div>

        {society.description && (
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {society.description}
            </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 600 }}>
            {(society.address || society.city || society.state) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: 'var(--primary)' }}>📍</span>
                    <span style={{ opacity: 0.8 }}>
                        {[society.address, society.city, society.state, society.pincode].filter(Boolean).join(', ')}
                    </span>
                </div>
            )}
            {society.contact_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--primary)' }}>📞</span>
                    <span style={{ opacity: 0.8 }}>{society.contact_phone}</span>
                </div>
            )}
        </div>

        <button onClick={onSelect} className="premium-btn" style={{ marginTop: '24px', width: '100%', fontSize: '1.1rem' }}>
            Join This Society ✅
        </button>
    </div>
);

const Signup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    // Step 1: Society selection state
    const [step, setStep] = useState('search'); // 'search' or 'register'
    const [codeInput, setCodeInput] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [foundSociety, setFoundSociety] = useState(null);
    const [showBrowse, setShowBrowse] = useState(false);
    const [communities, setCommunities] = useState([]);
    const [communityLoading, setCommunityLoading] = useState(false);

    // Step 2: Registration form state
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', password: '', confirmPassword: '', community_id: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            api.verifyToken(token)
                .then(res => {
                    if (res.data) {
                        setFormData(prev => ({
                            ...prev,
                            name: res.data.new_head_name || '',
                            phone: res.data.mobile || '',
                            email: res.data.email || ''
                        }));
                    }
                })
                .catch(() => {});
        }
    }, [token]);

    useEffect(() => {
        if (showBrowse && communities.length === 0) {
            setCommunityLoading(true);
            api.getCommunities()
                .then(res => setCommunities(res.data || []))
                .catch(() => setCommunities([]))
                .finally(() => setCommunityLoading(false));
        }
    }, [showBrowse]);

    const handleCodeSearch = async (e) => {
        e.preventDefault();
        if (!codeInput.trim()) return;
        setSearching(true);
        setSearchError('');
        setFoundSociety(null);
        try {
            const res = await api.searchCommunityByCode(codeInput.trim().toUpperCase());
            setFoundSociety(res.data);
        } catch (err) {
            setSearchError(err.response?.data?.detail || `No society found with code "${codeInput.toUpperCase()}"`);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectSociety = (society) => {
        setFormData(prev => ({ ...prev, community_id: society.id }));
        setFoundSociety(society);
        setStep('register');
        setShowBrowse(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        if (formData.phone.length !== 10) { setError('Mobile number must be 10 digits'); return; }
        if (!formData.community_id) { setError('Please select your community / society'); return; }

        setLoading(true);
        try {
            await api.signup({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                password: formData.password,
                role: 'family_head',
                community_id: formData.community_id,
                recommendation_token: token
            });
            setShowSuccessModal(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    if (showSuccessModal) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-page)', padding: '20px' }}>
                <div className="premium-card animate-slide-up" style={{ padding: '48px', maxWidth: '440px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎉</div>
                    <h1 style={{ color: 'var(--secondary)', fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Signup Successful!</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px', lineHeight: 1.6 }}>
                        Your account has been created. Your <strong>Mobile Number</strong> is your Login ID.
                    </p>
                    <button onClick={() => navigate('/login')} className="premium-btn" style={{ width: '100%' }}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', padding: '40px 20px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
                
                {/* Visual Progress Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 0 4px var(--primary-glow)' }} />
                    <div style={{ width: '40px', height: '2px', background: step === 'register' ? 'var(--primary)' : '#E2E8F0' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: step === 'register' ? 'var(--primary)' : '#E2E8F0', boxShadow: step === 'register' ? '0 0 0 4px var(--primary-glow)' : 'none' }} />
                </div>

                {step === 'search' ? (
                    <div className="premium-card animate-slide-up" style={{ padding: '48px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h1 style={{ color: 'var(--secondary)', fontSize: '2rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.03em' }}>
                                Find Your <span style={{ color: 'var(--primary)' }}>Society</span>
                            </h1>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Join your community by entering their unique society code
                            </p>
                        </div>

                        <form onSubmit={handleCodeSearch} style={{ marginBottom: '24px' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="ENTER CODE (e.g. JGSA)"
                                    value={codeInput}
                                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                                    maxLength={10}
                                    style={{ paddingRight: '100px', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase' }}
                                />
                                <button type="submit" disabled={searching || !codeInput.trim()} style={{
                                    position: 'absolute', right: '8px', top: '8px', bottom: '8px',
                                    background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px',
                                    padding: '0 16px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    {searching ? '...' : 'FIND'}
                                </button>
                            </div>
                        </form>

                        {searchError && (
                            <div className="animate-fade" style={{ background: '#FFF5F5', color: 'var(--danger)', padding: '14px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '16px', textAlign: 'center', fontWeight: 700, border: '1px solid #FED7D7' }}>
                                ⚠️ {searchError}
                            </div>
                        )}

                        {foundSociety && (
                            <SocietyCard
                                society={foundSociety}
                                onSelect={() => handleSelectSociety(foundSociety)}
                                onClear={() => setFoundSociety(null)}
                            />
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 800 }}>OR BROWSE</span>
                            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
                        </div>

                        <button onClick={() => setShowBrowse(!showBrowse)} style={{
                            width: '100%', padding: '14px', background: 'white',
                            border: '2px solid #F1F5F9', borderRadius: '12px', cursor: 'pointer',
                            color: 'var(--secondary)', fontWeight: 800, fontSize: '0.95rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            transition: 'all 0.2s'
                        }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                           onMouseOut={e => e.currentTarget.style.borderColor = '#F1F5F9'}>
                            🏢 View Participating Societies {showBrowse ? '▴' : '▾'}
                        </button>

                        {showBrowse && (
                            <div className="animate-fade" style={{ marginTop: '16px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                                {communityLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontWeight: 600 }}>Loading Societies...</div>
                                ) : communities.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--danger)', fontWeight: 600 }}>No societies found.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {communities.map(c => (
                                            <div key={c.id} onClick={() => handleSelectSociety(c)} style={{
                                                padding: '16px', borderRadius: '12px', cursor: 'pointer',
                                                border: '2px solid #F1F5F9', background: 'white',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateX(5px)'; }}
                                               onMouseOut={e => { e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '0.95rem' }}>{c.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>📍 {c.city || 'Local'}</div>
                                                </div>
                                                <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 900, fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px' }}>{c.society_code}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="premium-card animate-slide-up" style={{ padding: '48px' }}>
                        {/* Selected Society Badge */}
                        <div style={{ background: 'var(--primary-light)', borderRadius: '16px', padding: '16px', border: '1px solid var(--primary-glow)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                            <div style={{ fontSize: '1.5rem' }}>🏘️</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Selected Society</div>
                                <div style={{ fontWeight: 900, color: 'var(--secondary)', fontSize: '1.1rem' }}>{(foundSociety || communities.find(c=>c.id === formData.community_id))?.name}</div>
                            </div>
                            <button onClick={() => setStep('search')} style={{ background: 'white', border: '1px solid var(--primary-glow)', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: 'var(--primary)' }}>Change</button>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <h2 style={{ color: 'var(--secondary)', fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em' }}>Personal Details</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Complete your family head registration</p>
                        </div>

                        {error && (
                            <div className="animate-fade" style={{ background: '#FFF5F5', color: 'var(--danger)', padding: '14px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center', fontWeight: 700, border: '1px solid #FED7D7' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>Full Name of Family Head</label>
                                <input type="text" name="name" className="premium-input" placeholder="e.g. Rajesh Kumar" value={formData.name} onChange={handleChange} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>Mobile Number <small style={{ fontWeight: 500 }}>(Login ID)</small></label>
                                    <input type="tel" name="phone" className="premium-input" placeholder="10-digit mobile number" maxLength="10" value={formData.phone} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>Email Address <small style={{ fontWeight: 500 }}>(optional)</small></label>
                                    <input type="email" name="email" className="premium-input" placeholder="e.g. rajesh@email.com" value={formData.email} onChange={handleChange} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            name="password" 
                                            className="premium-input" 
                                            placeholder="••••••••" 
                                            value={formData.password} 
                                            onChange={handleChange} 
                                            required 
                                            style={{ paddingRight: '45px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5, transition: '0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                                            onMouseOut={e => e.currentTarget.style.opacity = 0.5}
                                        >
                                            {showPassword ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>Confirm</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            name="confirmPassword" 
                                            className="premium-input" 
                                            placeholder="••••••••" 
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                            required 
                                            style={{ 
                                                paddingRight: '45px',
                                                borderColor: formData.confirmPassword && formData.password !== formData.confirmPassword ? 'var(--danger)' : '' 
                                            }} 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5, transition: '0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                                            onMouseOut={e => e.currentTarget.style.opacity = 0.5}
                                        >
                                            {showConfirmPassword ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="premium-btn" style={{ width: '100%', marginTop: '10px' }}>
                                {loading ? 'Creating Account...' : 'Finish Registration ✅'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Login Here</Link>
                    </p>
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
                        <Link to="/register-society" style={{ color: 'var(--secondary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>Register Society →</Link>
                        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>← Back to Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
