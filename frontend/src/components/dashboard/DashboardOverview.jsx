import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Users, CreditCard, AlertCircle, Clock, Plus, FileText, TrendingUp, Shield, Megaphone, DollarSign, Wallet } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// --- Smart UI Components ---

const SmartStatCard = ({ icon: Icon, label, value, subLabel, colorClass, bgClass, onClick }) => (
    <div
        className="smart-stat-card"
        onClick={onClick}
        style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            minHeight: '140px',
            border: '1px solid rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: onClick ? 'pointer' : 'default'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{
                width: '48px', height: '48px',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bgClass,
                color: colorClass
            }}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {subLabel && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '4px 8px', borderRadius: '20px' }}>{subLabel}</span>}
        </div>
        <div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: '8px' }}>{value}</div>
            <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
        </div>
        <style>{`
            .smart-stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important; }
        `}</style>
    </div>
);

const SmartActionCard = ({ icon: Icon, title, description, btnText, btnColor, onClick }) => (
    <div className="smart-action-card" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        border: '1px solid rgba(0,0,0,0.04)',
        height: '100%',
        transition: 'all 0.2s ease'
    }}>
        <div style={{
            width: '64px', height: '64px',
            borderRadius: '50%',
            background: `${btnColor}15`,
            color: btnColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px'
        }}>
            <Icon size={32} strokeWidth={2} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{title}</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, flex: 1 }}>{description}</p>
        <button
            onClick={onClick}
            style={{
                width: '100%',
                padding: '12px',
                background: btnColor,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'filter 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.filter = 'brightness(90%)'}
            onMouseOut={e => e.currentTarget.style.filter = 'none'}
        >
            {btnText}
        </button>
        <style>{`
            .smart-action-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important; }
        `}</style>
    </div>
);

// --- Dashboard Logic ---

const DashboardOverview = ({ role, user: currentUser, initialData = null }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [data, setData] = useState({
        loading: !initialData,
        stats: initialData?.stats || {},
        family: initialData?.family || null,
        finance: initialData?.finance || null,
        requests: initialData?.requests || [],
        notices: initialData?.notices || [],
        beneficiaries: initialData?.beneficiaries || [],
        communityInfo: null
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine effective role for UI purposes
    // If we are strictly in "Family Head" mode (passed via prop), ignore the official position
    const effectiveRole = (role === 'family_head' || role === 'member')
        ? role
        : (currentUser?.position && currentUser?.position !== 'none' ? currentUser.position : role);

    // --- Data Fetching ---
    useEffect(() => {
        // If initialData is provided, we don't need to fetch
        if (initialData) {
            setData({
                loading: false,
                stats: initialData.stats || {},
                family: initialData.family || null,
                finance: initialData.finance || null,
                requests: initialData.requests || [],
                notices: initialData.notices || [],
                beneficiaries: initialData.beneficiaries || []
            });
            return;
        }

        const load = async () => {
            try {
                // Expanded Admin Check to include positions
                const isCommittee = ['super_admin', 'admin', 'president', 'vice_president', 'secretary', 'joint_secretary', 'treasurer', 'executive_member', 'coordinator'].includes(effectiveRole) || ['super_admin', 'admin'].includes(role);
                const isFamily = ['family_head', 'member', 'family_member'].includes(role) && !isCommittee;

                let fetchedData = {};

                if (isCommittee) {
                    const [fam, req, fin, not, memReq, comm] = await Promise.all([
                        api.getFamilies().catch(() => ({ data: [] })),
                        api.getAssistanceRequests().catch(() => ({ data: [] })),
                        api.getFinanceStats().catch(() => ({ data: {} })),
                        api.getNotices().catch(() => ({ data: [] })),
                        api.getMemberRequests().catch(() => ({ data: [] })),
                        currentUser?.community_id ? api.getCommunity(currentUser.community_id).catch(() => ({ data: null })) : Promise.resolve({ data: null })
                    ]);
                    fetchedData = {
                        totalMembers: fam.data.reduce((acc, f) => acc + (f.members?.length || 0), 0),
                        activeFamilies: fam.data.length,
                        pendingRequests: req.data.filter(r => r.status === 'Pending').length,
                        totalFunds: fin.data?.total_collected || 0,
                        noticesCount: not.data.length,
                        pendingApprovals: fam.data.filter(f => f.status === 'Pending').length,
                        pendingMemberRequests: memReq.data.length,
                        pendingExpenses: fin.data?.pending_expenses_count || 0,
                        activeCollections: fin.data?.active_collections_breakdown || []
                    };
                    setData({
                        loading: false,
                        stats: fetchedData,
                        notices: not.data || [],
                        family: null,
                        beneficiaries: [],
                        communityInfo: comm.data
                    });
                } else if (isFamily) {
                    const [fam, not, myFin, req, pubFin, bens, comm] = await Promise.all([
                        api.getMyFamily().catch(() => ({ data: { members: [] } })),
                        api.getNotices().catch(() => ({ data: [] })),
                        api.getMyFinanceStats().catch(() => ({ data: { total_contributed: 0 } })),
                        api.getAssistanceRequests().catch(() => ({ data: [] })),
                        api.getFinanceStats().catch(() => ({ data: { total_collected: 0, families_helped: 0 } })),
                        api.getPublicBeneficiaries().catch(() => ({ data: [] })),
                        currentUser?.community_id ? api.getCommunity(currentUser.community_id).catch(() => ({ data: null })) : Promise.resolve({ data: null })
                    ]);
                    fetchedData = {
                        familyMembers: fam.data?.members?.length || 0,
                        contributionPaid: myFin.data?.total_contributed || 0,
                        activeRequests: req.data.length,
                        pendingVerifications: fam.data?.status === 'Approved' ? 0 : 1,
                        totalFundsCollected: pubFin.data?.total_collected || 0,
                        totalFamiliesHelped: pubFin.data?.families_helped || 0,
                        activeCollections: pubFin.data?.active_collections_breakdown || [],
                        monthlyHelpRecipients: pubFin.data?.monthly_help_beneficiaries || 0
                    };
                    setData({
                        loading: false,
                        stats: fetchedData,
                        notices: not.data || [],
                        family: fam.data,
                        beneficiaries: bens.data || [],
                        communityInfo: comm.data
                    });
                    return;
                }

                setData({ loading: false, stats: fetchedData, notices: [], beneficiaries: [] });
            } catch (e) {
                console.error("Dashboard Load Failed", e);
                setData(prev => ({ ...prev, loading: false }));
            }
        };
        load();
    }, [role, effectiveRole, initialData]);

    // --- Navigation Helper ---
    const nav = (tab, extraParams = "") => {
        const segments = window.location.pathname.split('/');
        const basePath = `/${segments[1] || 'admin'}`;
        navigate(`${basePath}/${tab}${extraParams}`);
    };

    // --- Configuration Engine ---
    const LAYOUT_CONFIG = {
        family_head: {
            stats: [
                { label: t.dashboard?.family_head?.stats?.members || 'Registered Family Members', value: data.stats.familyMembers || 0, icon: Users, color: '#3b82f6', bg: '#eff6ff', sub: t.dashboard?.family_head?.stats?.sub?.members },
                { label: t.dashboard?.family_head?.stats?.requests || 'Active Help Requests', value: data.stats.activeRequests || 0, icon: AlertCircle, color: '#dc2626', bg: '#fef2f2', sub: t.dashboard?.family_head?.stats?.sub?.track },
                { label: t.dashboard?.family_head?.stats?.contributions || 'Contributions Given', value: `₹${(data.stats.contributionPaid || 0).toLocaleString()}`, icon: DollarSign, color: '#ec4899', bg: '#fce773', sub: t.dashboard?.family_head?.stats?.sub?.voluntary },
                { label: t.dashboard?.family_head?.stats?.notices || 'Notices from Samiti', value: data.stats.noticesCount || 0, icon: Megaphone, color: '#f55e0b', bg: '#fffbeb', sub: t.dashboard?.family_head?.stats?.sub?.inform }
            ],
            actions: [
                { title: t.dashboard?.family_head?.actions?.register, desc: t.dashboard?.family_head?.actions?.register_desc, btnText: t.dashboard?.family_head?.actions?.register_btn, icon: Plus, color: '#3b82f6', action: () => nav('family') },
                { title: t.dashboard?.family_head?.actions?.emergency, desc: t.dashboard?.family_head?.actions?.emergency_desc, btnText: t.dashboard?.family_head?.actions?.emergency_btn, icon: Shield, color: '#dc2626', action: () => nav('help', '&type=Emergency') },
                { title: t.dashboard?.family_head?.actions?.education, desc: t.dashboard?.family_head?.actions?.education_desc, btnText: t.dashboard?.family_head?.actions?.education_btn, icon: FileText, color: '#059669', action: () => nav('help', '&type=Education') },
                { title: t.dashboard?.family_head?.actions?.women, desc: t.dashboard?.family_head?.actions?.women_desc, btnText: t.dashboard?.family_head?.actions?.women_btn, icon: Users, color: '#d97706', action: () => nav('help', '&type=Support') }
            ],
            extraSection: (
                <div style={{ marginTop: '32px' }}>
                    <div className="premium-card animate-fade" style={{ background: 'linear-gradient(135deg, #fffcf0 0%, #fff 100%)', borderLeft: '5px solid var(--primary)', padding: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '2rem' }}>🎯</div>
                            <h3 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.25rem', fontWeight: 900 }}>Community Vision & Objectives</h3>
                        </div>
                        <div style={{ color: 'var(--secondary)', opacity: 0.9, lineHeight: 1.7, fontSize: '0.95rem' }}>
                            {data.communityInfo?.objectives ? (
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {data.communityInfo.objectives.map((obj, i) => (
                                        <li key={i} style={{ marginBottom: '8px', fontWeight: 600 }}>{obj}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ margin: 0, fontStyle: 'italic', fontWeight: 600 }}>
                                    {t.dashboard?.family_head?.disclaimer_text || "Building a stronger, united community through Seva and Sahyog."}
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                         <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                             Society Code: <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{data.communityInfo?.society_code || '---'}</span> • 
                             Address: <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>{data.communityInfo?.address || 'Satghara, Bihar'}</span>
                         </p>
                    </div>
                </div>
            )
        },
        president: {
            stats: [
                { label: 'Total Members', value: data.stats.totalMembers, icon: Users, color: '#059669', bg: '#ecfdf5', sub: 'Active Community', action: () => nav('family-list') },
                { label: 'Total Families', value: data.stats.activeFamilies, icon: Users, color: '#3b82f6', bg: '#eff6ff', sub: 'Member Units', action: () => nav('family-list') },
                { label: 'Total Funds', value: `₹${data.stats.totalFunds?.toLocaleString()}`, icon: DollarSign, color: '#d97706', bg: '#fffbeb', sub: 'Treasury' },
                { label: 'Pending Approvals', value: data.stats.pendingApprovals, icon: Clock, color: '#dc2626', bg: '#fef2f2' }
            ],
            actions: [
                { title: 'Review Approvals', desc: 'Pending family and request approvals.', btnText: 'Review Cases', icon: FileText, color: '#f59e0b', action: () => nav('families') },
                { title: 'Issue Notice', desc: 'Broadcast a new announcement.', btnText: 'Create Notice', icon: Megaphone, color: '#06b6d4', action: () => nav('notices') },
                { title: 'Election Center', desc: 'Manage democratic processes.', btnText: 'Manage Elections', icon: Users, color: '#3b82f6', action: () => nav('elections') }
            ]
        },
        secretary: {
            stats: [
                { label: 'Total Families', value: data.stats.activeFamilies, icon: Users, color: '#3b82f6', bg: '#eff6ff', sub: 'In Samiti', action: () => nav('family-list') },
                { label: 'Family Approvals', value: data.stats.pendingApprovals, icon: Users, color: '#2563eb', bg: '#eff6ff', sub: 'Pending Review' },
                { label: 'Member Requests', value: data.stats.pendingMemberRequests || 0, icon: Plus, color: '#d97706', bg: '#fffbeb', sub: 'Additions' },
                { label: 'Total Members', value: data.stats.totalMembers, icon: Users, color: '#6366f1', bg: '#e0e7ff', action: () => nav('family-list') }
            ],
            actions: [
                { title: 'Verify Families', desc: 'Scrutinize and verify new applications.', btnText: 'Go to Verification', icon: Shield, color: '#2563eb', action: () => nav('families') },
                { title: 'Draft Minutes', desc: 'Record meeting proceedings.', btnText: 'Write Minutes', icon: FileText, color: '#64748b', action: () => alert('Meeting Minutes Module Coming Soon') },
                { title: 'Publish Notice', desc: 'Send updates to the community.', btnText: 'New Notice', icon: Megaphone, color: '#059669', action: () => nav('notices') }
            ]
        },
        treasurer: {
            stats: [
                { label: 'Total Funds', value: `₹${data.stats.totalFunds?.toLocaleString()}`, icon: DollarSign, color: '#16a34a', bg: '#dcfce7', sub: 'Available Balance' },
                { label: 'Pending Expenses', value: data.stats.pendingExpenses || 0, icon: AlertCircle, color: '#dc2626', bg: '#fef2f2', sub: 'To Approve' },
                { label: 'Families Helped', value: data.stats.activeFamilies ? Math.floor(data.stats.activeFamilies * 0.1) : 0, icon: Shield, color: '#2563eb', bg: '#eff6ff', sub: 'Est. Beneficiaries' }, // Mock est
                { label: 'Collections', value: 'Active', icon: TrendingUp, color: '#d97706', bg: '#fffbeb' }
            ],
            actions: [
                { title: 'Approve Expenses', desc: 'Review and approve submitted bills.', btnText: 'Review Expenses', icon: Wallet, color: '#dc2626', action: () => nav('funds') },
                { title: 'Lekha Jokha', desc: 'View detailed financial reports.', btnText: 'View Accounts', icon: FileText, color: '#16a34a', action: () => nav('accounts') },
                { title: 'Record Offset', desc: 'Manually record offline contribution.', btnText: 'Add Record', icon: Plus, color: '#64748b', action: () => nav('contributions') }
            ]
        },
        executive_member: {
            stats: [
                { label: 'Total Members', value: data.stats.totalMembers, icon: Users, color: '#6366f1', bg: '#e0e7ff' },
                { label: 'Active Projects', value: 2, icon: TrendingUp, color: '#d97706', bg: '#fffbeb', sub: 'Community Works' },
                { label: 'Upcoming Events', value: 1, icon: Clock, color: '#059669', bg: '#ecfdf5', sub: 'Next: Annual Meet' }
            ],
            actions: [
                { title: 'View Assignments', desc: 'Check families assigned to you.', btnText: 'My Zone', icon: Users, color: '#6366f1', action: () => nav('families') },
                { title: 'Submit Report', desc: 'Submit field report for your zone.', btnText: 'Write Report', icon: FileText, color: '#d97706', action: () => alert('Reporting Module Coming Soon') }
            ]
        },
        coordinator: {
            stats: [
                { label: 'Pending Verifications', value: data.stats.pendingApprovals, icon: Shield, color: '#d97706', bg: '#fffbeb', sub: 'High Priority' },
                { label: 'Total Members', value: data.stats.totalMembers, icon: Users, color: '#6366f1', bg: '#e0e7ff' },
            ],
            actions: [
                { title: 'Verify Applications', desc: 'Scrutinize new family applications.', btnText: 'Start Verification', icon: Shield, color: '#d97706', action: () => nav('families') }
            ]
        },
        // Fallback
        default: {
            stats: [
                { label: 'Total Members', value: data.stats.totalMembers || 0, icon: Users, color: '#6366f1', bg: '#e0e7ff' },
                { label: 'Active Families', value: data.stats.activeFamilies || 0, icon: Users, color: '#ec4899', bg: '#fce7f3' },
                { label: 'Pending', value: data.stats.pendingRequests || 0, icon: Clock, color: '#eab308', bg: '#fef9c3' }
            ],
            actions: [
                { title: 'Family Registry', desc: 'Manage member database.', btnText: 'View Families', icon: Users, color: '#6366f1', action: () => nav('families') },
                { title: 'Help Requests', desc: 'Handle help requests.', btnText: 'View Requests', icon: Shield, color: '#ec4899', action: () => nav('requests') }
            ]
        }
    };

    // Alias mappings
    LAYOUT_CONFIG.vice_president = LAYOUT_CONFIG.president;
    LAYOUT_CONFIG.joint_secretary = LAYOUT_CONFIG.secretary;
    LAYOUT_CONFIG.admin = LAYOUT_CONFIG.president;
    LAYOUT_CONFIG.super_admin = LAYOUT_CONFIG.president;


    const currentConfig = LAYOUT_CONFIG[effectiveRole] || LAYOUT_CONFIG.default;

    if (data.loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading Dashboard Intelligence...</div>;

    return (
        <div style={{ width: '100%', animation: 'fadeIn 0.5s ease' }}>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', marginBottom: '30px' }}>
                {currentConfig.stats.map((stat, i) => (
                    <div key={i} style={{ gridColumn: isMobile ? 'span 12' : 'span 3' }}>
                        <SmartStatCard
                            icon={stat.icon}
                            label={stat.label}
                            value={stat.value}
                            subLabel={stat.sub}
                            colorClass={stat.color}
                            bgClass={stat.bg}
                            onClick={stat.action}
                        />
                    </div>
                ))}
            </div>

            {/* Active Collections / Fund Raising Status */}
            {(data.stats.activeCollections?.length > 0) && (
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Outfit', sans-serif" }}>
                        <span style={{ width: '4px', height: '24px', background: '#d97706', borderRadius: '4px' }}></span>
                        Current Fund Raising & Collections (This Month)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>
                        {data.stats.activeCollections.map((col, idx) => (
                            <div key={idx} style={{ gridColumn: isMobile ? 'span 12' : 'span 4', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#fffbeb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{col.type}</div>
                                    <div style={{ fontSize: '1.4rem', color: '#1e293b', fontWeight: 800 }}>₹{col.amount?.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Cards / Action Center */}
            <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Outfit', sans-serif" }}>
                    <span style={{ width: '4px', height: '24px', background: '#3b82f6', borderRadius: '4px' }}></span>
                    Action Center
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', marginBottom: '30px' }}>
                    {currentConfig.actions.map((action, i) => (
                        <div key={i} style={{ gridColumn: isMobile ? 'span 12' : 'span 4' }}>
                            <SmartActionCard
                                icon={action.icon}
                                title={action.title}
                                description={action.desc}
                                btnText={action.btnText}
                                btnColor={action.color}
                                onClick={action.action}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Extra Section (e.g. Disclaimer for Family) */}
            {currentConfig.extraSection}

            {/* Public Beneficiary List - Show for everyone to see impact */}
            {data.beneficiaries?.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Outfit', sans-serif" }}>
                        <span style={{ width: '4px', height: '24px', background: '#10b981', borderRadius: '4px' }}></span>
                        Community Impact - Recent Help Provided
                    </h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Beneficiary Family</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Assistance Type</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.beneficiaries.map((b, idx) => (
                                    <tr key={b.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '15px', fontWeight: 600, color: '#334155' }}>{b.name}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>{b.type}</span>
                                        </td>
                                        <td style={{ padding: '15px', color: '#059669', fontWeight: 700 }}>₹{b.amount?.toLocaleString()}</td>
                                        <td style={{ padding: '15px', color: '#64748b', fontSize: '0.9rem' }}>{b.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Dynamic Style Injection for Animations */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default DashboardOverview;
