import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
    Building2, MapPin, ShieldCheck, UserPlus, CheckCircle2, 
    ArrowRight, ArrowLeft, Target, Globe, Phone, Mail, Lock
} from 'lucide-react';

const RegisterSociety = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        contact_email: '',
        contact_phone: '',
        registration_number: '',
        foundation_date: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        approx_families: '',
        objectives: '',
        logo_url: '',
        admin_name: '',
        admin_phone: '',
        admin_password: ''
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [previewCode, setPreviewCode] = useState('CODE');

    useEffect(() => {
        if (formData.name) {
            const words = formData.name.trim().split(/\s+/);
            const code = words.map(w => w[0]?.toUpperCase()).join('').slice(0, 4);
            setPreviewCode(code || 'CODE');
        }
    }, [formData.name]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (step === 1 && (!formData.name || !formData.contact_email || !formData.contact_phone)) {
            setError('Please fill in basic contact details.');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/communities/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const data = await response.json();
                setError(data.detail || 'Registration failed');
            }
        } catch (err) {
            setError('System Error: Unable to reach registration server.');
        } finally {
            setLoading(false);
        }
    };

    const StepIndicator = () => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            {[1, 2, 3].map(i => (
                <React.Fragment key={i}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: step >= i ? 'var(--primary)' : '#E2E8F0',
                        color: step >= i ? 'white' : '#94A3B8',
                        fontWeight: 800, fontSize: '0.9rem',
                        boxShadow: step === i ? '0 0 0 4px var(--primary-light)' : 'none',
                        transition: 'all 0.3s ease'
                    }}>
                        {step > i ? <CheckCircle2 size={20} /> : i}
                    </div>
                    {i < 3 && <div style={{ width: '40px', height: '2px', background: step > i ? 'var(--primary)' : '#E2E8F0' }} />}
                </React.Fragment>
            ))}
        </div>
    );

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-page)', padding: '40px 20px' }}>
                    <div className="premium-card animate-scale-up" style={{ padding: '60px', textAlign: 'center', maxWidth: '650px', background: 'white' }}>
                        <div style={{ width: '100px', height: '100px', background: '#F0FFF4', color: '#38A169', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                            <CheckCircle2 size={60} strokeWidth={2.5} />
                        </div>
                        <h1 style={{ color: 'var(--secondary)', fontSize: '2.5rem', fontWeight: 950, marginBottom: '20px', letterSpacing: '-1px' }}>Samiti Established!</h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 600 }}>
                            Congratulations! <strong>{formData.name}</strong> is now live on our platform with society code <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{previewCode}</span>.
                        </p>
                        
                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', margin: '30px 0', border: '1px solid #E2E8F0', textAlign: 'left' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: 'var(--secondary)', fontWeight: 800 }}>Next Steps:</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li>Login as <span style={{ color: 'var(--secondary)' }}>Committee member</span> using your phone: <strong>{formData.admin_phone}</strong></li>
                                <li>Invite your society members to search for <strong>"{previewCode}"</strong></li>
                                <li>Customize your bylaws and rules in the Admin dashboard.</li>
                            </ul>
                        </div>

                        <button 
                            onClick={() => navigate(`/login/${previewCode}`)} 
                            className="premium-btn shadow-premium" 
                            style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}
                        >
                            Enter Your New Portal <ArrowRight size={20} />
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1, background: 'var(--bg-page)', padding: '60px 20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '3rem', fontWeight: 950, color: 'var(--secondary)', marginBottom: '15px', letterSpacing: '-1.5px' }}>Register Your Society</h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pioneer the digital transformation of your community governance.</p>
                    </div>

                    <div className="premium-card" style={{ padding: '48px', background: 'white' }}>
                        <StepIndicator />

                        {error && (
                            <div className="animate-fade" style={{ background: '#FFF5F5', color: 'var(--danger)', padding: '20px', borderRadius: '16px', marginBottom: '30px', textAlign: 'center', fontWeight: 700, border: '1px solid #FED7D7' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="animate-slide-up" style={{ display: 'grid', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9', marginBottom: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={24} /></div>
                                        <h3 style={{ margin: 0, color: 'var(--secondary)', fontWeight: 850 }}>Identity & Branding</h3>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Full Society Name</label>
                                        <input type="text" name="name" placeholder="e.g. Jagdama Samiti Resident Association" className="premium-input" value={formData.name} onChange={handleChange} required />
                                        <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}> Society Code Preview: <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{previewCode}</span></div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}><Mail size={14} style={{ marginRight: '4px' }} />Official Email</label>
                                            <input type="email" name="contact_email" placeholder="admin@society.com" className="premium-input" value={formData.contact_email} onChange={handleChange} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}><Phone size={14} style={{ marginRight: '4px' }} />Contact Mobile</label>
                                            <input type="tel" name="contact_phone" placeholder="10-digit mobile" maxLength="10" className="premium-input" value={formData.contact_phone} onChange={handleChange} required />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Society Brief</label>
                                        <textarea name="description" placeholder="A short description of your community..." rows="3" className="premium-input" value={formData.description} onChange={handleChange} style={{ resize: 'none' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Registration No. (Optional)</label>
                                            <input type="text" name="registration_number" placeholder="e.g. REG/123/2024" className="premium-input" value={formData.registration_number} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Foundation Date</label>
                                            <input type="date" name="foundation_date" className="premium-input" value={formData.foundation_date} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <button type="button" onClick={nextStep} className="premium-btn shadow-premium" style={{ marginTop: '20px', padding: '16px' }}>
                                        Next: Location & Vision <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-slide-up" style={{ display: 'grid', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9', marginBottom: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={24} /></div>
                                        <h3 style={{ margin: 0, color: 'var(--secondary)', fontWeight: 850 }}>Location & Objectives</h3>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Physical Address</label>
                                        <input type="text" name="address" placeholder="Building, Colony, Locality" className="premium-input" value={formData.address} onChange={handleChange} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                        <input type="text" name="city" placeholder="City" className="premium-input" value={formData.city} onChange={handleChange} />
                                        <input type="text" name="state" placeholder="State" className="premium-input" value={formData.state} onChange={handleChange} />
                                        <input type="text" name="pincode" placeholder="PIN" maxLength="6" className="premium-input" value={formData.pincode} onChange={handleChange} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Approximate Families/Members</label>
                                        <input type="number" name="approx_families" placeholder="e.g. 250" className="premium-input" value={formData.approx_families} onChange={handleChange} />
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <Target size={16} color="var(--primary)" />
                                            <label style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Primary Vision & Objectives</label>
                                        </div>
                                        <textarea name="objectives" placeholder="What are the key goals of your Samiti? e.g. Mutual help, Cultural preservation, Transparency..." rows="4" className="premium-input" value={formData.objectives} onChange={handleChange} style={{ resize: 'none' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '10px' }}>
                                        <button type="button" onClick={prevStep} style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', fontWeight: 800, color: 'var(--text-muted)' }}>Back</button>
                                        <button type="button" onClick={nextStep} className="premium-btn shadow-premium" style={{ padding: '16px' }}>Next: Admin Setup <ArrowRight size={20} /></button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-slide-up" style={{ display: 'grid', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9', marginBottom: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} /></div>
                                        <h3 style={{ margin: 0, color: 'var(--secondary)', fontWeight: 850 }}>Administrative Setup</h3>
                                    </div>

                                    <div style={{ background: '#F0F9FF', padding: '15px', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                                        <p style={{ fontSize: '0.85rem', color: '#0369A1', margin: 0, fontWeight: 700 }}>
                                            You are creating the **Master Admin** account for this society. Use these credentials to log in after setup.
                                        </p>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Admin Full Name</label>
                                        <input type="text" name="admin_name" placeholder="John Doe" className="premium-input" value={formData.admin_name} onChange={handleChange} required />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Admin Phone (Login)</label>
                                            <input type="tel" name="admin_phone" placeholder="9876543210" maxLength="10" className="premium-input" value={formData.admin_phone} onChange={handleChange} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem' }}>Secure Password</label>
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    name="admin_password" 
                                                    placeholder="••••••••" 
                                                    className="premium-input" 
                                                    value={formData.admin_password} 
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
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                                        <input type="checkbox" id="terms" required style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                        <label htmlFor="terms" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>I agree to the <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Samiti Governance Terms</span> and multi-tenant data isolation policies.</label>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '10px' }}>
                                        <button type="button" onClick={prevStep} style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', fontWeight: 800, color: 'var(--text-muted)' }}>Back</button>
                                        <button 
                                            type="submit" 
                                            disabled={loading} 
                                            className="premium-btn shadow-premium" 
                                            style={{ padding: '16px' }}
                                        >
                                            {loading ? 'Establishiing Samiti...' : 'Launch Your Portal 🚀'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>Already established? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Login to your dashboard</Link></p>
                        <p style={{ margin: 0 }}><Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 700 }}>← Back to Home</Link></p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default RegisterSociety;
