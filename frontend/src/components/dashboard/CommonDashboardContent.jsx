import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import RulesManager from '../RulesManager';
import { useTheme } from '../../context/ThemeContext';
import {
    User, Settings, Palette, Shield, Lock, Smartphone, Mail, Hash,
    Check, X, RefreshCw, Type, Maximize2, Camera, LogOut, Clock,
    Languages, FileText, Bell, ShieldCheck, CreditCard,
    DollarSign, Users, Activity, BarChart3, HelpCircle, ChevronRight
} from 'lucide-react';

const CommonDashboardContent = ({ activeTab, role, user, formOptions, familyData, refreshData }) => {

    // Theme Context
    const {
        themeMode, setThemeMode,
        primaryColor, setPrimaryColor,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        colorPalettes, fontOptions
    } = useTheme();

    const resolveUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://127.0.0.1:8000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    // State

    const [financeStats, setFinanceStats] = useState(null);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ payment_type: '', start_date: '', end_date: '' });

    const [accountOverview, setAccountOverview] = useState(null);
    const [expensesList, setExpensesList] = useState([]);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ category: 'Medical Help', amount: '', description: '' });
    const [auditLogs, setAuditLogs] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [users, setUsers] = useState([]);
    const [roleLogs, setRoleLogs] = useState([]);
    const [committeeCommunityFilter, setCommitteeCommunityFilter] = useState('all');
    const [communitiesList, setCommunitiesList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [pendingRoleChange, setPendingRoleChange] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Nominee State
    const [nomineeForm, setNomineeForm] = useState({
        full_name: '', relation: '', relation_other: '', mobile: '', dob: '', share_percentage: '', is_family_member: false, selected_member_id: ''
    });
    const [isNomineeModalOpen, setIsNomineeModalOpen] = useState(false);
    const [nomineeDetails, setNomineeDetails] = useState({ nominees: [], emergency_name: '', emergency_mobile: '' });
    const [editingNomineeIndex, setEditingNomineeIndex] = useState(-1);

    // Election State
    const [activeElections, setActiveElections] = useState([]);
    const [committeeHistory, setCommitteeHistory] = useState([]);
    const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
    const AVAILABLE_POSTS = [
        { id: 'president', label: 'President (अध्यक्ष)', defaultSeats: 1 },
        { id: 'vice_president', label: 'Vice President (उपाध्यक्ष)', defaultSeats: 1 },
        { id: 'secretary', label: 'Secretary (सचिव)', defaultSeats: 1 },
        { id: 'treasurer', label: 'Treasurer (कोषाध्यक्ष)', defaultSeats: 1 },
        { id: 'executive_member', label: 'Executive Member', defaultSeats: 5 },
        { id: 'coordinator', label: 'Coordinator (समन्वयक)', defaultSeats: 10 },
    ];

    const [electionForm, setElectionForm] = useState({
        title: '', description: '', start_date: '', end_date: '',
        posts: [] // Start with empty, let user select
    });
    const [votingSelections, setVotingSelections] = useState({}); // { post_id: candidate_id }
    const [isSubmittingVote, setIsSubmittingVote] = useState(false);

    const isCommittee = ['super_admin', 'president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator', 'committee_member'].includes(role);

    // Governance State
    const [activeStrikes, setActiveStrikes] = useState([]);
    const [committeePerformance, setCommitteePerformance] = useState([]);
    const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);
    const [strikeForm, setStrikeForm] = useState({ target_user_id: '', reason: '' });
    const [ratingForm, setRatingForm] = useState({ target_user_id: '', stars: 5, feedback: '' });
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [isUpdatingPw, setIsUpdatingPw] = useState(false);

    // Campaign & Proof State
    const [campaigns, setCampaigns] = useState([]);
    const [approvedAssistance, setApprovedAssistance] = useState([]);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [campaignForm, setCampaignForm] = useState({
        assistance_request_id: '', title: '', description: '', target_amount: '', upi_id: 'samiti@upi', account_holder: 'Sanatan Swabhiman Samiti'
    });
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [proofForm, setProofForm] = useState({ amount: '', screenshot_url: '', transaction_id: '', remarks: '' });
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    
    // Administrative Permissions
    const canEditFinance = ['super_admin', 'president', 'treasurer', 'admin'].includes(role);
    const canAddExpense = ['super_admin', 'treasurer', 'president', 'secretary'].includes(role) || user?.position === 'treasurer';
    const canApproveExpense = ['super_admin', 'president'].includes(role);
    const canPostNotice = ['super_admin', 'secretary', 'president', 'coordinator'].includes(role);
    const canManageRules = ['super_admin', 'secretary', 'president', 'admin'].includes(role);
    const canApproveMember = ['super_admin', 'secretary', 'president', 'admin'].includes(role);

    // Notification System
    const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const notify = (message, type = 'success') => setNotification({ message, type });

    // Fetch Finance Stats & Beneficiaries
    useEffect(() => {
        if (activeTab === 'funds') {
            setLoading(true);
            Promise.all([
                api.getFinanceStats().catch(e => ({ data: null })),
                api.getPublicBeneficiaries().catch(e => ({ data: [] }))
            ]).then(([statsRes, benRes]) => {
                setFinanceStats(statsRes.data);
                setBeneficiaries(benRes.data || []);
            }).finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Fetch Contributions
    useEffect(() => {
        if (activeTab === 'contributions') {
            setLoading(true);
            const params = {};
            if (filters.payment_type) params.payment_type = filters.payment_type;
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;

            api.getFinanceContributions(params)
                .then(res => setContributions(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activeTab, filters]);

    // Fetch Accounts Data
    useEffect(() => {
        if (activeTab === 'accounts') {
            setLoading(true);
            Promise.all([
                api.getAccountOverview(),
                api.getExpenses()
            ])
                .then(([overviewRes, expensesRes]) => {
                    setAccountOverview(overviewRes.data);
                    setExpensesList(expensesRes.data);
                })
                .catch(err => console.error("Error fetching accounts", err))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Fetch Audit Logs
    useEffect(() => {
        if (activeTab === 'audit') {
            setLoading(true);
            api.getAuditLogs()
                .then(res => setAuditLogs(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Fetch Inquiries
    useEffect(() => {
        if (activeTab === 'inquiries') {
            setLoading(true);
            api.getInquiries()
                .then(res => setInquiries(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Sync Nominee Data
    useEffect(() => {
        if (activeTab === 'nominee') {
            if (familyData?.nominee_details) {
                setNomineeDetails(familyData.nominee_details);
            } else {
                setNomineeDetails({ nominees: [], emergency_name: '', emergency_mobile: '' });
            }
        }
    }, [activeTab, familyData]);

    // Fetch Role Management Data
    useEffect(() => {
        if (activeTab === 'roles' || activeTab === 'committee-members') {
            setLoading(true);
            Promise.all([
                api.getUsers(committeeCommunityFilter),
                api.getRoleLogs(),
                api.getCommunities().catch(() => ({ data: [] }))
            ])
                .then(([userRes, logRes, commRes]) => {
                    setUsers(userRes.data);
                    setRoleLogs(logRes.data);
                    setCommunitiesList(commRes.data);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activeTab, committeeCommunityFilter]);

    // Fetch Elections
    useEffect(() => {
        if (activeTab === 'elections') {
            setLoading(true);
            api.getActiveElections()
                .then(res => setActiveElections(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Fetch History
    useEffect(() => {
        if (activeTab === 'history') {
            setLoading(true);
            api.getCommitteeHistory()
                .then(res => setCommitteeHistory(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Fetch Governance and Performance for relevant tabs
    useEffect(() => {
        if (activeTab === 'governance' || activeTab === 'history' || activeTab === 'elections') {
            // Only set loading if it's the primary fetch for the tab
            if (activeTab !== 'governance') setLoading(true);
            api.getAllCommitteePerformance()
                .then(res => setCommitteePerformance(res.data))
                .catch(err => console.error(err))
                .finally(() => {
                    if (activeTab !== 'governance') setLoading(false);
                });
        }

        if (activeTab === 'governance') {
            setLoading(true);
            api.getActiveStrikes()
                .then(res => setActiveStrikes(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);





    const handlePasswordVerify = async (e) => {
        e.preventDefault();
        try {
            await api.verifyPassword(confirmPassword);
            // If success, proceed
            if (pendingRoleChange) {
                await api.updateUserRole(pendingRoleChange.userId, pendingRoleChange.newRole);
                notify("Role updated successfully!");
                api.getUsers().then(res => setUsers(res.data));
            }
            setIsPasswordModalOpen(false);
            setPendingRoleChange(null);
            setConfirmPassword('');
        } catch (err) {
            notify("Invalid password. Access denied.", "error");
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.createExpense(expenseForm);
            alert("Expense added successfully for approval!");
            setIsExpenseModalOpen(false);
            setExpenseForm({ category: 'Medical Help', amount: '', description: '' });
            // Refresh list
            const res = await api.getExpenses();
            setExpensesList(res.data);
        } catch (err) {
            alert("Failed to add expense");
        }
    };

    const handleApproveExpense = async (id) => {
        try {
            await api.approveExpense(id);
            alert("Expense approved!");
            // Refresh
            const [overviewRes, expensesRes] = await Promise.all([api.getAccountOverview(), api.getExpenses()]);
            setAccountOverview(overviewRes.data);
            setExpensesList(expensesRes.data);
        } catch (err) {
            alert("Failed to approve");
        }
    };

    useEffect(() => {
        if (activeTab === 'global-collections') {
            setLoading(true);
            const isTreasurer = role === 'admin' || user?.position === 'treasurer';

            const promises = [api.getCampaigns()];
            if (isTreasurer) promises.push(api.getApprovedAssistance());

            Promise.all(promises)
                .then(([cRes, aRes]) => {
                    setCampaigns(cRes.data || []);
                    if (aRes) setApprovedAssistance(aRes.data || []);
                })
                .catch(e => notify('Error loading collection data', 'error'))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    const handleDownloadCSV = () => {
        if (!contributions.length) return;
        const headers = ["ID", "Date", "Family Name", "Type", "Amount"];
        const rows = contributions.map(c => [c.id, c.date, `"${c.family_name}"`, c.type, c.amount]); // Quote name for safety

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "contributions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStartCampaign = async (e) => {
        e.preventDefault();
        try {
            await api.createCampaign(campaignForm);
            setIsCampaignModalOpen(false);
            notify('Campaign started successfully!');
            // Refresh
            const cRes = await api.getCampaigns();
            setCampaigns(cRes.data);
            const aRes = await api.getApprovedAssistance();
            setApprovedAssistance(aRes.data);
        } catch (e) {
            notify('Failed to start campaign', 'error');
        }
    };

    const handleProofUpload = async (file) => {
        setIsUploadingProof(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.uploadFile(formData);
            setProofForm({ ...proofForm, screenshot_url: res.data.url });
            notify('Screenshot uploaded!');
        } catch (e) {
            notify('Upload failed', 'error');
        } finally {
            setIsUploadingProof(false);
        }
    };

    const handleSubmitProof = async (e) => {
        e.preventDefault();
        if (!proofForm.screenshot_url) return notify('Please upload proof first', 'error');
        try {
            await api.submitCampaignProof(selectedCampaign.id || selectedCampaign._id, proofForm);
            setIsProofModalOpen(false);
            setProofForm({ amount: '', screenshot_url: '', transaction_id: '', remarks: '' });
            notify('Contribution proof submitted successfully!');
        } catch (e) {
            notify('Failed to submit proof', 'error');
        }
    };

    const renderFunds = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.02em' }}>Financial Ecosystem</h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Real-time transparency and community impact tracking.</p>
                </div>
                {canEditFinance && (
                    <button className="premium-btn shadow-premium" style={{ borderRadius: '12px', padding: '12px 24px' }}>
                        <Settings size={18} /> Manage Funds
                    </button>
                )}
            </div>

            {loading && !financeStats ? (
                <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}></div>
                    Syncing Treasury Data...
                </div>
            ) : (
                <>
                    {/* Primary Engagement Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        <div className="premium-card animate-slide-up" style={{ padding: '32px', background: 'white', borderLeft: '6px solid #3b82f6' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                 <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                     <Users size={24} />
                                 </div>
                                 <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>Verified Units</span>
                             </div>
                             <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--secondary)', letterSpacing: '-0.03em' }}>{financeStats?.total_families || 0}</div>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>Registered Families</div>
                        </div>

                        <div className="premium-card animate-slide-up" style={{ padding: '32px', background: 'white', borderLeft: '6px solid var(--primary)', animationDelay: '0.1s' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                 <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                     <Activity size={24} />
                                 </div>
                                 <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>Active Soul</span>
                             </div>
                             <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--secondary)', letterSpacing: '-0.03em' }}>{financeStats?.total_members || 0}</div>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>Community Members</div>
                        </div>
                    </div>

                    {/* Financial Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        <div className="premium-card" style={{ padding: '24px', background: 'linear-gradient(135deg, white 0%, #f0fff4 100%)', border: '1px solid #c6f6d5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#c6f6d5', color: '#2f855a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={18} /></div>
                                <span style={{ color: '#2f855a', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Funds Seeded</span>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a4731' }}>₹{financeStats?.total_collected?.toLocaleString() ?? 0}</div>
                        </div>

                        <div className="premium-card" style={{ padding: '24px', background: 'linear-gradient(135deg, white 0%, #ebf8ff 100%)', border: '1px solid #bee3f8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#bee3f8', color: '#2b6cb0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={18} /></div>
                                <span style={{ color: '#2b6cb0', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Selfless Distribution</span>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2a4365' }}>₹{financeStats?.total_assistance_given?.toLocaleString() ?? 0}</div>
                        </div>

                        <div className="premium-card" style={{ padding: '24px', background: 'linear-gradient(135deg, white 0%, #fffaf0 100%)', border: '1px solid #feebc8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#feebc8', color: '#c05621', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} /></div>
                                <span style={{ color: '#c05621', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Families Empowered</span>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#7b341e' }}>{financeStats?.families_helped ?? 0}</div>
                        </div>
                    </div>

                    {/* Beneficiaries Table */}
                    <div className="premium-card" style={{ padding: '32px', background: 'white', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--secondary)', fontWeight: 900 }}>Seva Impact Record</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, background: 'var(--bg-page)', padding: '6px 12px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Public Transparency Log</span>
                        </div>
                        <div style={{ overflowX: 'auto', margin: '0 -32px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <th style={{ padding: '16px 32px' }}>Beneficiary Unit</th>
                                        <th style={{ padding: '16px 32px' }}>Assistance vertical</th>
                                        <th style={{ padding: '16px 32px' }}>Empowerment Amount</th>
                                        <th style={{ padding: '16px 32px' }}>Execution Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {beneficiaries.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No selfless service records found.</td></tr>
                                    ) : (
                                        beneficiaries.map((b, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '20px 32px', fontWeight: 900, color: 'var(--secondary)' }}>{b.name}</td>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <span style={{ padding: '6px 14px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>{b.type}</span>
                                                </td>
                                                <td style={{ padding: '20px 32px', fontWeight: 950, color: 'var(--danger)', fontSize: '1.1rem' }}>₹{b.amount?.toLocaleString()}</td>
                                                <td style={{ padding: '20px 32px', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(b.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="premium-card" style={{ padding: '32px', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                             <BarChart3 size={24} color="var(--primary)" />
                             <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--secondary)', fontWeight: 900 }}>Resource Growth Index</h4>
                        </div>
                        <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '32px', padding: '20px 0', borderBottom: '2.5px solid var(--border-color)', margin: '0 20px' }}>
                            {financeStats?.monthly_data?.map((item, idx) => {
                                const maxVal = Math.max(...financeStats.monthly_data.map(d => d.collected)) || 1;
                                const height = (item.collected / maxVal) * 180;
                                return (
                                    <div key={idx} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                                        <div
                                            className="animate-slide-up"
                                            style={{
                                                height: `${height}px`,
                                                background: 'linear-gradient(to top, var(--primary) 0%, var(--primary-dark) 100%)',
                                                borderRadius: '10px 10px 0 0',
                                                margin: '0 auto',
                                                width: '100%',
                                                maxWidth: '56px',
                                                boxShadow: '0 8px 24px var(--primary-glow)',
                                                animationDelay: `${idx * 0.05}s`
                                            }}
                                            title={`₹${item.collected}`}
                                        ></div>
                                        <div style={{ position: 'absolute', bottom: '-40px', left: 0, right: 0, fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 900, textTransform: 'uppercase' }}>{item.month}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', padding: '24px', background: 'var(--bg-hover)', borderRadius: '20px', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '2.5rem' }}>💠</div>
                        <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 700 }}>
                            All financial data and beneficiary records are audited by the committee and made transparently available to every registered family head of <strong>{user?.community_name || 'Sanatan Swabhiman Samiti'}</strong>. 
                            We believe in absolute transparency as the foundation of Seva.
                        </p>
                    </div>
                </>
            )}
        </div>
    );

    const renderContributions = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.5rem', fontWeight: 900 }}>Contribution Audit</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleDownloadCSV} className="premium-btn shadow-premium" style={{ padding: '10px 20px', background: 'var(--secondary)' }}>
                        <Lock size={16} /> Export CSV
                    </button>
                    {canEditFinance && (
                        <button className="premium-btn shadow-premium" style={{ padding: '10px 20px' }}>
                            + New Entry
                        </button>
                    )}
                </div>
            </div>

            <div className="premium-card shadow-premium" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '20px', background: 'white' }}>
                <select
                    className="premium-input-field"
                    style={{ flex: 1, minWidth: '180px', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
                    value={filters.payment_type}
                    onChange={e => setFilters({ ...filters, payment_type: e.target.value })}
                >
                    <option value="">All Streams</option>
                    <option value="Monthly">Monthly Seva</option>
                    <option value="Donation">One-time Donation</option>
                    <option value="Event">Event Support</option>
                </select>

                <input
                    type="date"
                    className="premium-input-field"
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
                    value={filters.start_date}
                    onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                />

                <input
                    type="date"
                    className="premium-input-field"
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
                    value={filters.end_date}
                    onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                />

                <button
                    onClick={() => setFilters({ payment_type: '', start_date: '', end_date: '' })}
                    style={{ padding: '0 24px', background: 'var(--bg-hover)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, color: 'var(--secondary)' }}
                >
                    Reset
                </button>
            </div>

            {loading && contributions.length === 0 ? (
                <div className="premium-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Synching history...</div>
            ) : (
                <div className="premium-card shadow-premium" style={{ background: 'white', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ padding: '16px 24px' }}>Timeline</th>
                                    <th style={{ padding: '16px 24px' }}>Entity Source</th>
                                    <th style={{ padding: '16px 24px' }}>Vertical</th>
                                    <th style={{ padding: '16px 24px' }}>Corpus Contribution</th>
                                    <th style={{ padding: '16px 24px' }}>Audit ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contributions.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No contribution history found.</td></tr>
                                ) : (
                                    contributions.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>{c.date}</td>
                                            <td style={{ padding: '16px 24px', fontWeight: 900, color: 'var(--secondary)' }}>{c.family_name}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ padding: '4px 10px', background: 'var(--bg-hover)', color: 'var(--secondary)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>{c.type}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 950, color: 'var(--success)' }}>₹{c.amount}</td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{c.id}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAccounts = () => {
        const stats = accountOverview || { opening_balance: 0, total_monthly_collection: 0, total_expenses: 0, closing_balance: 0, expense_breakdown: [] };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* 1. Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                    <div className="premium-card" style={{ padding: '32px', background: 'white', borderTop: '6px solid var(--primary-blue)' }}>
                        <small style={{ color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Opening Corpus</small>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--secondary)', marginTop: '8px', letterSpacing: '-0.03em' }}>₹{stats.opening_balance?.toLocaleString()}</div>
                    </div>
                    <div className="premium-card" style={{ padding: '32px', background: 'white', borderTop: '6px solid var(--success)' }}>
                        <small style={{ color: 'var(--success)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Inward Flow</small>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--success)', marginTop: '8px', letterSpacing: '-0.03em' }}>+ ₹{stats.total_monthly_collection?.toLocaleString()}</div>
                    </div>
                    <div className="premium-card" style={{ padding: '32px', background: 'white', borderTop: '6px solid var(--danger)' }}>
                        <small style={{ color: 'var(--danger)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Outward Flow</small>
                        <div style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--danger)', marginTop: '8px', letterSpacing: '-0.03em' }}>- ₹{stats.total_expenses?.toLocaleString()}</div>
                    </div>
                    <div className="premium-card" style={{ padding: '32px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white' }}>
                        <small style={{ opacity: 0.9, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Current Liquidity</small>
                        <div style={{ fontSize: '2.5rem', fontWeight: 950, marginTop: '8px', letterSpacing: '-0.03em' }}>₹{stats.closing_balance?.toLocaleString()}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="premium-card" style={{ padding: '32px', background: 'white' }}>
                            <h4 style={{ margin: '0 0 24px 0', color: 'var(--secondary)', fontSize: '1.25rem', fontWeight: 950 }}>Corpus Flow Efficiency</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-page)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></div>
                                        <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>Aggregate Seva Funds</span>
                                    </div>
                                    <span style={{ color: 'var(--success)', fontWeight: 950, fontSize: '1.2rem' }}>₹{stats.total_collected?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-page)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }}></div>
                                        <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>Disbursed Assistance</span>
                                    </div>
                                    <span style={{ color: 'var(--danger)', fontWeight: 950, fontSize: '1.2rem' }}>₹{stats.total_expenses?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: 'var(--primary-blue)', borderRadius: '16px', color: 'white', boxShadow: '0 12px 24px rgba(59,130,246,0.3)' }}>
                                    <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>Net Available Balance</span>
                                    <span style={{ fontWeight: 950, fontSize: '1.5rem' }}>₹{(stats.total_collected - stats.total_expenses)?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="premium-card" style={{ padding: '32px', background: 'white' }}>
                            <h4 style={{ margin: '0 0 24px 0', color: 'var(--secondary)', fontSize: '1.25rem', fontWeight: 950 }}>Distribution Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {stats.expense_breakdown?.map((ex, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <small style={{ fontWeight: 900, color: 'var(--secondary)', fontSize: '0.85rem' }}>{ex.category}</small>
                                            <small style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.85rem' }}>₹{ex.amount?.toLocaleString()}</small>
                                        </div>
                                        <div style={{ width: '100%', height: '12px', background: 'var(--bg-page)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                            <div style={{ width: `${(ex.amount / (stats.total_expenses || 1)) * 100}%`, height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)', borderRadius: '20px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* 4. Detailed Ledger */}
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.4rem' }}>📜</span> Transaction Ledger
                            </h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {canAddExpense && (
                                    <button
                                        onClick={() => setIsExpenseModalOpen(true)}
                                        style={{ padding: '10px 20px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        + Add Expense
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <th style={{ padding: '16px' }}>Date</th>
                                        <th style={{ padding: '16px' }}>Category</th>
                                        <th style={{ padding: '16px' }}>Description</th>
                                        <th style={{ padding: '16px' }}>Amount</th>
                                        <th style={{ padding: '16px' }}>Status</th>
                                        <th style={{ padding: '16px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expensesList.map((exp, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(exp.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ padding: '4px 10px', background: 'var(--bg-page)', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>{exp.category}</span>
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-main)', maxWidth: '250px' }}>{exp.description}</td>
                                            <td style={{ padding: '16px', fontWeight: 800, color: 'var(--danger)' }}>₹ {exp.amount?.toLocaleString()}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    background: exp.status === 'Approved' ? '#DEF7EC' : '#FEF3C7',
                                                    color: exp.status === 'Approved' ? '#03543F' : '#92400E'
                                                }}>
                                                    {exp.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {exp.status === 'Pending' && canApproveExpense && (
                                                    <button
                                                        onClick={() => handleApproveExpense(exp.id)}
                                                        style={{ padding: '6px 14px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Expense Modal (Updated) */}
                {isExpenseModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '20px', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                            <h3 style={{ marginBottom: '25px', color: 'var(--text-main)' }}>Record New Expense</h3>
                            <form onSubmit={handleAddExpense}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>Expense Category</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}
                                        value={expenseForm.category}
                                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    >
                                        <option value="Medical Help">Medical Help</option>
                                        <option value="Emergency Help">Emergency Help</option>
                                        <option value="Event">Event Expense</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>Amount (₹)</label>
                                    <input
                                        type="number" required
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>Purpose / Remarks</label>
                                    <textarea
                                        required
                                        style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}
                                        value={expenseForm.description}
                                        onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setIsExpenseModalOpen(false)} style={{ padding: '12px 25px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" style={{ padding: '12px 25px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Save Record</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const [noticesList, setNoticesList] = useState([]);
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [noticeFilter, setNoticeFilter] = useState('all');
    const [noticeForm, setNoticeForm] = useState({
        title: '',
        content: '',
        category: 'General',
        priority: 'normal',
        type: 'info',
        visible_to: ['all'],
        is_active: true,
        scheduled_at: null
    });

    useEffect(() => {
        if (activeTab === 'notices' || activeTab === 'notice-management') {
            setLoading(true);
            api.getNotices(noticeFilter)
                .then(res => setNoticesList(res.data))
                .catch(err => console.error("Error fetching notices", err))
                .finally(() => setLoading(false));
        }
    }, [activeTab, noticeFilter]);

    const handleCreateNotice = async (e) => {
        e.preventDefault();
        try {
            if (editingNotice) {
                await api.updateNotice(editingNotice._id || editingNotice.id, noticeForm);
                notify("Notice updated successfully!");
            } else {
                await api.createNotice(noticeForm);
                notify("Notice posted successfully!");
            }
            setIsNoticeModalOpen(false);
            setEditingNotice(null);
            setNoticeForm({ title: '', content: '', category: 'General', priority: 'normal', type: 'info', visible_to: ['all'], is_active: true });
            const res = await api.getNotices();
            setNoticesList(res.data);
        } catch (err) {
            notify("Failed to save notice", "error");
        }
    };

    const handleDeleteNotice = async (id) => {
        if (!window.confirm("Are you sure you want to delete this notice?")) return;
        try {
            await api.deleteNotice(id);
            notify("Notice deleted");
            setNoticesList(noticesList.filter(n => (n._id || n.id) !== id));
        } catch (err) {
            notify("Failed to delete", "error");
        }
    };

    const toggleNoticeStatus = async (notice) => {
        try {
            const updated = { ...notice, is_active: !notice.is_active };
            await api.updateNotice(notice._id || notice.id, updated);
            setNoticesList(noticesList.map(n => (n._id || n.id) === (notice._id || notice.id) ? updated : n));
            notify(`Notice ${updated.is_active ? 'Activated' : 'Hidden'}`);
        } catch (err) {
            notify("Failed to toggle status", "error");
        }
    };

    const renderNotices = () => {
        const getTypeStyles = (type) => {
            switch (type) {
                case 'success': return { bg: '#ecfdf5', color: '#059669', border: '#10b981', icon: '✅' };
                case 'warning': return { bg: '#fffbeb', color: '#d97706', border: '#f59e0b', icon: '⚠️' };
                case 'danger': return { bg: '#fef2f2', color: '#dc2626', border: '#ef4444', icon: '🚨' };
                case 'info':
                default: return { bg: '#eff6ff', color: '#2563eb', border: '#3b82f6', icon: 'ℹ️' };
            }
        };

        return (
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '2rem' }}>📢</span> {activeTab === 'notice-management' ? 'Notice Management' : 'Community Notices'}
                        </h2>
                        <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            {activeTab === 'notice-management' ? 'Issue and manage organizational announcements.' : 'Important announcements and updates from the committee.'}
                        </p>
                    </div>
                    {activeTab === 'notice-management' && isCommittee && (
                        <button
                            onClick={() => {
                                setEditingNotice(null);
                                setNoticeForm({ title: '', content: '', category: 'General', priority: 'normal', type: 'info', visible_to: ['all'], is_active: true, scheduled_at: null });
                                setIsNoticeModalOpen(true);
                            }}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                                transition: 'transform 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span>➕</span> Create New Notice
                        </button>
                    )}
                </div>

                {activeTab === 'notice-management' && (
                    <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: '#f8fafc',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>⚖️</span>
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Your Management Rights: {user?.position?.replace(/_/g, ' ') || user?.role}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                            {[
                                { label: 'Issue Global Community Notices', active: canPostNotice },
                                { label: 'Edit & Manage Member Announcements', active: canPostNotice },
                                { label: 'Schedule Future Notice Releases', active: true },
                                { label: 'Target Specific Committee Branches', active: isCommittee },
                                { label: 'Set Emergency/Urgent Priority', active: canPostNotice },
                                { label: 'Audit Notice Read Statistics', active: ['super_admin', 'secretary'].includes(role) || ['super_admin', 'secretary'].includes(user?.position) }
                            ].map((right, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: right.active ? '#334155' : '#94a3b8' }}>
                                    <span style={{ color: right.active ? '#10b981' : '#cbd5e1' }}>{right.active ? '✅' : '🚫'}</span>
                                    <span style={{ fontWeight: 500 }}>{right.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px', padding: '15px', background: 'var(--bg-page)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    {[
                        { id: 'all', label: 'All Notices', icon: '🌐' },
                        { id: 'global', label: 'Global Only', icon: '🌍' },
                        { id: 'committee', label: 'Committee Only', icon: '🏛️', committeeOnly: true },
                        { id: 'president', label: 'Presidential', icon: '🔱', committeeOnly: true },
                        { id: 'secretary', label: 'Secretariat', icon: '✍️', committeeOnly: true },
                        { id: 'treasurer', label: 'Treasury', icon: '💰', committeeOnly: true }
                    ].filter(f => activeTab === 'notice-management' ? (!f.committeeOnly || isCommittee) : !f.committeeOnly).map(f => (
                        <button
                            key={f.id}
                            onClick={() => setNoticeFilter(f.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                                background: noticeFilter === f.id ? 'var(--primary-blue)' : 'white',
                                color: noticeFilter === f.id ? 'white' : 'var(--text-main)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                                transition: 'all 0.2s', boxShadow: noticeFilter === f.id ? '0 4px 10px rgba(37, 99, 235, 0.2)' : 'none'
                            }}
                        >
                            <span>{f.icon}</span> {f.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: '25px' }}>
                    {loading && noticesList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <div className="spinner" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '15px', color: 'var(--text-muted)' }}>Synchronizing announcements...</p>
                        </div>
                    ) : (
                        noticesList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📬</div>
                                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>No Notices Yet</h3>
                                <p style={{ color: 'var(--text-muted)' }}>The bulletin board is currently empty.</p>
                            </div>
                        ) :
                            noticesList.map(notice => {
                                const styles = getTypeStyles(notice.type);
                                const isUrgent = notice.priority === 'urgent' || notice.priority === 'emergency';

                                return (
                                    <div
                                        key={notice.id || notice._id}
                                        style={{
                                            padding: '0',
                                            borderRadius: '20px',
                                            background: 'var(--bg-card)',
                                            boxShadow: isUrgent ? '0 10px 30px rgba(239, 68, 68, 0.1)' : 'var(--shadow)',
                                            border: `1px solid ${isUrgent ? '#fee2e2' : 'var(--border-color)'}`,
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease',
                                            opacity: notice.is_active ? 1 : 0.6,
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            height: '6px',
                                            background: isUrgent ? 'linear-gradient(90deg, #ef4444, #f59e0b)' : styles.border,
                                            width: '100%'
                                        }} />

                                        <div style={{ padding: '30px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                                    <div style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '14px',
                                                        background: styles.bg,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.5rem',
                                                        border: `1px solid ${styles.border}20`
                                                    }}>
                                                        {notice.icon || styles.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                background: styles.bg,
                                                                color: styles.color,
                                                                border: `1px solid ${styles.border}40`
                                                            }}>
                                                                {notice.category}
                                                            </span>
                                                            {isUrgent && (
                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 800,
                                                                    textTransform: 'uppercase',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    background: '#fef2f2',
                                                                    color: '#dc2626',
                                                                    animation: 'pulse 2s infinite'
                                                                }}>
                                                                    URGENT
                                                                </span>
                                                            )}
                                                            {!notice.is_active && (
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b' }}>
                                                                    HIDDEN
                                                                </span>
                                                            )}
                                                            {notice.scheduled_at && new Date(notice.scheduled_at) > new Date() && (
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                                                                    🕒 SCHEDULED: {new Date(notice.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary-blue)', fontWeight: 800 }}>{notice.title}</h3>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    {activeTab === 'notice-management' && isCommittee && (
                                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                                            <button
                                                                onClick={() => toggleNoticeStatus(notice)}
                                                                title={notice.is_active ? "Hide Notice" : "Show Notice"}
                                                                style={{ padding: '8px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '1rem' }}
                                                            >
                                                                {notice.is_active ? '👁️' : '🕶️'}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingNotice(notice);
                                                                    setNoticeForm({ ...notice });
                                                                    setIsNoticeModalOpen(true);
                                                                }}
                                                                style={{ padding: '8px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '1rem' }}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteNotice(notice.id || notice._id)}
                                                                style={{ padding: '8px', borderRadius: '10px', background: 'white', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                        {new Date(notice.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                background: styles.bg + '30',
                                                padding: '20px',
                                                borderRadius: '16px',
                                                border: `1px solid ${styles.border}15`,
                                                color: 'var(--text-main)',
                                                lineHeight: '1.7',
                                                fontSize: '1.05rem',
                                                whiteSpace: 'pre-wrap',
                                                marginBottom: '20px'
                                            }}>
                                                {notice.content}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {notice.visible_to && notice.visible_to.map(aud => (
                                                        <span key={aud} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', background: 'var(--bg-page)', borderRadius: '20px', color: 'var(--text-muted)' }}>
                                                            👥 {aud.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    Published by: {notice.created_by_name || 'Committee'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>

                {isNoticeModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                        <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: '24px', width: '600px', maxWidth: '95%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
                            <div style={{ background: 'var(--primary-blue)', padding: '25px 35px', color: 'white' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{editingNotice ? 'Edit Announcement' : 'Draft New Announcement'}</h3>
                                <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Fill in details to broadcast to the community.</p>
                            </div>

                            <form onSubmit={handleCreateNotice} style={{ padding: '35px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--text-main)' }}>Announcement Title</label>
                                    <input
                                        type="text" required
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', fontSize: '1rem' }}
                                        value={noticeForm.title}
                                        onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                        placeholder="Headline for this update..."
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Communication Type</label>
                                        <select
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--bg-page)' }}
                                            value={noticeForm.type}
                                            onChange={e => setNoticeForm({ ...noticeForm, type: e.target.value })}
                                        >
                                            <option value="info">Information (Blue)</option>
                                            <option value="success">Success / Good News (Green)</option>
                                            <option value="warning">Alert (Orange)</option>
                                            <option value="danger">Critical / Immediate Action (Red)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Category Tag</label>
                                        <select
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--bg-page)' }}
                                            value={noticeForm.category}
                                            onChange={e => setNoticeForm({ ...noticeForm, category: e.target.value })}
                                        >
                                            <option value="General">General</option>
                                            <option value="Meeting">Committee Meeting</option>
                                            <option value="Financial">Finance / Contributions</option>
                                            <option value="Event">Event / Festival</option>
                                            <option value="Legal">Legal / Compliance</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Visibility & Target Audience</label>

                                    <div style={{ marginBottom: '15px' }}>
                                        <small style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Global Groups</small>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {['all', 'committee', 'family_head', 'family_member'].map(aud => (
                                                <label key={aud} style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                                                    background: noticeForm.visible_to.includes(aud) ? 'var(--primary-blue)' : 'var(--bg-page)',
                                                    color: noticeForm.visible_to.includes(aud) ? 'white' : 'var(--text-main)',
                                                    borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                                    border: '1px solid var(--border-color)',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={noticeForm.visible_to.includes(aud)}
                                                        onChange={() => {
                                                            const designations = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator'];
                                                            let newAud;

                                                            if (aud === 'committee') {
                                                                const isSelecting = !noticeForm.visible_to.includes('committee');
                                                                if (isSelecting) {
                                                                    // Add committee and all designations
                                                                    const uniqueRoles = new Set([...noticeForm.visible_to, 'committee', ...designations]);
                                                                    newAud = Array.from(uniqueRoles);
                                                                } else {
                                                                    // Remove committee and all designations
                                                                    newAud = noticeForm.visible_to.filter(a => a !== 'committee' && !designations.includes(a));
                                                                }
                                                            } else {
                                                                newAud = noticeForm.visible_to.includes(aud)
                                                                    ? noticeForm.visible_to.filter(a => a !== aud)
                                                                    : [...noticeForm.visible_to, aud];
                                                            }
                                                            setNoticeForm({ ...noticeForm, visible_to: newAud });
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {aud.replace('_', ' ').toUpperCase()}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <small style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Specific Committee Designations</small>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const designations = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator'];
                                                    const allSelected = designations.every(d => noticeForm.visible_to.includes(d));
                                                    let newAud;
                                                    if (allSelected) {
                                                        newAud = noticeForm.visible_to.filter(a => !designations.includes(a) && a !== 'committee');
                                                    } else {
                                                        const uniqueRoles = new Set([...noticeForm.visible_to, 'committee', ...designations]);
                                                        newAud = Array.from(uniqueRoles);
                                                    }
                                                    setNoticeForm({ ...noticeForm, visible_to: newAud });
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
                                            >
                                                {['president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator'].every(d => noticeForm.visible_to.includes(d)) ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {[
                                                { id: 'president', label: 'President' },
                                                { id: 'vice_president', label: 'Vice President' },
                                                { id: 'secretary', label: 'Secretary' },
                                                { id: 'treasurer', label: 'Treasurer' },
                                                { id: 'executive_member', label: 'Executive Member' },
                                                { id: 'coordinator', label: 'Coordinator' }
                                            ].map(role => (
                                                <label key={role.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                                                    background: noticeForm.visible_to.includes(role.id) ? 'var(--primary-saffron)' : 'var(--bg-page)',
                                                    color: noticeForm.visible_to.includes(role.id) ? 'white' : 'var(--text-main)',
                                                    borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                    border: '1px solid var(--border-color)',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={noticeForm.visible_to.includes(role.id)}
                                                        onChange={() => {
                                                            const newVisible = noticeForm.visible_to.includes(role.id)
                                                                ? noticeForm.visible_to.filter(a => a !== role.id)
                                                                : [...noticeForm.visible_to, role.id];

                                                            // Sync with "committee" group
                                                            const designations = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator'];
                                                            const allDesignationsSelected = designations.every(d => newVisible.includes(d));

                                                            let finalAud = newVisible;
                                                            if (allDesignationsSelected && !newVisible.includes('committee')) {
                                                                finalAud = [...newVisible, 'committee'];
                                                            } else if (!allDesignationsSelected && newVisible.includes('committee')) {
                                                                finalAud = newVisible.filter(a => a !== 'committee');
                                                            }

                                                            setNoticeForm({ ...noticeForm, visible_to: finalAud });
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {role.label.toUpperCase()}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Announcement Content</label>
                                    <textarea
                                        required
                                        style={{ width: '100%', height: '120px', padding: '12px 16px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', fontSize: '1rem', resize: 'none' }}
                                        value={noticeForm.content}
                                        onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })}
                                        placeholder="Write details clearly..."
                                    />
                                </div>

                                <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--bg-page)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: noticeForm.scheduled_at ? '15px' : '0' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>⏱️ Schedule Announcement</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set a future time for this to go live.</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNoticeForm({ ...noticeForm, scheduled_at: noticeForm.scheduled_at ? null : new Date().toISOString().slice(0, 16) })}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px',
                                                background: noticeForm.scheduled_at ? 'var(--primary-blue)' : '#e2e8f0',
                                                color: noticeForm.scheduled_at ? 'white' : 'var(--text-main)',
                                                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
                                            }}
                                        >
                                            {noticeForm.scheduled_at ? 'Scheduling ON' : 'Schedule'}
                                        </button>
                                    </div>
                                    {noticeForm.scheduled_at && (
                                        <input
                                            type="datetime-local"
                                            value={noticeForm.scheduled_at}
                                            onChange={e => setNoticeForm({ ...noticeForm, scheduled_at: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }}
                                        />
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setIsNoticeModalOpen(false)} style={{ padding: '12px 25px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" style={{ padding: '12px 40px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 8px 20px rgba(x, x, x, 0.2)' }}>
                                        {editingNotice ? 'Update Broadcast' : 'Post Announcement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const renderProfile = () => {
        const getRoleStyles = (u) => {
            const COMMITTEE_POSITIONS = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator'];
            const isCommittee = COMMITTEE_POSITIONS.includes(u?.position) || COMMITTEE_POSITIONS.includes(u?.role);
            if (isCommittee) return { bg: 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)', text: 'white', label: u.position || u.role };
            if (u?.role === 'admin' || u?.role === 'super_admin') return { bg: 'linear-gradient(135deg, #2C3E50 0%, #1a252f 100%)', text: 'white', label: u.role };
            return { bg: '#FDFBF7', text: '#7F8C8D', label: u?.role || 'Member', border: '1px solid #ECECEC' };
        };

        const roleStyles = getRoleStyles(user);

        const handlePasswordChange = async (e) => {
            e.preventDefault();
            if (pwForm.new_password !== pwForm.confirm_password) {
                notify("Passwords do not match", "error");
                return;
            }
            if (!pwForm.current_password) {
                notify("Enter current password", "error");
                return;
            }
            setIsUpdatingPw(true);
            try {
                await api.changePassword({
                    old_password: pwForm.current_password,
                    new_password: pwForm.new_password
                });
                notify("Password updated successfully!");
                setPwForm({ current_password: '', new_password: '', confirm_password: '' });
            } catch (err) {
                notify(err.response?.data?.detail || "Update failed", "error");
            } finally {
                setIsUpdatingPw(false);
            }
        };

        const handlePhotoChangeLocal = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                notify("Uploading photo...", "info");
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.uploadFile(formData);
                const url = res.data.url;
                await api.updateProfilePhoto(url);

                // Update local storage
                const updatedUser = { ...user, profile_photo: url };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                notify("Profile photo updated!");
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                notify("Upload failed", "error");
            }
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>

                {/* --- PREMIUM IDENTITY HERO --- */}
                <div style={{
                    background: themeMode === 'dark'
                        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                        : `linear-gradient(135deg, ${primaryColor} 0%, #D35400 100%)`,
                    borderRadius: '28px',
                    padding: '50px 40px',
                    color: 'white',
                    display: 'flex',
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    alignItems: 'center',
                    gap: '40px',
                    boxShadow: '0 25px 50px -12px rgba(230, 126, 34, 0.25)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Abstract Decorations */}
                    <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />

                    {/* Avatar with Upload Capability */}
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <div style={{
                            width: '140px', height: '140px', borderRadius: '45px',
                            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '4rem', fontWeight: 900, border: '6px solid rgba(255,255,255,0.25)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            overflow: 'hidden', transition: 'all 0.3s ease'
                        }}>
                            {user?.profile_photo ? (
                                <img src={user.profile_photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <label htmlFor="hero-photo-upload" style={{
                            position: 'absolute', bottom: '-10px', right: '-10px',
                            background: 'white', color: '#E67E22', width: '44px', height: '44px',
                            borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s ease', border: 'none'
                        }} onMouseEnter={e => e.target.style.transform = 'scale(1.1)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                            <Camera size={20} />
                            <input id="hero-photo-upload" type="file" style={{ display: 'none' }} onChange={handlePhotoChangeLocal} />
                        </label>
                    </div>

                    <div style={{ zIndex: 2, textAlign: window.innerWidth < 768 ? 'center' : 'left', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start', gap: '15px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'white' }}>
                                {user?.name}
                            </h1>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '12px',
                                fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                                border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                                Active Profile
                                {user?.is_founder && (
                                    <span style={{ 
                                        marginLeft: '8px',
                                        paddingLeft: '8px',
                                        borderLeft: '1px solid rgba(255,255,255,0.3)',
                                        color: '#ffd700',
                                        fontWeight: 900
                                    }}>
                                        FOUNDER
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start', gap: '25px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '1rem' }}>
                                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}>
                                    <ShieldCheck size={18} />
                                </div>
                                {roleStyles.label?.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '1rem' }}>
                                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}>
                                    <Smartphone size={18} />
                                </div>
                                {user?.phone || user?.mobile}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / ID Pill */}
                    <div style={{
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        padding: '20px 30px', borderRadius: '24px', backdropFilter: 'blur(10px)',
                        display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px'
                    }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7, fontWeight: 700 }}>Member Identifier</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace' }}>#{user?.id?.slice(-8).toUpperCase() || 'SAMITI-ID'}</div>
                    </div>
                </div>

                {/* --- CONTENT SECTION --- */}
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1.3fr 0.7fr', gap: '30px', alignItems: 'flex-start' }}>

                    {/* LEFT COLUMN: Data & Security */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* Information Grid */}
                        <div style={{
                            background: 'var(--bg-card)',
                            padding: '40px',
                            borderRadius: '28px',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '35px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '48px', height: '48px', background: '#FFF8F0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E67E22' }}>
                                        <User size={24} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Account Credentials</h3>
                                </div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID: {user?.family_unique_id || 'Self'}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : 'repeat(2, 1fr)', gap: '30px' }}>
                                {[
                                    { label: 'Display Name', value: user?.name, icon: <User size={16} /> },
                                    { label: 'Official Designation', value: roleStyles.label, icon: <Shield size={16} />, style: { textTransform: 'capitalize' } },
                                    { label: 'Mobile Number', value: user?.phone || user?.mobile, icon: <Smartphone size={16} /> },
                                    { label: 'Account Status', value: 'Active / Verified', icon: <Check size={16} />, color: '#10b981' }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {item.icon} {item.label}
                                        </label>
                                        <div style={{
                                            padding: '16px 20px', background: 'var(--bg-page)', borderRadius: '16px',
                                            color: item.color || 'var(--text-main)', fontWeight: 700, border: '1px solid var(--border-color)',
                                            fontSize: '1rem', ...item.style
                                        }}>
                                            {item.value || 'Not Provided'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Section */}
                        <div style={{
                            background: 'var(--bg-card)',
                            padding: '40px',
                            borderRadius: '28px',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#FEE2E2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                                    <Lock size={24} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Security & Authentication</h3>
                            </div>

                            <form onSubmit={handlePasswordChange}>
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'block' }}>Verification Password (Current)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="password"
                                            value={pwForm.current_password}
                                            onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                                            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid var(--border-color)', background: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: '25px', marginBottom: '35px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'block' }}>Update Password</label>
                                        <input
                                            type="password"
                                            value={pwForm.new_password}
                                            onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                                            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid var(--border-color)', background: 'white', outline: 'none' }}
                                            placeholder="Create strong password"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'block' }}>Authorize Again</label>
                                        <input
                                            type="password"
                                            value={pwForm.confirm_password}
                                            onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                                            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid var(--border-color)', background: 'white', outline: 'none' }}
                                            placeholder="Match new password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isUpdatingPw}
                                    style={{
                                        width: '100%', padding: '18px', borderRadius: '18px', background: 'var(--primary-blue)',
                                        color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                        boxShadow: '0 10px 20px rgba(230, 126, 34, 0.3)'
                                    }}
                                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                >
                                    {isUpdatingPw ? <RefreshCw size={22} className="animate-spin" /> : <Shield size={22} />}
                                    Commit Identity Security Changes
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Appearance & Theme */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* Visual Experience Card */}
                        <div style={{
                            background: 'var(--bg-card)',
                            padding: '40px',
                            borderRadius: '28px',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#F3E8FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
                                    <Palette size={24} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Visual Preferences</h3>
                            </div>

                            {/* Theme Mode Selector */}
                            <div style={{ marginBottom: '35px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>
                                    Interface Mode
                                </label>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px',
                                    background: 'var(--bg-page)', padding: '8px', borderRadius: '20px'
                                }}>
                                    {[
                                        { id: 'jagdamba', label: 'Jagdamba', icon: <Hash size={18} /> },
                                        { id: 'dark', label: 'Dark Mode', icon: <Clock size={18} /> }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setThemeMode(mode.id)}
                                            style={{
                                                padding: '12px', borderRadius: '14px', border: 'none',
                                                background: themeMode === mode.id ? 'white' : 'transparent',
                                                color: themeMode === mode.id ? '#E67E22' : 'var(--text-muted)',
                                                fontWeight: 800, cursor: 'pointer',
                                                boxShadow: themeMode === mode.id ? '0 5px 15px rgba(0,0,0,0.08)' : 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            {mode.icon}
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Customization - Fixed Style */}
                            <div style={{ marginBottom: '35px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>
                                    System Typography
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                        <Type size={20} />
                                    </div>
                                    <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value)}
                                        style={{
                                            width: '100%', padding: '16px 16px 16px 48px', borderRadius: '18px',
                                            background: 'var(--bg-page)', border: '1.5px solid var(--border-color)',
                                            color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600,
                                            fontFamily: fontFamily, appearance: 'none', cursor: 'pointer', outline: 'none'
                                        }}
                                    >
                                        <option value="'Outfit', sans-serif">Outfit (Modern)</option>
                                        <option value="'Merriweather', serif">Merriweather (Classic)</option>
                                        <option value="'Inter', sans-serif">Inter (Clean)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Display Scaling */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>
                                    Interface Scale
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[
                                        { id: 'normal', label: 'Default', icon: <Hash size={18} /> },
                                        { id: 'large', label: 'High Logic', icon: <Maximize2 size={18} /> }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setFontSize(opt.id)}
                                            style={{
                                                flex: 1, padding: '15px', borderRadius: '16px',
                                                background: fontSize === opt.id ? '#E67E22' : 'var(--bg-page)',
                                                color: fontSize === opt.id ? 'white' : 'var(--text-main)',
                                                border: '1.5px solid var(--border-color)',
                                                fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                            }}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Logout Section for convenience */}
                        <button
                            onClick={() => {
                                if (window.confirm("Do you want to sign out?")) {
                                    localStorage.clear();
                                    window.location.href = '/login';
                                }
                            }}
                            style={{
                                padding: '25px', borderRadius: '28px', background: '#F8FAFC',
                                border: '1px solid #E2E8F0', color: '#64748B', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '15px',
                                cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.target.style.background = '#FEE2E2'; e.target.style.color = '#EF4444'; e.target.style.borderColor = '#FECACA'; }}
                            onMouseLeave={e => { e.target.style.background = '#F8FAFC'; e.target.style.color = '#64748B'; e.target.style.borderColor = '#E2E8F0'; }}
                        >
                            <LogOut size={22} />
                            Terminate Session
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    };

    const renderAudit = () => (
        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '15px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>🛡️ Security Audit History</h3>
                <button onClick={() => api.getAuditLogs().then(res => setAuditLogs(res.data))} style={{ padding: '8px 16px', background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>🔄 Refresh Logs</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '15px' }}>Timestamp</th>
                            <th style={{ padding: '15px' }}>Admin User</th>
                            <th style={{ padding: '15px' }}>Action</th>
                            <th style={{ padding: '15px' }}>Target Entity</th>
                            <th style={{ padding: '15px' }}>Snapshot Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map((log, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{log.time}</td>
                                <td style={{ padding: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{log.user_name}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        background: log.action === 'APPROVE' ? '#e8f5e9' : (log.action === 'CREATE' ? '#e3f2fd' : '#fff3e0'),
                                        color: log.action === 'APPROVE' ? '#2e7d32' : (log.action === 'CREATE' ? '#1565c0' : '#ef6c00')
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', color: 'var(--text-main)' }}>{log.target}</td>
                                <td style={{ padding: '15px' }}>
                                    <code style={{ fontSize: '0.8rem', background: 'var(--bg-page)', padding: '5px', borderRadius: '4px' }}>{log.details}</code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderInquiries = () => (
        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '15px', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: '25px', color: 'var(--text-main)', fontWeight: 800 }}>📞 Public Inquiries</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <th style={{ padding: '15px' }}>Date</th>
                            <th style={{ padding: '15px' }}>Name</th>
                            <th style={{ padding: '15px' }}>Contact</th>
                            <th style={{ padding: '15px' }}>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inquiries.length > 0 ? inquiries.map((iq, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{iq.time}</td>
                                <td style={{ padding: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{iq.name}</td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>📧 {iq.email}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📞 {iq.phone}</div>
                                </td>
                                <td style={{ padding: '15px', color: 'var(--text-main)', fontSize: '0.9rem', maxWidth: '300px' }}>{iq.message}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No inquiries found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCommitteeDirectory = () => {
        const COMMITTEE_POSITIONS = [
            { id: 'president', label: 'President (अध्यक्ष)', icon: '👑', color: '#B8860B' },
            { id: 'vice_president', label: 'Vice President (उपाध्यक्ष)', icon: '🏛️', color: '#CD7F32' },
            { id: 'secretary', label: 'Secretary (सचिव)', icon: '📜', color: '#4A90E2' },
            { id: 'treasurer', label: 'Treasurer (कोषाध्यक्ष)', icon: '💰', color: '#D4AF37' },
            { id: 'executive_member', label: 'Executive Member', icon: '⚖️', color: '#607D8B' },
            { id: 'coordinator', label: 'Coordinator (समन्वयक)', icon: '🤝', color: '#E67E22' },
        ];

        const committee = users.filter(u =>
            COMMITTEE_POSITIONS.some(p => p.id === u.position) || u.role === 'admin' || u.role === 'super_admin'
        );

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.5s ease' }}>
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '40px',
                    borderRadius: '30px',
                    boxShadow: 'var(--shadow)',
                    border: '1px solid var(--border-color)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: 'linear-gradient(90deg, #F39C12, #E67E22)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-blue)', letterSpacing: '-0.03em' }}>Committee Directory</h2>
                            <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Active office bearers currently serving</p>
                        </div>

                        {(user?.role === 'super_admin' || user?.role === 'admin') && communitiesList.length > 0 && (
                            <div style={{ flex: '1', minWidth: '250px', maxWidth: '400px' }}>
                                <select 
                                    className="form-input"
                                    value={committeeCommunityFilter}
                                    onChange={(e) => setCommitteeCommunityFilter(e.target.value)}
                                    style={{ width: '100%', padding: '12px 20px', borderRadius: '15px', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    <option value="all">🌐 All Communities (Global)</option>
                                    {communitiesList.map(c => (
                                        <option key={c.id || c._id} value={c.id || c._id}>{c.name} ({c.society_code})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{
                            background: 'var(--bg-page)',
                            padding: '15px 30px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-saffron)', lineHeight: 1 }}>{committee.length}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '4px' }}>Total Leaders</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '35px' }}>
                        {COMMITTEE_POSITIONS.map(pos => {
                            const members = committee.filter(u => u.position === pos.id);
                            if (members.length === 0) return null;

                            return (
                                <div key={pos.id} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        borderBottom: `2.5px solid ${pos.color}40`,
                                        paddingBottom: '12px',
                                        animation: 'fadeIn 0.8s ease'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: `${pos.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem'
                                        }}>
                                            {pos.icon}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: pos.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{pos.label}</h3>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {members.map(m => (
                                            <div
                                                key={m.id}
                                                style={{
                                                    background: 'var(--bg-card)',
                                                    padding: '24px',
                                                    borderRadius: '24px',
                                                    border: '1.5px solid var(--border-color)',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '20px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                                    e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.08)';
                                                    e.currentTarget.style.borderColor = pos.color;
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                                }}
                                            >
                                                <div style={{
                                                    width: '65px',
                                                    height: '65px',
                                                    borderRadius: '20px',
                                                    background: m.profile_photo ? 'none' : `linear-gradient(135deg, ${pos.color} 0%, #1a1a1a 100%)`,
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.6rem',
                                                    fontWeight: 900,
                                                    color: 'white',
                                                    border: `3px solid white`,
                                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                                                }}>
                                                    {m.profile_photo ? (
                                                        <img src={m.profile_photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                    ) : m.name.charAt(0)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '5px' }}>{m.name}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>
                                                        <Smartphone size={16} /> {m.phone}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    background: 'var(--bg-page)',
                                                    padding: '10px',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border-color)',
                                                    cursor: 'pointer'
                                                }} onClick={() => window.open(`tel:${m.phone}`)} title="Call Member">
                                                    📞
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Technical Admin Section */}
                    {committee.some(u => (u.role === 'admin' || u.role === 'super_admin') && !u.position) && (
                        <div style={{ marginTop: '60px', padding: '40px', background: 'var(--bg-page)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                                <Shield size={24} color="#64748B" />
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical & Admin Support</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {committee.filter(u => (u.role === 'admin' || u.role === 'super_admin') && !u.position).map(m => (
                                    <div key={m.id} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, color: '#64748B' }}>
                                            {m.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{m.name}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#6366F1', marginTop: '2px' }}>{m.role.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderRoleManagement = () => {
        const [searchQuery, setSearchQuery] = useState('');

        const getRoleBadge = (u) => {
            const COMMITTEE_POSITIONS = ['president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator'];
            const isCommittee = COMMITTEE_POSITIONS.includes(u.position);
            const style = isCommittee
                ? { bg: 'var(--primary-saffron)', text: 'white' }
                : (u.role === 'admin' ? { bg: '#E3F2FD', text: '#1565C0' } : { bg: 'var(--bg-page)', text: 'var(--text-muted)' });

            const label = (u.position && u.position !== 'none') ? u.position : u.role;
            return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: style.bg, color: style.text, textTransform: 'capitalize', border: '1px solid var(--border-color)' }}>{label.replace('_', ' ')}</span>;
        };

        const handleRoleUpdate = async (userId, newRole) => {
            // if (!window.confirm(`Update base role to ${newRole}?`)) return;
            setPendingRoleChange({ userId, newRole });
            setConfirmPassword('');
            setIsPasswordModalOpen(true);
        };



        const handlePositionUpdate = async (userId, newPos) => {
            if (!window.confirm(`Assign official post: ${newPos}?`)) return;
            try {
                await api.updateUserPosition(userId, newPos);
                alert("Official Position Updated!");
                api.getUsers().then(res => setUsers(res.data));
            } catch (err) {
                alert("Failed: " + (err.response?.data?.detail || err.message));
            }
        };

        const handleStatusToggle = async (userId, currentStatus) => {
            const newStatus = !currentStatus;
            if (!window.confirm(`Are you sure you want to ${newStatus ? 'Reactivate' : 'Suspend'} this user?`)) return;
            try {
                await api.updateUserStatus(userId, newStatus);
                alert(`User ${newStatus ? 'Reactivated' : 'Suspended'}!`);
                api.getUsers().then(res => setUsers(res.data));
            } catch (err) {
                alert("Failed to update status");
            }
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>🔐 Role & Committee Management</h3>
                            
                            {(user?.role === 'super_admin' || user?.role === 'admin') && communitiesList.length > 0 && (
                                <div style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
                                    <select 
                                        className="form-input"
                                        value={committeeCommunityFilter}
                                        onChange={(e) => setCommitteeCommunityFilter(e.target.value)}
                                        style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1.5px solid var(--border-color)', outline: 'none', background: 'var(--bg-page)', color: 'var(--text-main)', fontWeight: 600 }}
                                    >
                                        <option value="all">🌐 All Communities (Global)</option>
                                        {communitiesList.map(c => (
                                            <option key={c.id || c._id} value={c.id || c._id}>{c.name} ({c.society_code})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ position: 'relative', width: '300px' }}>
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-page)', fontSize: '0.9rem' }}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <Users size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-page)', textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '15px' }}>User Details</th>
                                        <th style={{ padding: '15px' }}>Community</th>
                                        <th style={{ padding: '15px' }}>Current Designation</th>
                                        <th style={{ padding: '15px' }}>Change Role</th>
                                        <th style={{ padding: '15px' }}>Assign Official Post</th>
                                        <th style={{ padding: '15px' }}>Status</th>
                                    </tr>
                                </thead>
                            <tbody>
                                {users
                                    .filter(u =>
                                        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        u.phone?.includes(searchQuery)
                                    )
                                    .map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                                            <small style={{ color: 'var(--text-muted)' }}>{u.phone}</small>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {communitiesList.find(c => c.id === u.community_id || c._id === u.community_id)?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px' }}>{getRoleBadge(u)}</td>
                                        <td style={{ padding: '15px' }}>
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                                disabled={u.position === 'president' && user.role !== 'super_admin'}
                                            >
                                                <option value="member">Member</option>
                                                <option value="family_head">Family Head</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <select
                                                value={['admin', 'super_admin'].includes(u.role) ? 'none' : (u.position || 'none')}
                                                onChange={(e) => handlePositionUpdate(u.id, e.target.value)}
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                                disabled={
                                                    // 1. Admins cannot hold posts
                                                    ['admin', 'super_admin'].includes(u.role) ||
                                                    // 2. Only Super Admin can remove/change an existing President
                                                    (u.position === 'president' && user.role !== 'super_admin') ||
                                                    // 3. Permission Check (Authorized if: Super Admin OR President OR (Admin & No President Exists))
                                                    !(
                                                        user.role === 'super_admin' ||
                                                        user.position === 'president' ||
                                                        (user.role === 'admin' && !users.some(usr => usr.position === 'president' && usr.is_active))
                                                    )
                                                }
                                            >
                                                <option value="none">-- No Post --</option>
                                                <option value="president">President (अध्यक्ष)</option>
                                                <option value="vice_president">Vice President (उपाध्यक्ष)</option>
                                                <option value="secretary">Secretary (सचिव)</option>
                                                <option value="treasurer">Treasurer (कोषाध्यक्ष)</option>
                                                <option value="executive_member">Executive Member</option>
                                                <option value="coordinator">Coordinator (समन्वयक)</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <button
                                                onClick={() => handleStatusToggle(u.id, u.is_active)}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: u.is_active ? '#ffebee' : '#e8f5e9',
                                                    color: u.is_active ? '#c62828' : '#2e7d32',
                                                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700
                                                }}
                                            >
                                                {u.is_active ? 'Suspend' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', marginTop: '30px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--text-main)' }}>📜 Role Change History</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-page)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px' }}>User</th>
                                    <th style={{ padding: '12px' }}>Action</th>
                                    <th style={{ padding: '12px' }}>Details</th>
                                    <th style={{ padding: '12px' }}>Changed By</th>
                                    <th style={{ padding: '12px' }}>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roleLogs.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px', color: 'var(--text-main)' }}>{l.user_name}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ fontSize: '0.8rem', padding: '2px 6px', background: l.action === 'ROLE_CHANGE' ? '#E3F2FD' : '#FFFDE7', color: '#1565C0', borderRadius: '4px' }}>
                                                {l.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                            {l.action === 'ROLE_CHANGE' ? (
                                                `Role: ${l.details.old_role} → ${l.details.new_role}`
                                            ) : (
                                                `Status: ${l.details.old_status} → ${l.details.new_status}`
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text-main)' }}>{l.changed_by}</td>
                                        <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{l.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderElections = () => {
        const canCreate = ['super_admin', 'admin', 'president'].includes(role);

        const handleVote = async (electionId) => {
            if (Object.keys(votingSelections).length === 0) {
                return notify("Please select candidates for at least one position.", "error");
            }
            setIsSubmittingVote(true);
            try {
                const selectionsArray = Object.entries(votingSelections).map(([postId, candId]) => ({
                    post_id: parseInt(postId),
                    candidate_id: candId
                }));
                await api.submitVote(electionId, selectionsArray);
                notify("Vote cast successfully! Your voice has been recorded.");
                api.getActiveElections().then(res => setActiveElections(res.data));
            } catch (err) {
                notify(err.response?.data?.detail || "Voting failed. Please try again.", "error");
            } finally {
                setIsSubmittingVote(false);
            }
        };

        const handleCreateElection = async () => {
            if (!electionForm.title || !electionForm.posts.length) return notify("Plase add a title and at least one post.", "error");
            try {
                await api.createElection(electionForm);
                notify("The Election is officially live!");
                setIsElectionModalOpen(false);
                setElectionForm({
                    title: '', description: '', start_date: '', end_date: '',
                    posts: []
                });
                api.getActiveElections().then(res => setActiveElections(res.data));
            } catch (err) {
                notify(err.response?.data?.detail || "Election setup failed.", "error");
            }
        };

        const handleDeclareResults = async (id) => {
            if (!window.confirm("Finalize Election? This will update ALL office bearer positions across the Samiti.")) return;
            try {
                await api.declareElectionResults(id);
                notify("Election Finalized! A new leadership era begins.");
                api.getActiveElections().then(res => setActiveElections(res.data));
            } catch (err) {
                notify(err.response?.data?.detail || "Resolution failed.", "error");
            }
        };

        return (
            <div className="election-center" style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: 800 }}>🗳️ Democratic Center</h3>
                        <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Empowering the community through fair and transparent elections.</p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => setIsElectionModalOpen(true)}
                            className="nav-btn-filled"
                            style={{ padding: '14px 28px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', boxShadow: '0 8px 15px rgba(255, 153, 51, 0.2)' }}
                        >
                            + Setup New Election
                        </button>
                    )}
                </div>

                {activeElections.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 40px', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏛️</div>
                        <h4 style={{ color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 800 }}>Stability & Continuity</h4>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '10px auto' }}>There are no active elections or upcoming ballots scheduled for this term.</p>
                    </div>
                ) : (
                    activeElections.map(election => (
                        <div key={election.id} className="governance-card" style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '32px', border: '1px solid var(--border-color)', marginBottom: '35px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: 'var(--primary)' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '35px' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 900 }}>{election.title}</h4>
                                    <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>{election.description}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ padding: '8px 20px', background: 'rgba(56, 142, 60, 0.1)', color: '#2e7d32', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>LIVE BALLOT</span>
                                    <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#e74c3c', fontWeight: 700 }}>Ends on {new Date(election.end_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                            </div>

                            <div className="ballot-area" style={{ display: 'grid', gap: '30px' }}>
                                {election.posts.map(post => (
                                    <div key={post.id} style={{ padding: '30px', background: 'var(--bg-page)', borderRadius: '24px', border: '1px solid var(--border-color)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '15px' }}>
                                            <h5 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800 }}>
                                                {post.name.replace('_', ' ')} <span style={{ color: 'var(--primary)', fontSize: '0.85rem', marginLeft: '10px', background: 'rgba(255,153,51,0.1)', padding: '4px 10px', borderRadius: '8px' }}>{post.seats} Available Seat{post.seats > 1 ? 's' : ''}</span>
                                            </h5>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Select 1 Candidate</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                            {post.candidates.length === 0 ? (
                                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No nominees for this position.</div>
                                            ) : (
                                                post.candidates.map(cand => {
                                                    const perf = committeePerformance.find(p => p.id === cand.user_id);
                                                    return (
                                                        <label key={cand.id} className="ballot-choice" style={{
                                                            position: 'relative', display: 'flex', alignItems: 'center', gap: '15px', padding: '20px',
                                                            background: votingSelections[post.id] === cand.id ? 'var(--white)' : 'var(--bg-card)',
                                                            borderRadius: '20px', cursor: 'pointer',
                                                            border: `2px solid ${votingSelections[post.id] === cand.id ? 'var(--primary)' : 'transparent'}`,
                                                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                            boxShadow: votingSelections[post.id] === cand.id ? '0 10px 25px rgba(255,153,51,0.15)' : 'none',
                                                            transform: votingSelections[post.id] === cand.id ? 'scale(1.02)' : 'scale(1)'
                                                        }}>
                                                            <input
                                                                type="radio"
                                                                name={`post-${post.id}`}
                                                                value={cand.id}
                                                                checked={votingSelections[post.id] === cand.id}
                                                                onChange={() => setVotingSelections({ ...votingSelections, [post.id]: cand.id })}
                                                                style={{ position: 'absolute', opacity: 0 }}
                                                            />
                                                            <div style={{ width: '45px', height: '45px', background: 'var(--bg-page)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 900, fontSize: '1.2rem', border: '2px solid var(--border-color)' }}>
                                                                {votingSelections[post.id] === cand.id ? '✓' : cand.name.charAt(0)}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>{cand.name}</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                                    {perf && (
                                                                        <span style={{ fontSize: '0.7rem', color: '#f39c12', fontWeight: 900, background: '#fff9c4', padding: '2px 8px', borderRadius: '6px' }}>
                                                                            ★ {perf.performance.average} Historical
                                                                        </span>
                                                                    )}
                                                                    {cand.manifesto && <span title={cand.manifesto} style={{ fontSize: '0.7rem', color: 'var(--primary)', cursor: 'help', fontWeight: 700 }}>[Manifesto]</span>}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                                <button
                                    onClick={() => handleVote(election.id)}
                                    disabled={isSubmittingVote}
                                    style={{
                                        padding: '18px 40px', borderRadius: '18px', flex: 2, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                        color: 'white', border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                                        boxShadow: '0 10px 30px rgba(216, 124, 29, 0.3)', transition: 'all 0.3s'
                                    }}
                                    onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={e => e.target.style.transform = 'translateY(0)'}
                                >
                                    {isSubmittingVote ? '🛡️ Securing Ballot...' : '🔒 CAST OFFICIAL VOTE'}
                                </button>

                                {canCreate && (
                                    <button
                                        onClick={() => handleDeclareResults(election.id)}
                                        style={{ padding: '12px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                        🏁 Declare Results
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Election Creation Modal */}
                {isElectionModalOpen && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '750px', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: 900 }}>🏛️ Setup Official Election</h3>
                                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Configure terms and contested positions for the next tenure.</p>
                                </div>
                                <button onClick={() => setIsElectionModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                            </div>

                            <div style={{ display: 'grid', gap: '25px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>Election Title</label>
                                        <input
                                            placeholder="e.g. 2026 Committee General Elections"
                                            style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
                                            value={electionForm.title}
                                            onChange={e => setElectionForm({ ...electionForm, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>Poll Start Date</label>
                                        <input type="date" style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }} value={electionForm.start_date} onChange={e => setElectionForm({ ...electionForm, start_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>Poll End Date</label>
                                        <input type="date" style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }} value={electionForm.end_date} onChange={e => setElectionForm({ ...electionForm, end_date: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-page)', padding: '25px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                                    <label style={{ display: 'block', marginBottom: '15px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Step 2: Define Contentious Posts & Seats</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                        {AVAILABLE_POSTS.map(post => {
                                            const isSelected = electionForm.posts.some(p => p.name === post.id);
                                            return (
                                                <div
                                                    key={post.id}
                                                    onClick={() => {
                                                        if (isSelected) setElectionForm({ ...electionForm, posts: electionForm.posts.filter(p => p.name !== post.id) });
                                                        else setElectionForm({ ...electionForm, posts: [...electionForm.posts, { name: post.id, seats: 1 }] });
                                                    }}
                                                    style={{
                                                        padding: '12px', borderRadius: '16px', border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(0,0,0,0.05)'}`,
                                                        background: isSelected ? 'var(--white)' : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                                                        boxShadow: isSelected ? '0 8px 20px rgba(255,153,51,0.15)' : 'none'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text-main)', marginBottom: '4px' }}>{post.label}</div>
                                                    {isSelected && (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>SEATS:</span>
                                                            <input
                                                                type="number" min="1"
                                                                value={electionForm.posts.find(p => p.name === post.id)?.seats || 1}
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={e => {
                                                                    const val = parseInt(e.target.value) || 1;
                                                                    setElectionForm({ ...electionForm, posts: electionForm.posts.map(p => p.name === post.id ? { ...p, seats: val } : p) });
                                                                }}
                                                                style={{ width: '35px', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, textAlign: 'center' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {/* Custom Posts Badge */}
                                        {electionForm.posts.filter(p => !AVAILABLE_POSTS.some(ap => ap.id === p.name)).map(p => (
                                            <div key={p.name} style={{ padding: '12px', borderRadius: '16px', border: '2px solid var(--primary)', background: 'var(--white)', position: 'relative', textAlign: 'center', boxShadow: '0 8px 20px rgba(255,153,51,0.1)' }}>
                                                <button onClick={() => setElectionForm({ ...electionForm, posts: electionForm.posts.filter(op => op.name !== p.name) })} style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '14px', cursor: 'pointer' }}>×</button>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px', textTransform: 'capitalize' }}>{p.name.replace(/_/g, ' ')}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SEATS:</span>
                                                    <input type="number" min="1" value={p.seats} onChange={e => {
                                                        const val = parseInt(e.target.value) || 1;
                                                        setElectionForm({ ...electionForm, posts: electionForm.posts.map(op => op.name === p.name ? { ...op, seats: val } : op) });
                                                    }} style={{ width: '35px', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, textAlign: 'center' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            id="customPostInput" placeholder="Add Custom Post (e.g. Cultural Secretary)"
                                            onKeyPress={e => {
                                                if (e.key === 'Enter') {
                                                    const name = e.target.value.trim();
                                                    if (name && !electionForm.posts.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                                                        setElectionForm({ ...electionForm, posts: [...electionForm.posts, { name: name.toLowerCase().replace(/\s+/g, '_'), seats: 1 }] });
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                            style={{ flex: 1, padding: '12px 20px', borderRadius: '14px', border: '2px dashed var(--border-color)', background: 'white', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                        <button onClick={() => {
                                            const input = document.getElementById('customPostInput');
                                            const name = input.value.trim();
                                            if (name && !electionForm.posts.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                                                setElectionForm({ ...electionForm, posts: [...electionForm.posts, { name: name.toLowerCase().replace(/\s+/g, '_'), seats: 1 }] });
                                                input.value = '';
                                            }
                                        }} style={{ padding: '0 20px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Add</button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={handleCreateElection} style={{ flex: 1.5, padding: '18px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 153, 51, 0.3)' }}>🚀 Launch Official Election</button>
                                    <button onClick={() => setIsElectionModalOpen(false)} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: '2px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Discard</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderHistory = () => (
        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', marginBottom: '25px' }}>📜 Committee Legacy & History</h3>
            {loading && committeeHistory.length === 0 ? <p>Loading committee history...</p> : (
                committeeHistory.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No historical committee data available yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {committeeHistory.map((h, i) => {
                            const memberPerformance = committeePerformance.find(p => p.name === h.name);
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'var(--bg-page)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ width: '50px', height: '50px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginRight: '20px', fontWeight: 800 }}>
                                        {h.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{h.name}</h4>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>{h.position}</div>
                                        {memberPerformance && (
                                            <div style={{ fontSize: '0.8rem', color: '#f39c12', fontWeight: 700, marginTop: '4px' }}>
                                                Historical Rating: ★ {memberPerformance.performance.average}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Term Started</div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{new Date(h.start).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );

    const renderNominees = () => {
        const canEdit = role === 'family_head' || role === 'admin' || role === 'super_admin';

        const handleAddNominee = () => {
            setNomineeForm({ full_name: '', relation: '', relation_other: '', mobile: '', dob: '', share_percentage: '', is_family_member: false, selected_member_id: '' });
            setEditingNomineeIndex(-1);
            setIsNomineeModalOpen(true);
        };

        const handleEditNominee = (index) => {
            setNomineeForm(nomineeDetails.nominees[index]);
            setEditingNomineeIndex(index);
            setIsNomineeModalOpen(true);
        };

        const handleDeleteNominee = (index) => {
            const updated = [...nomineeDetails.nominees];
            updated.splice(index, 1);
            setNomineeDetails({ ...nomineeDetails, nominees: updated });
        };

        const handleSaveNominee = () => {
            const updatedList = [...(nomineeDetails.nominees || [])];
            if (editingNomineeIndex >= 0) {
                updatedList[editingNomineeIndex] = nomineeForm;
            } else {
                updatedList.push(nomineeForm);
            }
            setNomineeDetails({ ...nomineeDetails, nominees: updatedList });
            setIsNomineeModalOpen(false);
        };

        const handleSaveChanges = async () => {
            try {
                await api.updateNominees(nomineeDetails);
                notify("Nominee details updated successfully!");
                if (refreshData) refreshData();
            } catch (err) {
                notify(err.response?.data?.detail || "Failed to update nominees", "error");
            }
        };

        return (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 800 }}>🛡️ Nominee Details</h3>
                        <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>Manage nominees for your family assets and membership rights.</p>
                    </div>
                    {canEdit && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSaveChanges} className="nav-btn-filled" style={{ padding: '12px 24px', background: 'var(--secondary)', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)' }}>
                                💾 Save Changes
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', marginBottom: '30px' }}>
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--primary)', fontWeight: 800, borderBottom: '2px solid var(--bg-page)', paddingBottom: '10px' }}>1. Emergency Contact</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--text-main)' }}>Contact Name</label>
                            <input
                                type="text"
                                value={nomineeDetails.emergency_name || ''}
                                onChange={e => setNomineeDetails({ ...nomineeDetails, emergency_name: e.target.value })}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}
                                placeholder="Name of person to contact in emergency"
                                readOnly={!canEdit}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--text-main)' }}>Mobile Number</label>
                            <input
                                type="text"
                                value={nomineeDetails.emergency_mobile || ''}
                                onChange={e => setNomineeDetails({ ...nomineeDetails, emergency_mobile: e.target.value })}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}
                                placeholder="Emergency mobile number"
                                readOnly={!canEdit}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>2. Asset Nominees</h4>
                        {canEdit && (
                            <button onClick={handleAddNominee} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                + Add Nominee
                            </button>
                        )}
                    </div>

                    {!nomineeDetails.nominees?.length ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-page)', borderRadius: '16px', border: '2px dashed var(--border-color)' }}>
                            No nominees added yet. Please add at least one nominee.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {nomineeDetails.nominees.map((nom, idx) => (
                                <div key={idx} style={{ padding: '20px', background: 'var(--bg-page)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{nom.full_name}</span>
                                            {nom.is_family_member && <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>FAMILY MEMBER</span>}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {nom.relation} {nom.relation_other && `(${nom.relation_other})`} • Share: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{nom.share_percentage}%</span>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleEditNominee(idx)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>✏️</button>
                                            <button onClick={() => handleDeleteNominee(idx)} style={{ padding: '8px 12px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>🗑️</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isNomineeModalOpen && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <h3 style={{ margin: '0 0 25px 0', color: 'var(--text-main)' }}>{editingNomineeIndex >= 0 ? 'Edit Nominee' : 'Add Nominee'}</h3>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '15px', background: 'var(--bg-page)', borderRadius: '12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={nomineeForm.is_family_member}
                                        onChange={e => setNomineeForm({ ...nomineeForm, is_family_member: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Select from Existing Family Members</span>
                                </label>

                                {nomineeForm.is_family_member ? (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Select Member</label>
                                        <select
                                            value={nomineeForm.selected_member_id}
                                            onChange={e => {
                                                const member = (familyData?.members || []).find(m => m.member_id === e.target.value);
                                                if (member) {
                                                    setNomineeForm({
                                                        ...nomineeForm,
                                                        selected_member_id: e.target.value,
                                                        full_name: member.full_name,
                                                        relation: member.relation,
                                                        dob: member.dob,
                                                        mobile: member.mobile || ''
                                                    });
                                                }
                                            }}
                                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}
                                        >
                                            <option value="">-- Choose Member --</option>
                                            {familyData?.members?.map(m => (
                                                <option key={m.member_id} value={m.member_id}>{m.full_name} ({m.relation})</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Full Name</label>
                                            <input type="text" value={nomineeForm.full_name} onChange={e => setNomineeForm({ ...nomineeForm, full_name: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Relation</label>
                                                <select type="text" value={nomineeForm.relation} onChange={e => setNomineeForm({ ...nomineeForm, relation: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
                                                    <option value="">Select...</option>
                                                    {['Wife', 'Husband', 'Son', 'Daughter', 'Mother', 'Father', 'Brother', 'Sister', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>DOB</label>
                                                <input type="date" value={nomineeForm.dob} onChange={e => setNomineeForm({ ...nomineeForm, dob: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Share Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={nomineeForm.share_percentage}
                                        onChange={e => setNomineeForm({ ...nomineeForm, share_percentage: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)' }}
                                        placeholder="e.g. 50"
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                    <button onClick={handleSaveNominee} style={{ flex: 1.5, padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                                        {editingNomineeIndex >= 0 ? 'Update Nominee' : 'Add Nominee'}
                                    </button>
                                    <button onClick={() => setIsNomineeModalOpen(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderGovernance = () => {
        const isFamilyHead = ['family_head', 'admin', 'super_admin'].includes(role);

        const handleInitiateStrike = async () => {
            if (!strikeForm.target_user_id || !strikeForm.reason) return notify("Please fill all fields", "error");
            try {
                await api.initiateStrike(strikeForm);
                notify("Removal petition started successfully!");
                setIsStrikeModalOpen(false);
                api.getActiveStrikes().then(res => setActiveStrikes(res.data));
            } catch (err) {
                notify(err.response?.data?.detail || "Failed to initiate", "error");
            }
        };

        const handleSupport = async (id) => {
            try {
                const res = await api.supportStrike(id);
                notify(res.data.message);
                api.getActiveStrikes().then(res => setActiveStrikes(res.data));
            } catch (err) {
                notify(err.response?.data?.detail || "Failed to support", "error");
            }
        };

        const handleVoteStrike = async (id, approve) => {
            try {
                const res = await api.voteStrike(id, { approve });
                notify(res.data.message);
                api.getActiveStrikes().then(res => setActiveStrikes(res.data));
            } catch (err) {
                notify(err.response?.data?.detail || "Failed to vote", "error");
            }
        };

        const handleSubmitRating = async () => {
            try {
                await api.submitRating(ratingForm);
                notify("Thank you for your feedback! Rating recorded.");
                setIsRatingModalOpen(false);
                api.getAllCommitteePerformance().then(res => setCommitteePerformance(res.data));
            } catch (err) {
                notify(err.response?.data?.detail || "Failed to rate", "error");
            }
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.5s ease' }}>
                {/* 1. Removal / No Confidence Section */}
                <div className="governance-card" style={{ background: 'var(--bg-card)', padding: '35px', borderRadius: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#e74c3c' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 800 }}>⚖️ Democratic Accountability</h3>
                            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Leaders are answerable to the community. Propose removal for misconduct.</p>
                        </div>
                        {isFamilyHead && (
                            <button onClick={() => setIsStrikeModalOpen(true)} className="nav-btn-filled" style={{ padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)' }}>
                                + Start Removal Petition
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gap: '25px' }}>
                        {activeStrikes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 40px', border: '2px dashed var(--border-color)', borderRadius: '32px', background: 'rgba(0,0,0,0.02)', transition: 'all 0.3s ease' }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '15px', animation: 'float 3s ease-in-out infinite' }}>🕊️</div>
                                <h4 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800 }}>Institutional Stability</h4>
                                <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>No removal motions or active petitions are currently on record.</p>
                            </div>
                        ) : (
                            activeStrikes.map(strike => (
                                <div key={strike.id} className="governance-card" style={{ padding: '30px', background: 'var(--bg-page)', borderRadius: '24px', border: '1px solid var(--border-color)', position: 'relative', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                                        <div style={{ flex: 1, minWidth: '250px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <div style={{ width: '40px', height: '40px', background: '#e74c3c', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>{strike.target.name.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{strike.target.name}</div>
                                                    <span style={{ color: '#e74c3c', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current {String(strike.target.position || '').replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '20px', background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#e74c3c', color: 'white', padding: '2px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>Grounds for Removal</div>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 500 }}>{strike.reason}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 16px',
                                                background: strike.status === 'voting' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(243, 156, 18, 0.1)',
                                                color: strike.status === 'voting' ? '#e74c3c' : '#f39c12',
                                                borderRadius: '50px',
                                                fontSize: '0.75rem',
                                                fontWeight: 900,
                                                border: `1px solid ${strike.status === 'voting' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(243, 156, 18, 0.2)'}`
                                            }}>
                                                <span style={{ width: '8px', height: '8px', background: 'currentColor', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                                                {strike.status === 'voting' ? 'VOTING PHASE (STRICT)' : 'COLLECTING PETITION'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 700 }}>Ends: {new Date(strike.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '30px' }}>
                                        {strike.status === 'petition' ? (
                                            <div style={{ padding: '20px', background: 'rgba(243, 156, 18, 0.03)', borderRadius: '20px', border: '1px solid rgba(243, 156, 18, 0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>Verification Threshold</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>25% of Family Heads must co-sign to trigger election</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ fontWeight: 900, color: '#f39c12', fontSize: '1.2rem' }}>{strike.petition_progress.current}</span>
                                                        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}> / {strike.petition_progress.required} Verified Heads</span>
                                                    </div>
                                                </div>
                                                <div style={{ height: '14px', background: 'var(--bg-card)', borderRadius: '50px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    <div style={{
                                                        width: `${Math.min(100, (strike.petition_progress.current / strike.petition_progress.required) * 100)}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, #f39c12, #e67e22)',
                                                        transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                                        boxShadow: '0 0 15px rgba(243, 156, 18, 0.3)'
                                                    }} />
                                                </div>
                                                {isFamilyHead && (
                                                    <button onClick={() => handleSupport(strike.id)} style={{ marginTop: '20px', width: '100%', padding: '16px', borderRadius: '14px', background: 'var(--white)', color: '#e67e22', border: '2px solid #f39c12', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(243, 156, 18, 0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                                        <span style={{ fontSize: '1.2rem' }}>✍️</span> Digitally Sign and Co-Sponsor Removal
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '30px', background: 'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)', borderRadius: '24px', border: '1px solid rgba(231, 76, 60, 0.2)', textAlign: 'center', boxShadow: '0 15px 35px rgba(231, 76, 60, 0.08)' }}>
                                                <div style={{ background: '#e74c3c', color: 'white', display: 'inline-block', padding: '6px 15px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Official Decision Phase</div>
                                                <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '8px' }}>DO YOU HAVE CONFIDENCE IN THIS LEADER?</div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '30px', fontWeight: 700 }}>
                                                    <span style={{ fontSize: '1.1rem' }}>🔒</span> SECRET BALLOT • REQUIRES 2/3 MAJORITY TO PASS
                                                </div>
                                                {isFamilyHead ? (
                                                    <div style={{ display: 'flex', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
                                                        <button onClick={() => handleVoteStrike(strike.id, true)} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: '#e74c3c', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 25px rgba(231, 76, 60, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🗳️</span>
                                                            YES, REMOVE
                                                        </button>
                                                        <button onClick={() => handleVoteStrike(strike.id, false)} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: '#27ae60', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 25px rgba(39, 174, 96, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🛡️</span>
                                                            NO, KEEP IN POST
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: '15px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Only verified Family Heads are eligible to vote in no-confidence motions.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Performance Star System Section */}
                <div className="governance-card" style={{ background: 'var(--bg-card)', padding: '35px', borderRadius: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#FFD700' }}></div>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>⭐ Performance Reputation</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '35px' }}>Recognizing excellence in community leadership.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {(() => {
                            // Define grouping order
                            const groupOrder = ['president', 'vice_president', 'secretary', 'joint_secretary', 'treasurer', 'joint_treasurer', 'executive_member', 'coordinator'];

                            // Group members by position
                            const groupedMembers = committeePerformance.reduce((acc, cp) => {
                                const pos = cp.position || 'other';
                                if (!acc[pos]) acc[pos] = [];
                                acc[pos].push(cp);
                                return acc;
                            }, {});

                            return groupOrder.filter(pos => groupedMembers[pos]).map(pos => (
                                <div key={pos}>
                                    <h4 style={{
                                        margin: '0 0 20px 0',
                                        color: 'var(--primary-blue)',
                                        fontSize: '1.2rem',
                                        fontWeight: 800,
                                        textTransform: 'capitalize',
                                        borderBottom: '2px solid var(--border-color)',
                                        paddingBottom: '10px',
                                        display: 'inline-block'
                                    }}>
                                        {pos.replace(/_/g, ' ')}s
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                                        {groupedMembers[pos].map(cp => (
                                            <div key={cp.id} className="governance-card" style={{ padding: '25px', background: 'var(--bg-page)', borderRadius: '22px', border: '1px solid var(--border-color)', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                                <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 20px' }}>
                                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                                                        {cp.name.charAt(0)}
                                                    </div>
                                                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#FFD700', width: '28px', height: '28px', borderRadius: '50%', border: '3px solid var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>★</div>
                                                </div>
                                                <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontWeight: 800, fontSize: '1.1rem' }}>
                                                    {cp.name}
                                                    {cp.is_founder && <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: '#d97706', verticalAlign: 'middle' }}>🛡️ FOUNDER</span>}
                                                </h4>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '4px' }}>
                                                    {String(cp.position || '').replace(/_/g, ' ').toUpperCase()}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '15px', fontStyle: 'italic' }}>
                                                    {cp.role === 'super_admin' ? 'Foundation Admin' : (cp.role === 'admin' ? 'Administrator' : 'Committee Member')}
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '12px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <span key={star} style={{ fontSize: '1.6rem', color: star <= Math.round(cp.performance.average) ? '#FFD700' : '#E2E8F0', textShadow: star <= Math.round(cp.performance.average) ? '0 0 10px rgba(255, 215, 0, 0.4)' : 'none' }}>★</span>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'inline-block', padding: '4px 12px', background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{cp.performance.average}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>/ 5</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>Based on {cp.performance.total_voters} peer reviews</div>

                                                {isFamilyHead && (
                                                    <button
                                                        onClick={() => {
                                                            setRatingForm({ ...ratingForm, target_user_id: cp.id });
                                                            setIsRatingModalOpen(true);
                                                        }}
                                                        style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                                        onMouseOver={e => { e.target.style.background = 'var(--primary)'; e.target.style.color = 'white'; }}
                                                        onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--primary)'; }}
                                                    >
                                                        ⭐ Submit Rating
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* --- MODALS --- */}
                {isStrikeModalOpen && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '550px', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚖️</div>
                                <h3 style={{ margin: 0, color: '#e74c3c', fontWeight: 900, fontSize: '1.5rem' }}>Removal Motion</h3>
                            </div>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                                    <strong style={{ color: 'var(--text-main)' }}>📋 Process Outline:</strong>
                                    <ul style={{ margin: '8px 0 0 15px', padding: 0 }}>
                                        <li>Initiation requires 25% verified support</li>
                                        <li>Voting phase follows for 72 hours</li>
                                        <li>Secret Ballot: Individual votes are encrypted</li>
                                    </ul>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Target Office Bearer</label>
                                    <select
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
                                        value={strikeForm.target_user_id}
                                        onChange={e => setStrikeForm({ ...strikeForm, target_user_id: e.target.value })}
                                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                    >
                                        <option value="">-- Choose Position Holder --</option>
                                        {committeePerformance.map(cp => <option key={cp.id} value={cp.id}>{cp.name} ({String(cp.position || '').replace(/_/g, ' ')})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Specific Reason/Allegation</label>
                                    <textarea
                                        placeholder="Outline specific misuse of authority, negligence of duties, or violation of samiti constitution..."
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)', height: '140px', outline: 'none', fontSize: '1rem', resize: 'none', transition: 'all 0.2s' }}
                                        value={strikeForm.reason}
                                        onChange={e => setStrikeForm({ ...strikeForm, reason: e.target.value })}
                                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                    />
                                    <div style={{ marginTop: '15px', padding: '18px', background: 'rgba(231, 76, 60, 0.05)', borderRadius: '16px', border: '1px dashed #e74c3c' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                            <strong style={{ color: '#e74c3c', fontSize: '0.85rem', textTransform: 'uppercase' }}>Zero Tolerance for Misuse</strong>
                                        </div>
                                        <p style={{ margin: 0, color: '#c0392b', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            False, malicious, or mass-coordinated unfounded attempts are flagged. The system logs all initiators and co-sponsors for constitutional review.
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                    <button onClick={handleInitiateStrike} style={{ flex: 1.5, padding: '18px', borderRadius: '18px', background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 25px rgba(231, 76, 60, 0.4)', transition: 'all 0.3s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                                        ⚡ File Official Motion
                                    </button>
                                    <button onClick={() => setIsStrikeModalOpen(false)} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: '2px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isRatingModalOpen && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)', textAlign: 'center' }}>
                            <div style={{ width: '70px', height: '70px', background: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 20px' }}>⭐</div>
                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontWeight: 900, fontSize: '1.5rem' }}>Peer Evaluation</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '30px' }}>Your honest feedback for {committeePerformance.find(c => c.id == ratingForm.target_user_id)?.name} helps build a better Samiti.</p>

                            <div style={{ display: 'grid', gap: '25px' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '15px' }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setRatingForm({ ...ratingForm, stars: s })}
                                                className="star-btn"
                                                style={{ fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer', color: s <= ratingForm.stars ? '#FFD700' : '#E2E8F0', transition: 'all 0.2s' }}
                                            >★</button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '50px', background: ratingForm.stars >= 4 ? '#e8f5e9' : (ratingForm.stars >= 3 ? '#fff9c4' : '#ffebee'), color: ratingForm.stars >= 4 ? '#2e7d32' : (ratingForm.stars >= 3 ? '#fbc02d' : '#c62828'), fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                        {['Poor Performance', 'Needs Improvement', 'Satisfactory Work', 'Very Good Leader', 'Outstanding Leadership'][ratingForm.stars - 1]}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', textAlign: 'left', marginBottom: '10px', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>Detailed Feedback (Optional)</label>
                                        <textarea
                                            placeholder="What exactly did this leader do well? Where can they improve?"
                                            style={{ width: '100%', padding: '18px', borderRadius: '20px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)', height: '120px', outline: 'none', fontSize: '1rem', resize: 'none', transition: 'all 0.2s' }}
                                            value={ratingForm.feedback}
                                            onChange={e => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button onClick={handleSubmitRating} style={{ flex: 1.5, padding: '18px', borderRadius: '18px', background: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 25px rgba(241, 196, 15, 0.3)', fontSize: '1rem' }}>
                                            Record Official Evaluation
                                        </button>
                                        <button onClick={() => setIsRatingModalOpen(false)} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: '2px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- NOTIFICATIONS --- */}
                {notification && (
                    <div style={{
                        position: 'fixed', bottom: '30px', right: '30px',
                        background: notification.type === 'error' ? 'rgba(231, 76, 60, 0.98)' : 'rgba(46, 204, 113, 0.98)',
                        backdropFilter: 'blur(10px)', color: 'white', padding: '18px 35px', borderRadius: '20px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '20px',
                        animation: 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            {notification.type === 'error' ? '🚫' : '✅'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.5px' }}>{notification.type === 'error' ? 'ERROR' : 'SUCCESS'}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.95, fontWeight: 500 }}>{notification.message}</div>
                        </div>
                        <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', opacity: 0.7, padding: '5px' }}>×</button>
                    </div>
                )}

                <style>{`
                    @keyframes slideInRight { from { transform: translateX(110%); } to { transform: translateX(0); } }
                    .governance-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                    .governance-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; border-color: var(--primary) !important; }
                    .star-btn:hover { transform: scale(1.2) rotate(15deg); }
                `}</style>
            </div>
        );
    };

    const renderGlobalCollections = () => {
        const isTreasurer = role === 'admin' || user?.position === 'treasurer';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: 'var(--primary)', margin: 0 }}>🌍 Global Collection Campaigns</h2>
                    {isTreasurer && (
                        <div style={{ padding: '15px', background: '#FFF3E0', borderRadius: '12px', border: '1px solid #FFE0B2', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontWeight: 600, color: '#E65100' }}>{approvedAssistance.length} Approved Requests</span>
                            <button
                                onClick={() => setIsCampaignModalOpen(true)}
                                style={{ padding: '8px 15px', background: '#E65100', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Initialize New Collection
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
                    {campaigns.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'white', borderRadius: '15px', border: '2px dashed #eee' }}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>💤</div>
                            <h3 style={{ color: '#94a3b8' }}>No active collections at the moment</h3>
                            <p style={{ color: '#cbd5e1' }}>When a help request is approved, it will appear here for community support.</p>
                        </div>
                    ) : (
                        campaigns.map(camp => (
                            <div key={camp.id || camp._id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '8px', background: 'var(--primary)' }}></div>
                                <div style={{ padding: '25px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <span style={{ padding: '4px 12px', background: '#E3F2FD', color: '#1976D2', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>ACTIVE DRIVE</span>
                                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{camp.created_at?.split('T')[0]}</span>
                                    </div>
                                    <h3 style={{ marginBottom: '10px', color: '#1e293b' }}>{camp.title}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>{camp.description}</p>

                                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Target Goal</span>
                                            <span style={{ fontWeight: 700, color: '#1e293b' }}>₹{camp.target_amount}</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(100, (camp.collected_amount / camp.target_amount) * 100)}%`, height: '100%', background: 'var(--primary)' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>₹{camp.collected_amount} Raised</span>
                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{Math.round((camp.collected_amount / camp.target_amount) * 100)}%</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setSelectedCampaign(camp); setIsProofModalOpen(true); }}
                                        style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        Contribute Now
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Initialization Modal (Treasurer) */}
                {isCampaignModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <h3 style={{ marginBottom: '25px', color: '#1e293b' }}>Start Collection Campaign</h3>
                            <form onSubmit={handleStartCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#64748b' }}>Select Approved Request</label>
                                    <select
                                        required
                                        value={campaignForm.assistance_request_id}
                                        onChange={e => {
                                            const req = approvedAssistance.find(r => r.id === e.target.value);
                                            setCampaignForm({ ...campaignForm, assistance_request_id: e.target.value, title: `Help for ${req?.head_name} (${req?.type})`, target_amount: req?.amount, description: req?.description });
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9' }}
                                    >
                                        <option value="">-- Choose a Request --</option>
                                        {approvedAssistance.map(r => <option key={r.id} value={r.id}>{r.head_name} - ₹{r.amount} ({r.type})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#64748b' }}>Campaign Title</label>
                                    <input required value={campaignForm.title} onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9' }} placeholder="Emergency Medical Support for..." />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#64748b' }}>Target Amount (₹)</label>
                                        <input type="number" required value={campaignForm.target_amount} onChange={e => setCampaignForm({ ...campaignForm, target_amount: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', color: '#64748b' }}>UPI ID</label>
                                        <input required value={campaignForm.upi_id} onChange={e => setCampaignForm({ ...campaignForm, upi_id: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setIsCampaignModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" style={{ padding: '12px 25px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Start Collection</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Contribution Modal */}
                {isProofModalOpen && selectedCampaign && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(10px)' }}>
                        <div style={{ background: 'white', borderRadius: '30px', width: '850px', maxWidth: '95vw', display: 'flex', overflow: 'hidden', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)' }}>
                            {/* Left: Payment Info */}
                            <div style={{ flex: 1, padding: '40px', background: '#f8fafc', borderRight: '1px solid #edf2f7' }}>
                                <h3 style={{ marginBottom: '20px' }}>Scan & Pay</h3>
                                <div style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '10px' }}>Use any UPI App (PhonePe, GPay, Paytm)</p>
                                    <div style={{ width: '220px', height: '220px', background: '#eee', margin: '0 auto 20px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${selectedCampaign.upi_id}%26pn=${selectedCampaign.account_holder}%26am=0%26cu=INR`} alt="QR Code" style={{ width: '180px', borderRadius: '10px' }} />
                                    </div>
                                    <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b', marginBottom: '5px' }}>{selectedCampaign.upi_id}</p>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>A/c: {selectedCampaign.account_holder}</p>
                                </div>
                                <div style={{ marginTop: '25px', padding: '15px', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0 }}><strong>IMPORTANT:</strong> Upload the screenshot below to get your contribution verified and counted in the total.</p>
                                </div>
                            </div>

                            {/* Right: Submission Form */}
                            <div style={{ flex: 1.2, padding: '40px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                    <h3 style={{ margin: 0 }}>Upload Proof</h3>
                                    <button onClick={() => setIsProofModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}>×</button>
                                </div>
                                <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Amount Paid (₹)</label>
                                            <input type="number" required value={proofForm.amount} onChange={e => setProofForm({ ...proofForm, amount: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f1f5f9' }} placeholder="500" />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Trans. ID (Opt.)</label>
                                            <input value={proofForm.transaction_id} onChange={e => setProofForm({ ...proofForm, transaction_id: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f1f5f9' }} placeholder="T24..." />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Payment Screenshot</label>
                                        {!proofForm.screenshot_url ? (
                                            <div style={{ height: '140px', border: '2px dashed #cbd5e1', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', cursor: 'pointer', position: 'relative' }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => handleProofUpload(e.target.files[0])}
                                                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                                />
                                                {isUploadingProof ? <RefreshCw className="animate-spin" /> : <Camera color="#94a3b8" size={32} />}
                                                <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '10px' }}>Click to capture or upload</span>
                                            </div>
                                        ) : (
                                            <div style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', height: '140px' }}>
                                                <img src={resolveUrl(proofForm.screenshot_url)} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button onClick={() => setProofForm({ ...proofForm, screenshot_url: '' })} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>×</button>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Remarks</label>
                                        <textarea value={proofForm.remarks} onChange={e => setProofForm({ ...proofForm, remarks: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f1f5f9', height: '60px' }} placeholder="Any message..."></textarea>
                                    </div>

                                    <button type="submit" disabled={isUploadingProof} style={{ width: '100%', padding: '15px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 800, cursor: isUploadingProof ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
                                        {isUploadingProof ? 'Uploading...' : 'Submit Proof'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCoordinator = () => {
        const coordinator = familyData?.assigned_coordinator;

        return (
            <div className="coordinator-section" style={{ padding: '20px' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '35px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                            🤝
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', fontWeight: 800 }}>Assigned Coordinator</h2>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Your primary point of contact for all administrative matters.</p>
                        </div>
                    </div>

                    {!coordinator ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.5 }}>⏳</div>
                            <h3 style={{ color: '#475569', marginBottom: '10px' }}>Not Yet Assigned</h3>
                            <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                                A coordinator will be assigned to your family by the Secretary once your application moves to the Scrutiny stage.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                            {/* Coordinator Card */}
                            <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', pading: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px' }}>
                                <div style={{
                                    width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem', fontWeight: 800,
                                    marginBottom: '20px', border: '5px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', overflow: 'hidden'
                                }}>
                                    {coordinator.profile_photo ? (
                                        <img src={resolveUrl(coordinator.profile_photo)} alt={coordinator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : coordinator.name.charAt(0)}
                                </div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#1e293b' }}>{coordinator.name}</h3>
                                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>{coordinator.position}</div>

                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'white', borderRadius: '15px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '1.1rem' }}>📞</div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Phone Number</div>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>+91 {coordinator.phone}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'white', borderRadius: '15px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '1.1rem' }}>🆔</div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Coordinator ID</div>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>COORD-{coordinator.id.slice(-6).toUpperCase()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '25px', display: 'flex', gap: '10px', width: '100%' }}>
                                    <a href={`tel:${coordinator.phone}`} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}>Call Now</a>
                                    <a href={`https://wa.me/91${coordinator.phone}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '12px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}>WhatsApp</a>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                                <div style={{ padding: '25px', borderRadius: '20px', background: '#eff6ff', border: '1px solid #dbeafe' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span>💡</span> Role of Your Coordinator
                                    </h4>
                                    <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#1e3a8a', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        <li>Primary verifier for your family details.</li>
                                        <li>Helps with application status updates.</li>
                                        <li>Connects you with the Samiti Committee.</li>
                                        <li>First point of contact for emergency help.</li>
                                    </ul>
                                </div>
                                <div style={{ padding: '25px', borderRadius: '20px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span>⏰</span> When to Contact?
                                    </h4>
                                    <p style={{ margin: 0, color: '#7c2d12', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        Please respect the coordinator's time and try to contact them during standard hours (10 AM - 7 PM), unless it's an emergency.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const canManageRulesLocal = user?.role === 'admin' || user?.role === 'super_admin';


    const renderContent = () => {
        switch (activeTab) {
            case 'funds': return renderFunds();
            case 'contributions': return renderContributions();
            case 'global-collections': return renderGlobalCollections();
            case 'rules': return <RulesManager role={canManageRulesLocal ? 'admin' : user?.role} />;
            case 'accounts': return renderAccounts();
            case 'notices':
            case 'notice-management': return renderNotices();
            case 'audit': return renderAudit();
            case 'inquiries': return renderInquiries();
            case 'roles': return renderRoleManagement();
            case 'committee-members': return renderCommitteeDirectory();
            case 'elections': return renderElections();
            case 'governance': return renderGovernance();
            case 'history': return renderHistory();
            case 'profile':
            case 'settings': return renderProfile();
            case 'nominee': return renderNominees();
            case 'coordinator': return renderCoordinator();
            default: return <div>Select a tab to view content</div>;
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '30px', right: '30px', padding: '15px 30px',
                    background: notification.type === 'error' ? '#ef4444' : '#10b981',
                    color: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    zIndex: 9999, fontWeight: 700, animation: 'slideUp 0.3s ease'
                }}>
                    {notification.type === 'error' ? '❌ ' : '✅ '}
                    {notification.message}
                </div>
            )}
            {renderContent()}
            <style>
                {`
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                `}
            </style>

            {/* Password Verification Modal */}
            {isPasswordModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '450px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔐</div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 800 }}>Admin Authorization</h3>
                            <p style={{ margin: '10px 0 0 0', color: 'var(--text-muted)' }}>Security verification required to change user roles.</p>
                        </div>

                        <form onSubmit={handlePasswordVerify}>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: 'var(--text-main)' }}>Enter Your Password</label>
                                <input
                                    type="password"
                                    autoFocus
                                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid var(--border-color)', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none', transition: 'border-color 0.2s' }}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsPasswordModalOpen(false); setPendingRoleChange(null); }}
                                    style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: 'var(--bg-page)', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 20px rgba(230, 126, 34, 0.25)' }}
                                >
                                    Verify & Change
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommonDashboardContent;
