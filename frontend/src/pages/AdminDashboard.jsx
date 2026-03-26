import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import CommonDashboardContent from '../components/dashboard/CommonDashboardContent';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getRoleLabel } from '../utils/roleHelper';
import { useTheme } from '../context/ThemeContext';

import {
    LayoutDashboard,
    BookOpen,
    UserPlus,
    ClipboardList,
    HeartHandshake,
    Edit3,
    ShieldCheck,
    PieChart,
    Bell,
    Vote,
    History,
    UserCircle,
    Users,
    X,
    Eye,
    Plus
} from 'lucide-react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import MemberDetailModal from '../components/MemberDetailModal';

const AdminDashboard = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const activeTab = tab || 'overview';

    const cleanName = (name) => {
        if (!name) return '';
        return name.replace(/Member\s+\d+\s+of\s+.*/i, 'Member').replace(/Member\s+of\s+.*/i, 'Member');
    };

    const [families, setFamilies] = useState([]);
    const [requests, setRequests] = useState([]);
    const [memberRequests, setMemberRequests] = useState([]);
    const [updateRequests, setUpdateRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    console.log("DEBUG Dashboard - families count:", families.length);
    console.log("DEBUG Dashboard - loading:", loading);
    const [coordinators, setCoordinators] = useState([]);
    const [selectedAssignments, setSelectedAssignments] = useState({});
    const [viewFamily, setViewFamily] = useState(null);
    const [adminFamilySearch, setAdminFamilySearch] = useState('');
    const [adminFamilyFilter, setAdminFamilyFilter] = useState('All');
    const [adminMemberSearch, setAdminMemberSearch] = useState('');
    const [adminMemberFilter, setAdminMemberFilter] = useState('All');
    const [modalViewMode, setModalViewMode] = useState('overview'); // overview, members, tree
    const [selectedMember, setSelectedMember] = useState(null);

    // Help Request Modal State
    const [helpModal, setHelpModal] = useState({ open: false, familyId: null, familyName: '' });
    const [helpForm, setHelpForm] = useState({ type: 'Medical', amount: '', description: '' });

    // Verification Modal State
    const [verifyModal, setVerifyModal] = useState({ open: false, family: null, stage: null });
    const [verifyRemark, setVerifyRemark] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));

    const [financeStats, setFinanceStats] = useState(null);
    const [sharedDataLoaded, setSharedDataLoaded] = useState(false);

    const { themeMode, setThemeMode, primaryColor, setPrimaryColor, colorPalettes, fontOptions, fontFamily, setFontFamily, fontSize, setFontSize, borderRadius, setBorderRadius } = useTheme();
    const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passForm.new !== passForm.confirm) return alert("New passwords do not match!");
        try {
            await api.changePassword({ old_password: passForm.old, new_password: passForm.new });
            alert("Password Changed Successfully!");
            setPassForm({ old: '', new: '', confirm: '' });
        } catch (err) {
            alert("Failed: " + (err.response?.data?.detail || err.message));
        }
    };

    const handlePhotoUpload = async () => {
        if (!profilePhotoFile) return;
        try {
            const formData = new FormData();
            formData.append('file', profilePhotoFile);
            const res = await api.uploadFile(formData);
            const url = res.data.url;
            await api.updateProfilePhoto(url);

            // Update local user object
            const updatedUser = { ...user, profile_photo: url }; // partial update for session
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert("Profile Photo Updated! Refresh to see changes globally.");
            window.location.reload();
        } catch (err) {
            alert("Upload Failed: " + (err.message));
        }
    };

    const renderHelpModal = () => {
        if (!helpModal.open) return null;
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--primary-blue)' }}>Create Help Request</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>For family: <strong>{helpModal.familyName || 'Unknown'}</strong></p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>Assistance Type</label>
                            <select
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                value={helpForm.type}
                                onChange={e => setHelpForm({ ...helpForm, type: e.target.value })}
                            >
                                <option value="Medical">Medical Emergency</option>
                                <option value="Marriage">Marriage Assistance</option>
                                <option value="Education">Education Support</option>
                                <option value="Death">Death/Funeral Support</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>Amount Needed (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                value={helpForm.amount}
                                onChange={e => setHelpForm({ ...helpForm, amount: e.target.value })}
                                placeholder="Enter amount"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '0.9rem' }}>Description / Reason</label>
                            <textarea
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px', resize: 'vertical' }}
                                value={helpForm.description}
                                onChange={e => setHelpForm({ ...helpForm, description: e.target.value })}
                                placeholder="Explain why assistance is needed..."
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px' }}>
                        <button
                            onClick={() => setHelpModal({ ...helpModal, open: false })}
                            style={{ padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateHelpRequest}
                            style={{ padding: '10px 20px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Submit Request
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        // Initial load of shared/basic data
        const loadInitial = async () => {
            try {
                // Shared data could be minimal stuff
                // For now, let's just make fetchData smarter
                await fetchData();
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
    }, []);

    // Also re-fetch when tab changes if data is missing
    useEffect(() => {
        if (!loading) {
            fetchTabData(activeTab);
        }
    }, [activeTab, loading]);

    useEffect(() => {
        if (viewFamily) setModalViewMode('overview');
    }, [viewFamily]);

    const fetchTabData = async (currentTab, force = false) => {
        try {
            if ((currentTab === 'families' || currentTab === 'family-list' || currentTab === 'pending-registrations') && (families.length === 0 || force)) {
                const res = await api.getFamilies();
                setFamilies(res.data || []);
            }
            if (currentTab === 'requests' && requests.length === 0) {
                const res = await api.getAssistanceRequests();
                setRequests(res.data || []);
            }
            if (currentTab === 'updates' && updateRequests.length === 0) {
                const res = api.getAllUpdateRequests ? await api.getAllUpdateRequests() : { data: [] };
                setUpdateRequests(res.data || []);
            }
            if (memberRequests.length === 0) {
                const res = await api.getMemberRequests();
                setMemberRequests(res.data || []);
            }
            // Add more tab-specific fetches here
        } catch (err) {
            console.error(`Error fetching data for tab ${currentTab}`, err);
            // alert(`Failed to load data for ${currentTab}: ` + (err.response?.data?.detail || err.message)); // Optional: might get annoying
        }
    };

    const [hasActiveCommittee, setHasActiveCommittee] = useState(false);

    // ... (existing code)

    const fetchData = async () => {
        try {
            // Only fetch what's needed for the INITIAL view (Overview)
            // Overview needs: families (for counts), requests (for counts), financeStats, notices
            console.log("DEBUG: Starting fetchData...");

            const [famRes, reqRes, finRes, userRes] = await Promise.all([
                api.getFamilies().catch((err) => {
                    console.error("ERROR fetching families:", err.response?.data || err.message);
                    return { data: [] };
                }),
                api.getAssistanceRequests().catch((err) => {
                    console.error("ERROR fetching requests:", err.response?.data || err.message);
                    return { data: [] };
                }),
                api.getFinanceStats().catch((err) => {
                    console.error("ERROR fetching finance stats:", err.response?.data || err.message);
                    return { data: {} };
                }),
                api.getUsers().catch((err) => {
                    console.error("ERROR fetching users:", err.response?.data || err.message);
                    return { data: [] };
                })
            ]);

            console.log("DEBUG fetchData - api.getFamilies response:", famRes.data);
            console.log("DEBUG fetchData - families count:", famRes.data?.length || 0);
            setFamilies(famRes.data || []);
            setRequests(reqRes.data || []);
            setFinanceStats(finRes?.data || null);

            const allUsers = userRes.data || [];
            const committee = allUsers.filter(u =>
                u.role === 'coordinator' || u.position === 'coordinator'
            );
            setCoordinators(committee);

            // Check if essential committee posts are filled (President/Secretary)
            const activeOfficials = allUsers.filter(u => ['president', 'secretary', 'treasurer'].includes(u.position));
            setHasActiveCommittee(activeOfficials.length > 0);

            // Other data (memberRequests, updateRequests) can be fetched lazily
            setSharedDataLoaded(true);
        } catch (err) {
            console.error("Error fetching initial admin data", err);
            alert("Failed to load dashboard data: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ... (existing code)

    const renderViewFamilyModal = () => {
        if (!viewFamily) return null;
        const fam = viewFamily;

        const displayMembers = [
            {
                ...(fam.head_details || {}),
                relation: 'Family Head (Self)',
                member_id: (fam.family_id || fam.family_unique_id || 'PENDING') + '-H01',
                gender: fam.head_details?.gender || 'Male',
                full_name: fam.head_details?.full_name || fam.head_name,
                isHead: true
            },
            ...(fam.members || [])
        ];

        // Permissions for Modal Actions
        const isCoordinator = user?.role === 'admin' || user?.role === 'super_admin' || user?.position === 'coordinator';
        const isAssignedCoord = fam.coordinator_id === user.id;
        const isPresident = ['president', 'vice_president'].includes(user?.position);
        const isSecretary = ['secretary', 'joint_secretary'].includes(user?.position);
        const isSuperAdmin = user?.role === 'super_admin';
        const isAdmin = user?.role === 'admin';

        // Interim Admin Power: If NO committee exists, Admin acts as all officials
        const canVerify =
            isSuperAdmin ||
            (isAdmin && !hasActiveCommittee) ||
            (hasActiveCommittee && (
                (fam.verification_stage === 'Recommender Verification' && fam.recommender_id === user.id) ||
                (fam.verification_stage === 'President Scrutiny' && isPresident) ||
                (fam.verification_stage === 'Secretary Scrutiny' && isSecretary) ||
                (fam.verification_stage === 'Coordinator Scrutiny' && (isAssignedCoord || isSecretary)) ||
                (fam.verification_stage === 'President Approval' && isPresident)
            ));

        const showAssign = fam.status === 'Pending' && fam.verification_stage === 'Secretary Scrutiny' && (isSecretary || (!hasActiveCommittee && isAdmin));

        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                <div style={{ background: 'white', borderRadius: '16px', width: '95%', maxWidth: '1000px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

                    {/* Header */}
                    <div style={{ padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem', fontWeight: 900 }}>Application Profile</h2>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>ID: {fam.family_unique_id || 'Pending'} | {fam.status}</span>
                        </div>
                        <button onClick={() => setViewFamily(null)} style={{ background: '#e2e8f0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', fontWeight: 800, fontSize: '1.2rem' }}>&times;</button>
                    </div>

                    {/* Modal Tabs */}
                    <div style={{ display: 'flex', gap: '20px', padding: '0 30px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                        {[
                            { id: 'overview', label: 'Admin Overview', icon: '📝' },
                            { id: 'members', label: 'Member Tiles', icon: '👥' },
                            { id: 'tree', label: 'Family Tree', icon: '🌳' }
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setModalViewMode(m.id)}
                                style={{
                                    padding: '15px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: modalViewMode === m.id ? '3px solid var(--primary-blue)' : '3px solid transparent',
                                    color: modalViewMode === m.id ? 'var(--primary-blue)' : '#64748b',
                                    fontWeight: modalViewMode === m.id ? 800 : 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                                <span style={{ fontSize: '0.9rem' }}>{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div style={{ padding: '30px', overflowY: 'auto', flex: 1, background: modalViewMode === 'tree' ? '#fdf8e6' : 'white' }}>

                        {modalViewMode === 'overview' && (
                            <>
                                {/* Status Banner */}
                                <div style={{ marginBottom: '30px', padding: '15px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#92400e' }}>
                                    <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Current Stage: {fam.verification_stage || 'Finalized'}</div>
                                        <div style={{ fontSize: '0.9rem' }}>Status: {fam.status}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                    {/* Head Details */}
                                    <div>
                                        <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', color: 'var(--primary-blue)', fontSize: '1.1rem' }}>Family Head</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Name</strong> {fam.head_details?.full_name || fam.head_name || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Father/Husband</strong> {fam.head_details?.father_name || fam.head_details?.father_husband_name || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>DOB</strong> {fam.head_details?.dob || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Gender</strong> {fam.head_details?.gender || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Marital Status</strong> {fam.head_details?.marital_status || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Blood Group</strong> {fam.head_details?.blood_group || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Mobile</strong> {fam.head_details?.mobile || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>WhatsApp</strong> {fam.head_details?.whatsapp || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Email</strong> {fam.head_details?.email || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Aadhaar</strong> {fam.head_details?.aadhaar || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Occupation</strong> {fam.head_details?.occupation || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Income Range</strong> {fam.head_details?.income_range || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Designation</strong> {fam.head_details?.designation || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Organization</strong> {fam.head_details?.organization || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Sector</strong> {fam.head_details?.sector || 'N/A'}</div>
                                             <div><strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Family Type</strong> {fam.head_details?.family_type || 'N/A'}</div>
                                         </div>
                                         <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                                             <div style={{ fontWeight: 600, color: '#475569', marginBottom: '5px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Nominee</div>
                                             <div>{fam.head_details?.nominee_name || fam.nominee_details?.nominees?.[0]?.full_name || 'N/A'} ({fam.head_details?.nominee_relation || fam.nominee_details?.nominees?.[0]?.relation || '-'})</div>
                                             <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Mobile: {fam.head_details?.nominee_mobile || fam.nominee_details?.nominees?.[0]?.mobile || 'N/A'}</div>
                                         </div>
                                         <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                                             <div style={{ fontWeight: 600, color: '#475569', marginBottom: '5px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Emergency Contact</div>
                                             <div>{fam.head_details?.emergency_name || fam.nominee_details?.emergency_name || 'N/A'}</div>
                                             <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{fam.head_details?.emergency_number || fam.nominee_details?.emergency_mobile || 'N/A'}</div>
                                         </div>
                                         {fam.head_details?.education_history?.length > 0 && (
                                             <div style={{ fontSize: '0.9rem' }}>
                                                 <div style={{ fontWeight: 600, color: '#475569', marginBottom: '5px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Highest Education</div>
                                                 <div>{fam.head_details.education_history[fam.head_details.education_history.length - 1]?.level}</div>
                                                 <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{fam.head_details.education_history[fam.head_details.education_history.length - 1]?.board_university}</div>
                                             </div>
                                         )}
                                     </div>
                                </div>

                                <div style={{ marginTop: '30px' }}>
                                    <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px', color: 'var(--primary-blue)', fontSize: '1.1rem' }}>Workflow History</h3>
                                    {fam.remarks && fam.remarks.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {fam.remarks.map((log, idx) => (
                                                <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-blue)', fontSize: '0.85rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                                        <strong style={{ color: '#1e293b' }}>{log.action || log.stage}</strong>
                                                        <span style={{ color: '#64748b' }}>{new Date(log.date).toLocaleString()}</span>
                                                    </div>
                                                    <div>By: {log.by} ({log.role})</div>
                                                    {log.remark && <div style={{ marginTop: '8px', fontStyle: 'italic', background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>"{log.remark}"</div>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>No history available.</p>}
                                </div>
                            </>
                        )}

                        {modalViewMode === 'members' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {displayMembers.map((mem, idx) => (
                                    <div key={idx}
                                        onClick={() => setSelectedMember(mem)}
                                        style={{
                                            background: mem.isHead ? 'linear-gradient(135deg, #fff 0%, #f0f7ff 100%)' : 'white',
                                            border: mem.isHead ? '2px solid var(--primary-blue)' : '1px solid #e2e8f0',
                                            borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        {mem.isHead && <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '0.7rem', background: 'var(--primary-blue)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontWeight: 800 }}>HEAD</div>}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: mem.gender === 'Female' ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                                {mem.gender === 'Female' ? '👩' : '👨'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>{cleanName(mem.full_name)}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{mem.relation}</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
                                            <div><strong style={{ color: '#94a3b8', display: 'block' }}>DOB</strong> {mem.dob}</div>
                                            <div><strong style={{ color: '#94a3b8', display: 'block' }}>Education</strong> {mem.education_level || mem.education || 'N/A'}</div>
                                            <div style={{ gridColumn: '1/-1' }}><strong style={{ color: '#94a3b8', display: 'block' }}>Occupation</strong> {mem.occupation_type || mem.occupation || 'N/A'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {modalViewMode === 'tree' && (
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '800px' }}>
                                    {(() => {
                                        const head = displayMembers.find(m => m.isHead);
                                        const spouse = displayMembers.find(m => m.relation === 'Wife' || m.relation === 'Husband');
                                        const children = displayMembers.filter(m => m.relation === 'Son' || m.relation === 'Daughter');
                                        const parents = displayMembers.filter(m => m.relation === 'Father' || m.relation === 'Mother');

                                        return (
                                            <>
                                                {/* Parent Generation */}
                                                {parents.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                                                        {parents.map((p, i) => (
                                                            <div key={i} onClick={() => setSelectedMember(p)} style={{ background: 'white', padding: '15px 25px', borderRadius: '14px', border: '2px solid #ddd', cursor: 'pointer', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                                                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{p.gender === 'Female' ? '👵' : '👴'}</div>
                                                                <div style={{ fontWeight: 800 }}>{cleanName(p.full_name)}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.relation}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Current Generation */}
                                                <div style={{ display: 'flex', gap: '50px', alignItems: 'center', marginBottom: '50px', position: 'relative' }}>
                                                    <div onClick={() => setSelectedMember(head)} style={{ background: 'linear-gradient(135deg, #ffd700, #f9a825)', padding: '25px 40px', borderRadius: '20px', border: '4px solid #b8860b', cursor: 'pointer', textAlign: 'center', boxShadow: '0 12px 24px rgba(212, 175, 55, 0.3)', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '2.5rem' }}>👑</div>
                                                        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a1a1a' }}>{cleanName(head.full_name)}</div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#5d4037' }}>Family Head</div>
                                                    </div>
                                                    {spouse && (
                                                        <>
                                                            <div style={{ width: '50px', height: '4px', background: '#b8860b', position: 'relative' }}>
                                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.5rem' }}>💑</div>
                                                            </div>
                                                            <div onClick={() => setSelectedMember(spouse)} style={{ background: 'white', padding: '20px 35px', borderRadius: '20px', border: '4px solid #b8860b', cursor: 'pointer', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                                                                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👩</div>
                                                                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{cleanName(spouse.full_name)}</div>
                                                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{spouse.relation}</div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Children Generation */}
                                                {children.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                        {children.map((c, i) => (
                                                            <div key={i} onClick={() => setSelectedMember(c)} style={{ background: 'white', padding: '18px 30px', borderRadius: '16px', border: '2px solid #ddd', cursor: 'pointer', textAlign: 'center', boxShadow: '0 6px 15px rgba(0,0,0,0.05)' }}>
                                                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{c.gender === 'Female' ? '👧' : '👦'}</div>
                                                                <div style={{ fontWeight: 800 }}>{cleanName(c.full_name)}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.relation}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ padding: '20px 30px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                        <button onClick={() => setViewFamily(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Close Profile</button>

                        {fam.status !== 'Approved' && (
                            <>
                                {showAssign && (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 700 }}>⚠️ Assign via Dashboard Tab</span>
                                    </div>
                                )}

                                {!showAssign && canVerify && (
                                    fam.verification_stage === 'President Approval' ? (
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Confirm Final Approval?")) {
                                                    handleApproveFamily(fam._id);
                                                    setViewFamily(null);
                                                }
                                            }}
                                            style={{ padding: '12px 30px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem' }}
                                        >
                                            ✅ Final Approval
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setVerifyModal({ open: true, family: fam, stage: fam.verification_stage });
                                                setVerifyRemark('');
                                            }}
                                            style={{ padding: '12px 30px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem' }}
                                        >
                                            ✓ Verify & Forward
                                        </button>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // --- FAMILY ACTIONS ---
    const handleVerifyStage = async (id, remark, currentStage) => {
        try {
            await api.verifyFamilyStage(id, { remarks: remark, current_stage: currentStage });
            alert("Verification Stage Processed Successfully!");
            if (activeTab === 'family-list' || activeTab === 'overview' || activeTab === 'pending-registrations') fetchTabData(activeTab, true);
            setVerifyModal({ open: false, family: null, stage: null });
            setVerifyRemark('');
            setViewFamily(null);
        } catch (err) {
            alert("Verification Failed: " + (err.response?.data?.detail || err.message));
        }
    };

    const handleApproveFamily = async (id) => {
        try {
            await api.approveFamily(id);
            alert("Family Approved Successfully!");
            if (activeTab === 'family-list' || activeTab === 'overview' || activeTab === 'pending-registrations') fetchTabData(activeTab);
            setViewFamily(null);
        } catch (err) {
            alert("Approval Failed: " + (err.response?.data?.detail || err.message));
        }
    };

    // Help Request Handler
    const handleCreateHelpRequest = async () => {
        try {
            if (!helpForm.amount || !helpForm.description) return alert("Please fill all details!");

            const requestData = {
                family_id: helpModal.familyId,
                request_type: helpForm.type,
                amount: parseInt(helpForm.amount),
                description: helpForm.description
            };

            await api.createAssistanceRequest(requestData);
            alert("Help Request Created Successfully!");
            setHelpModal({ ...helpModal, open: false });
            setHelpForm({ type: 'Medical', amount: '', description: '' });
            // Ideally trigger refresh of requests list
            fetchTabData('requests');
        } catch (err) {
            console.error("Failed to create help request", err);
            alert("Failed: " + (err.response?.data?.detail || err.message));
        }
    };

    const renderVerifyModal = () => {
        if (!verifyModal.open || !verifyModal.family) return null;
        const fam = verifyModal.family;

        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                <div style={{ background: 'white', borderRadius: '20px', width: '95%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '20px 30px', background: 'var(--primary-blue)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Verify Application: {fam.head_name}</h3>
                        <button onClick={() => setVerifyModal({ open: false, family: null, stage: null })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '5px' }}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary-blue)' }}>Identity Overview</h4>
                                    <button
                                        onClick={() => setViewFamily(fam)}
                                        title="View Full Profile"
                                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#1e40af', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600 }}
                                    >
                                        <Eye size={14} /> View Bio
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                    <p style={{ margin: 0 }}><strong>Head Name:</strong> {fam.head_name || fam.head_details?.full_name || 'N/A'}</p>
                                    <p style={{ margin: 0 }}><strong>Father/Husband:</strong> {fam.father_name || fam.head_details?.father_name || fam.head_details?.father_husband_name || 'N/A'}</p>
                                    <p style={{ margin: 0 }}><strong>Mobile:</strong> {fam.mobile || fam.head_details?.mobile || 'N/A'}</p>
                                    <p style={{ margin: 0 }}><strong>Current Stage:</strong> <span style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>{fam.verification_stage}</span></p>
                                    <p style={{ margin: 0 }}><strong>Origin:</strong> {fam.registration_method || 'Direct'}</p>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ marginTop: 0, color: 'var(--primary-blue)', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Family Strength</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                                    <p style={{ margin: 0 }}><strong>Total Members:</strong> {fam.members?.length || 0}</p>
                                    <p style={{ margin: 0 }}><strong>Coordinator:</strong> {fam.coordinator_name || 'Not Assigned'}</p>
                                    {fam.recommender_name && <p style={{ margin: 0 }}><strong>Recommended By:</strong> {fam.recommender_name}</p>}
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                            <h4 style={{ marginTop: 0, color: 'var(--primary-blue)', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Verification Remark</h4>
                            <textarea
                                value={verifyRemark}
                                onChange={(e) => setVerifyRemark(e.target.value)}
                                placeholder="Enter your verification observations, remarks or instructions for the next stage..."
                                style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }}
                            />
                        </div>

                        {/* Summary of members if possible */}
                        {fam.members && fam.members.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>Family Members ({fam.members.length})</h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                                <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Name</th>
                                                <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Relationship</th>
                                                <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Age/DOB</th>
                                                <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Occupation</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fam.members.map((m, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{m.full_name || m.name || 'N/A'}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{m.relation || m.relationship || 'N/A'}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{m.dob || m.age || 'N/A'}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{m.occupation || m.occupation_type || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '20px 30px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                        <button
                            onClick={() => setVerifyModal({ open: false, family: null, stage: null })}
                            style={{ padding: '12px 25px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleVerifyStage(fam._id, verifyRemark, fam.verification_stage)}
                            style={{ padding: '12px 30px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            ✓ Confirm & Forward to Next Stage
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- TAB CONFIGURATION ---
    const allTabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} />, allowed: ['all'] },
        { id: 'pending-registrations', label: 'Pending Registrations', icon: <UserPlus size={20} />, allowed: ['admin', 'super_admin', 'president', 'vice_president', 'secretary', 'joint_secretary', 'coordinator'] },
        { id: 'family-list', label: 'Family Directory', icon: <Users size={20} />, allowed: ['admin', 'super_admin', 'president', 'vice_president', 'secretary', 'joint_secretary', 'treasurer', 'executive_member', 'coordinator'] },
        { id: 'requests', label: 'Help Requests', icon: <HeartHandshake size={20} />, allowed: ['admin', 'super_admin', 'president', 'vice_president', 'secretary', 'joint_secretary', 'treasurer'] },
        { id: 'updates', label: 'Profile Updates', icon: <Edit3 size={20} />, allowed: ['admin', 'super_admin', 'secretary', 'joint_secretary'] },
        { id: 'funds', label: 'Finance & Funds', icon: <PieChart size={20} />, allowed: ['admin', 'super_admin', 'treasurer', 'president', 'secretary', 'auditor'] },
        { id: 'notices', label: 'Notices', icon: <Bell size={20} />, allowed: ['admin', 'super_admin', 'president', 'secretary', 'joint_secretary'] },
        { id: 'roles', label: 'Committee Roles', icon: <ShieldCheck size={20} />, allowed: ['admin', 'super_admin', 'president'] },
        { id: 'committee-members', label: 'Committee Directory', icon: <Users size={20} />, allowed: ['admin', 'super_admin', 'president', 'secretary', 'treasurer', 'executive_member', 'coordinator'] },
        { id: 'governance', label: 'Governance', icon: <Vote size={20} />, allowed: ['admin', 'super_admin', 'president', 'secretary', 'legal_advisor'] },
        { id: 'audit', label: 'Audit Logs', icon: <ClipboardList size={20} />, allowed: ['admin', 'super_admin', 'auditor', 'president'] },
        { id: 'history', label: 'System History', icon: <History size={20} />, allowed: ['admin', 'super_admin'] },
        { id: 'profile', label: 'My Profile', icon: <UserCircle size={20} />, allowed: ['all'] },
    ];

    const filteredTabs = allTabs.filter(tab => {
        if (!tab.allowed || tab.allowed.includes('all')) return true;
        // Check if user role or position is in allowed list
        return (tab.allowed && (tab.allowed.includes(user?.role) || (user?.position && tab.allowed.includes(user?.position))));
    });

    return (
        <>
            <DashboardLayout
                role={user?.role}
                title={getRoleLabel(user?.role)}
                showTitle={false}
                sidebarMenuItems={filteredTabs}
                activeTabValue={activeTab}
                banner={(
                    <div style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        padding: '16px 32px',
                        borderRadius: '0',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: 'white',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'rgba(255,255,255,0.15)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.75rem',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                🏛️
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.85, marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 500 }}>Committee Dashboard</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                    {user?.position ? user.position.replace(/_/g, ' ').toUpperCase() : user?.role.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '2px' }}>
                                    {user?.name}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            letterSpacing: '0.3px'
                        }}>
                            🔐 Admin Access
                        </div>
                    </div>
                )}
            >
                <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                    {loading && !sharedDataLoaded ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Synchronizing Dashboard Intelligence...</p>
                        </div>
                    ) : (
                        <>
                            {/* Common Tab Content */}
                            {['funds', 'contributions', 'rules', 'accounts', 'notices', 'notice-management', 'profile', 'audit', 'inquiries', 'elections', 'history', 'roles', 'governance', 'committee-members'].includes(activeTab) && (
                                <CommonDashboardContent activeTab={activeTab} role={user?.role} user={user} />
                            )}


                            {activeTab === 'overview' && (
                                <DashboardOverview
                                    role={user?.role}
                                    user={user}
                                    initialData={{
                                        stats: {
                                            totalMembers: families.reduce((acc, f) => acc + (f.members?.length || 0), 0),
                                            activeFamilies: families.length,
                                            pendingRequests: requests.filter(r => r.status === 'Pending').length,
                                            pendingApprovals: families.filter(f => f.status === 'Pending').length,
                                            pendingMemberRequests: memberRequests.length,
                                            totalFunds: financeStats?.total_collected || 0,
                                            pendingExpenses: financeStats?.pending_expenses_count || 0,
                                            activeCollections: financeStats?.active_collections_breakdown || []
                                        }
                                    }}
                                />
                            )}

                            {activeTab === 'family-list' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                                        <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900 }}>Family Directory</h2>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder="Search by Name or ID..."
                                                value={adminFamilySearch}
                                                onChange={(e) => setAdminFamilySearch(e.target.value)}
                                                style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', width: '250px' }}
                                            />
                                            <select
                                                value={adminFamilyFilter}
                                                onChange={(e) => setAdminFamilyFilter(e.target.value)}
                                                style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd' }}
                                            >
                                                <option value="All">All Status</option>
                                                <option value="Approved">Active Members</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                            <span style={{ padding: '6px 14px', background: 'var(--sidebar-accent)', borderRadius: '10px', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
                                                {families.length} Records
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                        {families.length === 0 ? (
                                            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white' }}>
                                                <div style={{
                                                    width: '80px', height: '80px', background: '#f8fafc', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    margin: '0 auto 20px', color: '#94a3b8'
                                                }}>
                                                    <Users size={40} />
                                                </div>
                                                <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '8px', fontWeight: 800 }}>No family records found</h3>
                                                <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                                                    Your family directory is currently empty.
                                                </p>
                                            </div>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead style={{ position: 'sticky', top: '-30px', zIndex: 10, background: 'var(--bg-page)' }}>
                                                    <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        <th style={{ padding: '20px' }}>Family ID</th>
                                                        <th style={{ padding: '20px' }}>Family Head / Name</th>
                                                        <th style={{ padding: '20px' }}>Status</th>
                                                        <th style={{ padding: '20px' }}>Current Stage</th>
                                                        <th style={{ padding: '20px' }}>Members</th>
                                                        <th style={{ padding: '20px' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {families
                                                        .filter(f => {
                                                            const name = f.head_details?.full_name || f.head_name || '';
                                                            const id = f.family_unique_id || '';
                                                            const matchesSearch = name.toLowerCase().includes(adminFamilySearch.toLowerCase()) ||
                                                                id.toLowerCase().includes(adminFamilySearch.toLowerCase());
                                                            const matchesFilter = adminFamilyFilter === 'All' || f.status === adminFamilyFilter;
                                                            return matchesSearch && matchesFilter;
                                                        })
                                                        .map(fam => (
                                                            <tr key={fam._id || fam.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                                                <td style={{ padding: '20px', fontWeight: 600 }}>{fam.family_unique_id || 'PENDING'}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>{cleanName(fam.head_details?.full_name || fam.head_name)}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fam.head_details?.mobile || 'No Mobile'}</div>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <span style={{
                                                                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                                                        background: fam.status === 'Approved' ? '#DEF7EC' : fam.status === 'Rejected' ? '#FEE2E2' : '#FFF3C4',
                                                                        color: fam.status === 'Approved' ? '#03543F' : fam.status === 'Rejected' ? '#991B1B' : '#B7791F'
                                                                    }}>
                                                                        {fam.status}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '20px', fontSize: '0.85rem' }}>{fam.verification_stage || 'Finalized'}</td>
                                                                <td style={{ padding: '20px', fontWeight: 600 }}>{(fam.members?.length || 0) + 1}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <button
                                                                        onClick={() => setViewFamily(fam)}
                                                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                                                                    >
                                                                        👁️ View Details
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'member-directory' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                                        <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900 }}>Member Directory</h2>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <input
                                                type="text"
                                                placeholder="Search Name, ID or Phone..."
                                                value={adminMemberSearch}
                                                onChange={(e) => setAdminMemberSearch(e.target.value)}
                                                style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', width: '250px' }}
                                            />
                                            <select
                                                value={adminMemberFilter}
                                                onChange={(e) => setAdminMemberFilter(e.target.value)}
                                                style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd' }}
                                            >
                                                <option value="All">All Roles</option>
                                                <option value="Head">Family Heads</option>
                                                <option value="Member">General Members</option>
                                                <option value="Student">Students</option>
                                                <option value="Employed">Employed</option>
                                                <option value="Business">Business</option>
                                            </select>
                                            <span style={{ padding: '6px 14px', background: 'var(--sidebar-accent)', borderRadius: '10px', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
                                                {families.reduce((acc, f) => acc + (f.members?.length || 0) + 1, 0)} Individuals
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                        {families.length === 0 ? (
                                            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white' }}>
                                                <div style={{
                                                    width: '80px', height: '80px', background: '#f8fafc', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    margin: '0 auto 20px', color: '#94a3b8'
                                                }}>
                                                    <Users size={40} />
                                                </div>
                                                <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '8px', fontWeight: 800 }}>No members found</h3>
                                                <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                                                    There are no individual member records available. Members are automatically listed here once a family is registered.
                                                </p>
                                                <button
                                                    onClick={() => navigate('/signup')}
                                                    style={{
                                                        padding: '10px 20px', background: 'var(--primary-blue)', color: 'white',
                                                        border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto'
                                                    }}
                                                >
                                                    <Plus size={18} /> Register First Family
                                                </button>
                                            </div>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead style={{ position: 'sticky', top: '-30px', zIndex: 10, background: 'var(--bg-page)' }}>
                                                    <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        <th style={{ padding: '20px' }}>S.No</th>
                                                        <th style={{ padding: '20px' }}>Member Card</th>
                                                        <th style={{ padding: '20px' }}>Member No</th>
                                                        <th style={{ padding: '20px' }}>Family Info</th>
                                                        <th style={{ padding: '20px' }}>Contact</th>
                                                        <th style={{ padding: '20px' }}>Occupation</th>
                                                        <th style={{ padding: '20px' }}>Education</th>
                                                        <th style={{ padding: '20px' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {families.flatMap(f => {
                                                        const head = { ...f.head_details, is_head: true, family_id: f.family_unique_id, family_name: f.head_details?.full_name || f.head_name };
                                                        const members = (f.members || []).map(m => ({ ...m, is_head: false, family_id: f.family_unique_id, family_name: f.head_details?.full_name || f.head_name }));

                                                        // Sort by DOB (oldest first)
                                                        const allSorted = [head, ...members].sort((a, b) => {
                                                            const dateA = a.dob ? new Date(a.dob) : new Date('9999-12-31');
                                                            const dateB = b.dob ? new Date(b.dob) : new Date('9999-12-31');
                                                            return dateA - dateB;
                                                        });

                                                        return allSorted.map((p, idx) => ({ ...p, ageRank: idx + 1 }));
                                                    })
                                                        .filter(m => {
                                                            const search = adminMemberSearch.toLowerCase();
                                                            const matchesSearch = (m.full_name || '').toLowerCase().includes(search) ||
                                                                (m.family_id || '').toLowerCase().includes(search) ||
                                                                (m.mobile || '').includes(search);

                                                            let matchesFilter = true;
                                                            if (adminMemberFilter === 'Head') matchesFilter = m.is_head;
                                                            if (adminMemberFilter === 'Member') matchesFilter = !m.is_head;
                                                            if (adminMemberFilter === 'Student') matchesFilter = m.occupation_type === 'Student';
                                                            if (adminMemberFilter === 'Employed') matchesFilter = m.occupation_type === 'Employed';
                                                            if (adminMemberFilter === 'Business') matchesFilter = m.occupation_type === 'Business';

                                                            return matchesSearch && matchesFilter;
                                                        })
                                                        .map((m, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                                                <td style={{ padding: '20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                                    {idx + 1}
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: m.is_head ? 'var(--primary-blue)' : '#f1f5f9', color: m.is_head ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                                                                            {cleanName(m.full_name).charAt(0) || 'U'}
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                {cleanName(m.full_name)}
                                                                                {m.is_head && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>HEAD</span>}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.relation || 'Self'}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        background: 'var(--sidebar-accent)',
                                                                        color: 'var(--primary-blue)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.85rem'
                                                                    }}>
                                                                        #{m.ageRank}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '0.85rem' }}>{m.family_id}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.family_name}</div>
                                                                </td>
                                                                <td style={{ padding: '20px', fontSize: '0.85rem' }}>{m.mobile || '—'}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{m.occupation_type || '—'}</span>
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.designation || ''}</div>
                                                                </td>
                                                                <td style={{ padding: '20px', fontSize: '0.85rem' }}>{m.education || '—'}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <button
                                                                        onClick={() => setSelectedMember(m)}
                                                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}
                                                                    >
                                                                        Details
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}


                            {activeTab === 'pending-registrations' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                        <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900 }}>Pending Family Registrations</h2>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <span style={{ padding: '6px 14px', background: 'var(--sidebar-accent)', borderRadius: '10px', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
                                                {families.filter(f => f.status === 'Pending').length} Pending
                                            </span>
                                            <button
                                                onClick={() => {
                                                    console.log("🔄 Manual refresh triggered");
                                                    setFamilies([]);
                                                    fetchData();
                                                }}
                                                style={{
                                                    padding: '6px 14px',
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                🔄 Refresh Data
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                        {families.filter(f => f.status === 'Pending').length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>✅ No pending registration requests. All applications have been processed!</p>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        <th style={{ padding: '20px' }}>Family / Head</th>
                                                        <th style={{ padding: '20px' }}>Origin</th>
                                                        <th style={{ padding: '20px' }}>Current Stage</th>
                                                        <th style={{ padding: '20px' }}>Coordinator</th>
                                                        <th style={{ padding: '20px' }}>Contact</th>
                                                        <th style={{ padding: '20px' }}>Action Center</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {families.filter(f => f.status === 'Pending').map(fam => {
                                                        const isCoordinator = user?.role === 'admin' || user?.role === 'super_admin' || user?.position === 'coordinator';
                                                        const isAssignedCoord = fam.coordinator_id === user.id;

                                                        const isPresident = ['president', 'vice_president'].includes(user?.position);
                                                        const isSecretary = ['secretary', 'joint_secretary'].includes(user?.position);
                                                        const isCommittee = isPresident || isSecretary || user?.role === 'admin' || user?.role === 'super_admin';
                                                        const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
                                                        const isSuperAdmin = user?.role === 'super_admin';

                                                        // Verification Permissions
                                                        const canVerify =
                                                            isSuperAdmin ||
                                                            (isAdmin && !hasActiveCommittee) ||
                                                            (hasActiveCommittee && (
                                                                (fam.verification_stage === 'Recommender Verification' && fam.recommender_id === user.id) ||
                                                                (fam.verification_stage === 'President Scrutiny' && isPresident) ||
                                                                (fam.verification_stage === 'Secretary Scrutiny' && isSecretary) ||
                                                                (fam.verification_stage === 'Coordinator Scrutiny' && (isAssignedCoord || isSecretary)) ||
                                                                (fam.verification_stage === 'President Approval' && isPresident)
                                                            ));

                                                        // Assignment Permissions (Secretary Only during Secretary Scrutiny)
                                                        const showAssign = fam.status === 'Pending' && fam.verification_stage === 'Secretary Scrutiny' && (isSecretary || (isAdmin && !hasActiveCommittee));

                                                        return (
                                                            <tr key={fam._id || fam.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>{fam.head_details?.full_name || fam.head_name}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fam.members?.length || 0} Members</div>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', background: fam.join_method === 'Recommendation' ? '#E0F2F1' : '#F3E5F5', color: fam.join_method === 'Recommendation' ? '#00695C' : '#7B1FA2' }}>
                                                                        {fam.join_method || 'Direct'}
                                                                    </span>
                                                                    {fam.recommender_name && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Ref: {fam.recommender_name}</div>}
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <span style={{
                                                                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                                                        background: '#FFF3C4',
                                                                        color: '#B7791F'
                                                                    }}>
                                                                        {fam.verification_stage || 'Pending'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    {fam.coordinator_name ? (
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{fam.coordinator_name}</div>
                                                                    ) : (
                                                                        <span style={{ fontSize: '0.8rem', color: '#ccc', fontStyle: 'italic' }}>Not Assigned</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '20px', color: 'var(--text-muted)' }}>{fam.head_details?.mobile || 'N/A'}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <button
                                                                        onClick={() => setViewFamily(fam)}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #e2e8f0',
                                                                            background: 'white',
                                                                            cursor: 'pointer',
                                                                            marginBottom: '8px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            gap: '6px',
                                                                            fontWeight: 600,
                                                                            color: '#475569',
                                                                            width: '100%'
                                                                        }}
                                                                    >
                                                                        <span>👁️</span> View Application
                                                                    </button>
                                                                    {/* Coordinator Assignment Dropdown - SECRETARY ONLY */}
                                                                    {fam.verification_stage === 'Secretary Scrutiny' && !fam.coordinator_id && isSecretary && (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                                                                            <select
                                                                                id={`coordinator-select-${fam._id}`}
                                                                                value={selectedAssignments[fam._id] || ""}
                                                                                onChange={(e) => setSelectedAssignments({ ...selectedAssignments, [fam._id]: e.target.value })}
                                                                                style={{
                                                                                    padding: '8px 12px',
                                                                                    borderRadius: '8px',
                                                                                    border: '1.5px solid #cbd5e1',
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: 600,
                                                                                    color: '#334155',
                                                                                    background: '#f8fafc',
                                                                                    cursor: 'pointer',
                                                                                    width: '100%'
                                                                                }}
                                                                            >
                                                                                <option value="">Select Coordinator</option>
                                                                                {coordinators.map(coord => (
                                                                                    <option key={coord.id || coord._id} value={coord.id || coord._id}>
                                                                                        {coord.name}
                                                                                    </option>
                                                                                ))}
                                                                            </select>

                                                                            <button
                                                                                onClick={() => {
                                                                                    const selectedId = selectedAssignments[fam._id || fam.id];
                                                                                    const selectedCoord = coordinators.find(c => (c.id === selectedId || c._id === selectedId));

                                                                                    if (selectedCoord) {
                                                                                        if (window.confirm(`Lock assignment to ${selectedCoord.name} and forward for scrutiny?`)) {
                                                                                            // Chain assignment and verification
                                                                                            handleAssignCoordinator(fam._id || fam.id, selectedCoord.id || selectedCoord._id, selectedCoord.name)
                                                                                                .then(() => handleVerifyStage(fam._id || fam.id, "", fam.verification_stage));
                                                                                        }
                                                                                    } else {
                                                                                        alert("Please select a coordinator first.");
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    background: '#f59e0b',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    padding: '8px',
                                                                                    borderRadius: '6px',
                                                                                    fontSize: '0.8rem',
                                                                                    fontWeight: 700,
                                                                                    cursor: 'pointer',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    gap: '6px'
                                                                                }}
                                                                            >
                                                                                <span>🔒</span> Lock & Forward
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {fam.status !== 'Approved' && !showAssign && (
                                                                        canVerify ? (
                                                                            fam.verification_stage === 'President Approval' ? (
                                                                                <button
                                                                                    onClick={() => handleApproveFamily(fam._id)}
                                                                                    style={{ padding: '8px 18px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', width: '100%' }}
                                                                                >
                                                                                    ✅ Final Approval
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setVerifyModal({ open: true, family: fam, stage: fam.verification_stage });
                                                                                        setVerifyRemark('');
                                                                                    }}
                                                                                    style={{
                                                                                        padding: '8px 18px',
                                                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '10px',
                                                                                        cursor: 'pointer',
                                                                                        fontWeight: 700,
                                                                                        fontSize: '0.85rem',
                                                                                        width: '100%',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        gap: '6px'
                                                                                    }}
                                                                                >
                                                                                    <span>✓</span> Verify & Forward
                                                                                </button>
                                                                            )
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Awaiting {fam.verification_stage}</span>
                                                                        )
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'families' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                        <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900 }}>Family Registrations</h2>
                                        <span style={{ padding: '6px 14px', background: 'var(--sidebar-accent)', borderRadius: '10px', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>{families.length} Total</span>
                                    </div>

                                    <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                        {families.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No registration data found.</p> : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        <th style={{ padding: '20px' }}>Family / Head</th>
                                                        <th style={{ padding: '20px' }}>Origin</th>
                                                        <th style={{ padding: '20px' }}>Current Stage</th>
                                                        <th style={{ padding: '20px' }}>Coordinator</th>
                                                        <th style={{ padding: '20px' }}>Contact</th>
                                                        <th style={{ padding: '20px' }}>Action Center</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {families.filter(f => f.status === 'Pending').map(fam => {
                                                        const isCoordinator = user?.role === 'admin' || user?.role === 'super_admin' || user?.position === 'coordinator';
                                                        const isAssignedCoord = fam.coordinator_id === user.id;

                                                        const isPresident = ['president', 'vice_president'].includes(user?.position);
                                                        const isSecretary = ['secretary', 'joint_secretary'].includes(user?.position);
                                                        const isCommittee = isPresident || isSecretary || user?.role === 'admin' || user?.role === 'super_admin';
                                                        const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

                                                        // Verification Permissions
                                                        const canVerify =
                                                            isAdmin || // Admins can verify at any stage
                                                            (fam.verification_stage === 'Recommender Verification' && fam.recommender_id === user.id) ||
                                                            (fam.verification_stage === 'President Scrutiny' && isPresident) ||
                                                            (fam.verification_stage === 'Secretary Scrutiny' && isSecretary) ||
                                                            (fam.verification_stage === 'Coordinator Scrutiny' && (isAssignedCoord || isSecretary)) ||
                                                            (fam.verification_stage === 'President Approval' && isPresident); // President gives final approval

                                                        // Assignment Permissions (Secretary Only during Secretary Scrutiny)
                                                        const showAssign = fam.status === 'Pending' && fam.verification_stage === 'Secretary Scrutiny' && isSecretary;



                                                        return (
                                                            <tr key={fam._id || fam.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>{fam.head_details?.full_name || fam.head_name}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fam.members?.length || 0} Members</div>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', background: fam.join_method === 'Recommendation' ? '#E0F2F1' : '#F3E5F5', color: fam.join_method === 'Recommendation' ? '#00695C' : '#7B1FA2' }}>
                                                                        {fam.join_method || 'Direct'}
                                                                    </span>
                                                                    {fam.recommender_name && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Ref: {fam.recommender_name}</div>}
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <span style={{
                                                                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                                                        background: fam.status === 'Approved' ? '#DEF7EC' : '#FFF3C4',
                                                                        color: fam.status === 'Approved' ? '#03543F' : '#B7791F'
                                                                    }}>
                                                                        {fam.status === 'Approved' ? 'Active Member' : (fam.verification_stage || 'Pending')}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    {fam.coordinator_name ? (
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{fam.coordinator_name}</div>
                                                                    ) : (
                                                                        <span style={{ fontSize: '0.8rem', color: '#ccc', fontStyle: 'italic' }}>Not Assigned</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '20px', color: 'var(--text-muted)' }}>{fam.head_details?.mobile || 'N/A'}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <button
                                                                        onClick={() => setViewFamily(fam)}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #e2e8f0',
                                                                            background: 'white',
                                                                            cursor: 'pointer',
                                                                            marginBottom: '8px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            gap: '6px',
                                                                            fontWeight: 600,
                                                                            color: '#475569',
                                                                            width: '100%'
                                                                        }}
                                                                    >
                                                                        <span>👁️</span> View Application
                                                                    </button>
                                                                    {/* Coordinator Assignment Dropdown - SECRETARY ONLY */}
                                                                    {fam.verification_stage === 'Secretary Scrutiny' && !fam.coordinator_id && isSecretary && (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                                                                            <select
                                                                                id={`coordinator-select-${fam._id}`}
                                                                                value={selectedAssignments[fam._id] || ""}
                                                                                onChange={(e) => setSelectedAssignments({ ...selectedAssignments, [fam._id]: e.target.value })}
                                                                                style={{
                                                                                    padding: '8px 12px',
                                                                                    borderRadius: '8px',
                                                                                    border: '1.5px solid #cbd5e1',
                                                                                    fontSize: '0.85rem',
                                                                                    fontWeight: 600,
                                                                                    color: '#334155',
                                                                                    background: '#f8fafc',
                                                                                    cursor: 'pointer',
                                                                                    width: '100%'
                                                                                }}
                                                                            >
                                                                                <option value="">Select Coordinator</option>
                                                                                {coordinators.map(coord => (
                                                                                    <option key={coord.id || coord._id} value={coord.id || coord._id}>
                                                                                        {coord.name}
                                                                                    </option>
                                                                                ))}
                                                                            </select>

                                                                            <button
                                                                                onClick={() => {
                                                                                    const selectedId = selectedAssignments[fam._id || fam.id];
                                                                                    const selectedCoord = coordinators.find(c => (c.id === selectedId || c._id === selectedId));

                                                                                    if (selectedCoord) {
                                                                                        if (window.confirm(`Lock assignment to ${selectedCoord.name} and forward for scrutiny?`)) {
                                                                                            // Chain assignment and verification
                                                                                            handleAssignCoordinator(fam._id || fam.id, selectedCoord.id || selectedCoord._id, selectedCoord.name)
                                                                                                .then(() => handleVerifyStage(fam._id || fam.id, fam.verification_stage, true));
                                                                                        }
                                                                                    } else {
                                                                                        alert("Please select a coordinator first.");
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    background: '#f59e0b',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    padding: '8px',
                                                                                    borderRadius: '6px',
                                                                                    fontSize: '0.8rem',
                                                                                    fontWeight: 700,
                                                                                    cursor: 'pointer',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    gap: '6px'
                                                                                }}
                                                                            >
                                                                                <span>🔒</span> Lock & Forward
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {fam.status !== 'Approved' && !showAssign && (
                                                                        canVerify ? (
                                                                            fam.verification_stage === 'President Approval' ? (
                                                                                <button
                                                                                    onClick={() => handleApproveFamily(fam._id)}
                                                                                    style={{ padding: '8px 18px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', width: '100%' }}
                                                                                >
                                                                                    ✅ Final Approval
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleVerifyStage(fam._id, fam.verification_stage, fam.coordinator_id)}
                                                                                    style={{
                                                                                        padding: '8px 18px',
                                                                                        background: 'var(--info)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: '10px',
                                                                                        cursor: 'pointer',
                                                                                        fontWeight: 700,
                                                                                        fontSize: '0.85rem',
                                                                                        width: '100%'
                                                                                    }}
                                                                                >
                                                                                    ✓ Verify & Forward
                                                                                </button>
                                                                            )
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
                                                                                {fam.verification_stage === 'Secretary Scrutiny' ? 'Under Secretary Review' :
                                                                                    fam.verification_stage === 'Coordinator Scrutiny' ? `With Coordinator (${fam.coordinator_name})` :
                                                                                        fam.verification_stage === 'President Approval' ? 'Awaiting President Approval' :
                                                                                            `Pending ${fam.verification_stage}`}
                                                                            </span>
                                                                        )
                                                                    )}

                                                                    {/* Coordinator Help Request Button */}
                                                                    {fam.status === 'Approved' && (user.role === 'coordinator' || user.position === 'coordinator' || user.role === 'admin' || user.role === 'super_admin') && (
                                                                        <button
                                                                            onClick={() => setHelpModal({
                                                                                open: true,
                                                                                familyId: fam._id,
                                                                                familyName: fam.head_details?.full_name || fam.head_name
                                                                            })}
                                                                            style={{
                                                                                padding: '8px 14px',
                                                                                marginTop: '8px',
                                                                                background: '#E0F2FE',
                                                                                color: '#0284C7',
                                                                                border: '1px solid #BAE6FD',
                                                                                borderRadius: '8px',
                                                                                cursor: 'pointer',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.75rem',
                                                                                display: 'flex', alignItems: 'center', gap: '6px'
                                                                            }}
                                                                        >
                                                                            <span>🤝</span> Request Help
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* Member Requests Section */}
                                    <div style={{ marginTop: '40px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                            <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900 }}>Member Addition Requests</h2>
                                            <span style={{ padding: '6px 14px', background: 'var(--sidebar-accent)', borderRadius: '10px', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>{memberRequests?.length || 0} Requests</span>
                                        </div>

                                        <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                            {memberRequests.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No new member requests.</p> : (
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                    <thead>
                                                        <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                            <th style={{ padding: '20px' }}>Member Name</th>
                                                            <th style={{ padding: '20px' }}>Family Head</th>
                                                            <th style={{ padding: '20px' }}>Relation</th>
                                                            <th style={{ padding: '20px' }}>Stage</th>
                                                            <th style={{ padding: '20px' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {memberRequests.map(req => {
                                                            const isCoordinator = user?.role === 'admin' || user?.role === 'super_admin' || user?.position === 'coordinator';
                                                            const canVerify = (req.verification_stage === 'Coordinator Scrutiny' && isCoordinator) ||
                                                                (req.verification_stage === 'Committee Approval' && isCommittee);

                                                            return (
                                                                <tr key={req.request_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                    <td style={{ padding: '20px', fontWeight: 'bold' }}>{cleanName(req.member.full_name)}</td>
                                                                    <td style={{ padding: '20px' }}>{req.head_name} ({req.family_unique_id})</td>
                                                                    <td style={{ padding: '20px' }}>{req.member.relation}</td>
                                                                    <td style={{ padding: '20px' }}>
                                                                        <span style={{
                                                                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                                                            background: '#FFF3C4', color: '#B7791F'
                                                                        }}>
                                                                            {req.verification_stage}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '20px' }}>
                                                                        {canVerify && req.verification_stage === 'Coordinator Scrutiny' && (
                                                                            <button onClick={() => handleMemberAction(req.request_id, 'verify')} style={{ padding: '6px 12px', background: 'var(--info)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Verify & Forward</button>
                                                                        )}
                                                                        {canVerify && req.verification_stage === 'Committee Approval' && (
                                                                            <button onClick={() => handleMemberAction(req.request_id, 'approve')} style={{ padding: '6px 12px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Final Approve</button>
                                                                        )}
                                                                        {!canVerify && <span style={{ color: '#ccc', fontStyle: 'italic', fontSize: '0.8rem' }}>Pending {req.verification_stage}...</span>}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'assignments' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                        <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900 }}>Assign Coordinators (Secretary Only)</h2>
                                        <span style={{ padding: '6px 14px', background: 'var(--sidebar-accent)', borderRadius: '10px', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>
                                            {families.filter(f => f.verification_stage === 'Secretary Scrutiny').length} To Assign
                                        </span>
                                    </div>

                                    <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                        {families.filter(f => f.verification_stage === 'Secretary Scrutiny').length === 0 ?
                                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No applications pending Secretary review.</p> : (
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                    <thead>
                                                        <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                            <th style={{ padding: '20px', position: 'sticky', top: '-30px', zIndex: 10, background: 'var(--bg-page)' }}>Family Head</th>
                                                            <th style={{ padding: '20px', position: 'sticky', top: '-30px', zIndex: 10, background: 'var(--bg-page)' }}>Address</th>
                                                            <th style={{ padding: '20px', position: 'sticky', top: '-30px', zIndex: 10, background: 'var(--bg-page)' }}>Contact</th>
                                                            <th style={{ padding: '20px', position: 'sticky', top: '-30px', zIndex: 10, background: 'var(--bg-page)' }}>Assign & Verify</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {families.filter(f => f.verification_stage === 'Secretary Scrutiny').map(fam => (
                                                            <tr key={fam._id || fam.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                <td style={{ padding: '20px' }}>
                                                                    <div style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>{fam.head_details?.full_name || fam.head_name}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fam.members?.length || 0} Members</div>
                                                                </td>
                                                                <td style={{ padding: '20px' }}>
                                                                    {fam.current_address?.village_town_city}, {fam.current_address?.district}
                                                                </td>
                                                                <td style={{ padding: '20px' }}>{fam.head_details?.mobile}</td>
                                                                <td style={{ padding: '20px' }}>
                                                                    <select
                                                                        onChange={async (e) => {
                                                                            const selected = coordinators.find(u => u.id === e.target.value);
                                                                            if (selected) {
                                                                                if (window.confirm(`Assign ${selected.name} and verify stage?`)) {
                                                                                    const remark = window.prompt("Enter assignment remarks (optional):", "") || "";
                                                                                    await api.assignCoordinator(fam._id, selected.id, selected.name);
                                                                                    await api.verifyFamilyStage(fam._id, { remarks: remark });
                                                                                    alert("Coordinator Assigned and stage updated!");
                                                                                    fetchData();
                                                                                }
                                                                            }
                                                                        }}
                                                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', maxWidth: '200px' }}
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="" disabled>Select Coordinator / Member</option>
                                                                        {coordinators.map(c => <option key={c.id} value={c.id}>{c.name} ({getRoleLabel(c.role || c.position)})</option>)}
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'requests' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                        <h2 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 900 }}>Assistance Desk</h2>
                                        <span style={{ padding: '6px 14px', background: 'var(--sidebar-accent)', borderRadius: '10px', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '0.9rem' }}>{requests.length} Requests</span>
                                    </div>

                                    <div style={{ background: 'var(--bg-card)', padding: '0', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                        {requests.length === 0 ? (
                                            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white' }}>
                                                <div style={{
                                                    width: '80px', height: '80px', background: '#f8fafc', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    margin: '0 auto 20px', color: '#94a3b8'
                                                }}>
                                                    <ClipboardList size={40} />
                                                </div>
                                                <h3 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '8px', fontWeight: 800 }}>No assistance requests</h3>
                                                <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                                                    There are currently no pending or historical assistance tickets to display.
                                                </p>
                                            </div>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        <th style={{ padding: '20px' }}>Ticket ID</th>
                                                        <th style={{ padding: '20px' }}>Nature of Help</th>
                                                        <th style={{ padding: '20px' }}>Grant Amount</th>
                                                        <th style={{ padding: '20px' }}>Verification Status</th>
                                                        <th style={{ padding: '20px' }}>Resolution</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {requests.map(req => (
                                                        <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                            <td style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>#{req.id}</td>
                                                            <td style={{ padding: '20px' }}>
                                                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{req.request_type}</div>
                                                            </td>
                                                            <td style={{ padding: '20px' }}>
                                                                <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '1.1rem' }}>₹{req.amount_requested?.toLocaleString()}</div>
                                                            </td>
                                                            <td style={{ padding: '20px' }}>
                                                                <span style={{
                                                                    padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                                                    background: req.status === 'Approved' ? '#DEF7EC' : (req.status === 'Rejected' ? '#FDE2E2' : '#FEF3C7'),
                                                                    color: req.status === 'Approved' ? '#03543F' : (req.status === 'Rejected' ? '#9B1C1C' : '#92400E')
                                                                }}>
                                                                    {req.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '20px' }}>
                                                                {req.status === 'Pending' && (
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button onClick={() => handleUpdateRequest(req.id, 'Approved')} style={{ padding: '8px 14px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Approve</button>
                                                                        <button onClick={() => handleUpdateRequest(req.id, 'Rejected')} style={{ padding: '8px 14px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Reject</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'updates' && (
                                <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                                        <h3 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 800 }}>Profile Update Requests</h3>
                                        <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {updateRequests.length} Pending
                                        </div>
                                    </div>

                                    {updateRequests.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✅</div>
                                            <p>All update requests have been processed.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '20px' }}>
                                            {updateRequests.map((req, idx) => (
                                                <div key={idx} style={{ padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                                                                    {req.assigned_to_role} Action Required
                                                                </span>
                                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>• {new Date(req.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                                                                Update Request from {req.requester_name}
                                                            </h4>
                                                            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                                                Target: {req.target_member_id === 'HEAD' ? 'Family Head' : `Member ID: ${req.target_member_id}`} (Family: {req.family_unique_id})
                                                            </p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>Stage</div>
                                                            <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{req.current_stage}</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                                        <div style={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase' }}>Reason for Update:</div>
                                                        <p style={{ margin: 0, color: '#1e293b', fontStyle: 'italic' }}>"{req.reason || 'No reason provided'}"</p>

                                                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
                                                            <div style={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase' }}>Proposed Changes:</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                                                {Object.entries(req.changes).map(([field, value]) => {
                                                                    if (field === 'residence_address' && value) {
                                                                        return Object.entries(value).map(([addrField, addrVal]) => (
                                                                            addrVal ? (
                                                                                <div key={addrField} style={{ fontSize: '0.85rem', padding: '8px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                                                                                    <span style={{ color: '#1e40af' }}>{addrField}:</span> <span style={{ fontWeight: 600 }}>{String(addrVal)}</span>
                                                                                </div>
                                                                            ) : null
                                                                        ));
                                                                    }
                                                                    if (typeof value === 'object' && value !== null) return null;
                                                                    if (['member_id', 'status', 'remarks', '_id', 'user_id', 'id'].includes(field)) return null;
                                                                    return (
                                                                        <div key={field} style={{ fontSize: '0.85rem', padding: '8px', background: '#f1f5f9', borderRadius: '6px' }}>
                                                                            <span style={{ color: '#64748b' }}>{field.replace(/_/g, ' ')}:</span> <span style={{ fontWeight: 600 }}>{String(value)}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={async () => {
                                                                const remark = prompt("Provide a reason for rejection (optional):");
                                                                if (remark === null) return;
                                                                try {
                                                                    await api.processUpdateRequest(req._id, 'Reject', remark);
                                                                    alert("Request Rejected");
                                                                    fetchData();
                                                                } catch (err) { alert("Failed: " + err.message); }
                                                            }}
                                                            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                                                        >
                                                            Reject Request
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!window.confirm("Approve this update and apply changes to the family profile?")) return;
                                                                try {
                                                                    await api.processUpdateRequest(req._id, 'Approve');
                                                                    alert("Changes Applied Successfully!");
                                                                    fetchData();
                                                                } catch (err) { alert("Failed: " + err.message); }
                                                            }}
                                                            style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}
                                                        >
                                                            Approve & Apply Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <CommonDashboardContent
                                    activeTab={activeTab}
                                    role={user?.role}
                                    user={user}
                                    refreshData={() => { }}
                                />
                            )}
                        </>
                    )}
                </div>
            </DashboardLayout >
            {selectedMember && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                />
            )
            }
            {renderHelpModal()}
            {renderViewFamilyModal()}
            {renderVerifyModal()}
        </>
    );
};

export default AdminDashboard;
