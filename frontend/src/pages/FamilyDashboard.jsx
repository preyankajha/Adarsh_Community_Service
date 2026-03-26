import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import CommonDashboardContent from '../components/dashboard/CommonDashboardContent';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getRoleLabel } from '../utils/roleHelper';

import DashboardOverview from '../components/dashboard/DashboardOverview';
import MemberDetailModal from '../components/MemberDetailModal';
import RegisterFamily from './RegisterFamily';
import { EnhancedListManager, EducationHistoryManager } from '../components/FormModules';

const COUNTRIES = [
    "India", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const PREFIX_OPTIONS = [
    { value: 'Shri', hi: 'श्री', en: 'Shri' },
    { value: 'Shrimati', hi: 'श्रीमती', en: 'Shrimati' },
    { value: 'Smt', hi: 'श्रीमती', en: 'Smt' },
    { value: 'Late', hi: 'स्व.', en: 'Late' },
    { value: 'Mr', hi: 'मि.', en: 'Mr' },
    { value: 'Mrs', hi: 'मिसेज', en: 'Mrs' },
    { value: 'Ms', hi: 'सुश्री', en: 'Ms' },
    { value: 'Dr', hi: 'डॉ.', en: 'Dr' },
    { value: 'Master', hi: 'मास्टर', en: 'Master' },
    { value: 'Miss', hi: 'मिस', en: 'Miss' },
    { value: 'Kumari', hi: 'कुमारी', en: 'Kumari' },
    { value: 'Km', hi: 'कु.', en: 'Km' },
    { value: 'Sh', hi: 'श्री', en: 'Sh' }
];

const DateInput = ({ value, onChange, placeholder, className, style }) => {
    const [inputType, setInputType] = useState('text');
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };
    return (
        <input
            className={className}
            style={style}
            type={inputType}
            placeholder={placeholder || "DD-MM-YYYY"}
            value={inputType === 'text' ? formatDate(value) : value}
            onFocus={() => setInputType('date')}
            onBlur={() => setInputType('text')}
            onChange={onChange}
        />
    );
};

const SearchableSelect = ({ value, onChange, options, placeholder }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const filteredOptions = (options || []).filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );
    useEffect(() => { if (!isOpen) setSearch(''); }, [isOpen]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <div
                className="form-input"
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
                {value || placeholder}
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'white', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                    <input autoFocus placeholder="Search..." style={{ width: '100%', padding: '10px', border: 'none', borderBottom: '1px solid #eee', outline: 'none' }} value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} />
                    {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                        <div key={opt} style={{ padding: '10px', cursor: 'pointer' }} onMouseDown={() => { onChange(opt); setIsOpen(false); }} onMouseEnter={e => e.target.style.background = '#f8fafc'} onMouseLeave={e => e.target.style.background = 'white'} >{opt}</div>
                    )) : <div style={{ padding: '10px', color: '#666' }}>No results found</div>}
                </div>
            )}
        </div>
    );
};

const CountryCodeSearch = ({ value, onChange, options }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(opt =>
        (opt.name + opt.code).toLowerCase().includes(search.toLowerCase())
    );

    const selectedOpt = options.find(o => o.code === value) || options.find(o => o.code === '+91') || options[0];

    useEffect(() => {
        if (!isOpen) setSearch('');
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '130px', flexShrink: 0 }}>
            <div
                className="form-input"
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', height: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            >
                <span>{selectedOpt ? `${selectedOpt.flag} ${selectedOpt.code}` : '+91'}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, width: '250px', zIndex: 1000,
                    background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    marginTop: '5px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <input
                        className="form-input"
                        autoFocus
                        placeholder="Search country/code..."
                        style={{ border: 'none', borderRadius: 0, borderBottom: '1px solid var(--border)', height: '45px', padding: '10px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                    />
                    <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <div
                                    key={i}
                                    style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }}
                                    onMouseDown={() => {
                                        onChange(opt.code);
                                        setIsOpen(false);
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                    <span>{opt.flag}</span>
                                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={opt.name}>{opt.name}</span>
                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{opt.code}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '10px 15px', color: '#64748b' }}>No match found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Local ListManager removed, using EnhancedListManager from FormModules instead.

const FamilyDashboard = () => {
    const { t, language } = useLanguage();
    const { tab } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const activeTab = tab || 'overview';

    const [familyData, setFamilyData] = useState(null);
    const [notices, setNotices] = useState([]);
    const [requests, setRequests] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOptions, setFormOptions] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));

    const [userState, setUserState] = useState({ showAddMemberModal: false });
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [updateRequests, setUpdateRequests] = useState([]);

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

    const handlePhotoUpload = async (file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.uploadFile(formData);
            const url = res.data.url;
            await api.updateProfilePhoto(url);

            // Update local user object
            const updatedUser = { ...user, profile_photo: url };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert("Profile Photo Updated! Refresh to see changes globally.");
            window.location.reload();
        } catch (err) {
            alert("Upload Failed: " + (err.message));
        }
    };


    // Check if user holds a committee position
    const isCommittee = ['president', 'vice_president', 'secretary', 'joint_secretary', 'treasurer', 'executive_member', 'coordinator'].includes(user?.position) || ['admin', 'super_admin'].includes(user?.role);

    const isPendingOrIncomplete = !isCommittee && user?.role === 'family_head' && familyData?.status !== 'Active' && familyData?.status !== 'Approved';

    // Committee members get the same full UI as family heads
    let sidebarItems = (user?.role === 'family_head' || isCommittee)
        ? ['overview', 'family', 'coordinator', 'update', 'nominee', 'profile', 'help', 'recommend']
        : ['overview', 'family', 'coordinator', 'nominee', 'profile', 'help'];

    if (isPendingOrIncomplete) {
        sidebarItems = ['overview', 'profile', 'help'];
    }

    const icons = {
        overview: '🏠',
        family: '👨‍👩‍👧‍👦',
        update: '✏️',
        nominee: '🛡️',
        profile: '👤',
        help: '🆘',
        recommend: '✉️',
        funds: '💵',
        contributions: '📊',
        coordinator: '🤝',
        settings: '⚙️'
    };

    const labels = {
        overview: 'Dashboard',
        family: 'My Family',
        update: 'Update Details',
        nominee: 'Nominees',
        profile: 'My Profile',
        help: 'Requests',
        recommend: 'Invite',
        funds: 'Funds',
        contributions: 'History',
        coordinator: 'Coordinator',
        settings: 'Account Settings'
    };

    const sidebarMenuItems = sidebarItems.map(key => ({
        label: labels[key],
        icon: icons[key],
        tab: key
    }));


    const [initialMemberState, setInitialMemberState] = useState({
        full_name: '', full_name_title: 'Shri', father_husband_name: '', father_husband_title: 'Shri', relation: '', gender: 'Male', dob: '',
        marital_status: 'Single', blood_group: '', mobile: '', mobile_country_code: '+91', whatsapp_country_code: '+91',
        education_level: 'High School', occupation_type: 'Student', occupation: 'Student', designation: '', organization: '', occupation_sector: '',
        relation_other: '', education_level_other: '', occupation_type_other: '',
        education_class: '', education_class_other: '', school_type: '', education_stream: '', profession_details: '', is_earning: 'No',
        residence_type: 'With Family', residence_purpose: '',
        residence_address: { country: 'India', house_no: '', locality: '', village_town_city: '', post_office: '', police_station: '', block_tehsil: '', district: '', state: 'Bihar', pin_code: '', landmark: '' },
        has_serious_illness: false, serious_illness_details: '',
        is_specially_abled: false, specially_abled_details: '',
        education_history: [], // Added for Exam Form structure
        specialization_courses: [],
        skills: []
    });

    const [memberTemp, setMemberTemp] = useState(initialMemberState);

    const handleMemberChange = (field, value) => {
        setMemberTemp(prev => ({ ...prev, [field]: value }));
    };

    const transliterate = async (text, callback) => {
        if (!text || text.length < 2) return;
        try {
            const res = await fetch(`https://inputtools.google.com/request?text=${text}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`);
            const data = await res.json();
            if (data && data[0] === 'SUCCESS' && data[1][0][1][0]) {
                callback(data[1][0][1][0]);
            }
        } catch (err) {
            console.error("Transliteration error:", err);
        }
    };

    // Auto-transliterate Editing Member
    useEffect(() => {
        const timer = setTimeout(() => {
            if (editingMember?.full_name && !editingMember.full_name_hindi) {
                transliterate(editingMember.full_name, val => 
                    setEditingMember(prev => ({...prev, full_name_hindi: val}))
                );
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [editingMember?.full_name]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const fName = editingMember?.father_husband_name || editingMember?.father_name;
            if (fName && !editingMember?.father_husband_name_hindi && !editingMember?.father_name_hindi) {
                transliterate(fName, val => {
                    setEditingMember(prev => ({
                        ...prev, 
                        father_husband_name_hindi: val,
                        father_name_hindi: val
                    }));
                });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [editingMember?.father_husband_name, editingMember?.father_name]);

    // Auto-transliterate New Member being added
    useEffect(() => {
        const timer = setTimeout(() => {
            if (memberTemp.full_name) {
                transliterate(memberTemp.full_name, val => 
                    setMemberTemp(prev => ({...prev, full_name_hindi: val}))
                );
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [memberTemp.full_name]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (memberTemp.father_husband_name) {
                transliterate(memberTemp.father_husband_name, val => 
                    setMemberTemp(prev => ({...prev, father_husband_name_hindi: val}))
                );
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [memberTemp.father_husband_name]);



    const [isPinLoading, setIsPinLoading] = useState(false);

    const handleAddrPinChange = async (pinValue) => {
        const addr = editingMember.residence_address || {};
        setEditingMember({
            ...editingMember,
            residence_address: { ...addr, pin_code: pinValue }
        });

        if (pinValue.length === 6) {
            setIsPinLoading(true);
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pinValue}`);
                const data = await response.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const info = data[0].PostOffice[0];
                    setEditingMember(prev => ({
                        ...prev,
                        residence_address: {
                            ...prev.residence_address,
                            district: info.District,
                            state: info.State,
                            village_town_city: info.Block !== 'NA' ? info.Block : (prev.residence_address?.village_town_city || '')
                        }
                    }));
                }
            } catch (err) { console.error("PIN lookup failed", err); }
            finally { setIsPinLoading(false); }
        }
    };

    const [countryCodes, setCountryCodes] = useState([{ name: 'India', code: '+91', flag: '🇮🇳' }]);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flags');
                const data = await response.json();
                const formatted = data
                    .filter(c => c.idd.root)
                    .map(c => ({
                        name: c.name.common,
                        code: c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : ''),
                        flag: c.flags.emoji || '🏳️'
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                setCountryCodes(formatted);
            } catch (error) {
                console.error("Failed to fetch country codes", error);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener('resize', handleResize);
        const fetchOptions = async () => {
            try {
                const response = await fetch('/api/metadata/options');
                const data = await response.json();
                setFormOptions(data);
            } catch (error) { console.error("Error fetching form options:", error); }
        };
        fetchOptions();
        if (searchParams.get('action') === 'add_member') {
            setUserState(prev => ({ ...prev, showAddMemberModal: true }));
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [searchParams]);

    const [helpForm, setHelpForm] = useState({
        request_type: '',
        amount_requested: '',
        description: ''
    });

    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), 8000)
            );

            const fetchPromise = Promise.all([
                api.getMyFamily().catch(e => ({ data: null })),
                api.getAssistanceRequests().catch(e => ({ data: [] })),
                api.getNotices().catch(e => ({ data: [] })),
                api.getMyRecommendations().catch(e => ({ data: [] })),
                api.createUpdateRequest ? api.getMyUpdateRequests().catch(e => ({ data: [] })) : Promise.resolve({ data: [] })
            ]);

            const [famRes, reqRes, notRes, recRes, updRes] = await Promise.race([fetchPromise, timeout]);

            setFamilyData(famRes.data);
            setRequests(reqRes.data || []);
            setNotices(notRes.data || []);
            setRecommendations(recRes.data || []);
            setUpdateRequests(updRes?.data || []);

            // Sync status to localStorage for global gating
            if (famRes.data?.status) {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (currentUser && currentUser.status !== famRes.data.status) {
                    currentUser.status = famRes.data.status;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            setError("Could not connect to server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [selectedFiles, setSelectedFiles] = useState(null);

    const handleHelpSubmit = async (e) => {
        e.preventDefault();
        try {
            let attachments = [];
            if (selectedFiles) {
                const uploadPromises = Array.from(selectedFiles).map(file => {
                    const formData = new FormData();
                    formData.append('file', file);
                    return api.uploadFile(formData);
                });
                const responses = await Promise.all(uploadPromises);
                attachments = responses.map(res => res.data.url);
            }

            await api.createAssistanceRequest({
                ...helpForm,
                amount_requested: parseFloat(helpForm.amount_requested),
                attachments
            });
            alert("Request submitted successfully!");
            setHelpForm({ request_type: '', amount_requested: '', description: '' });
            setSelectedFiles(null);
            fetchData(); // Refresh list
        } catch (err) {
            alert("Failed to submit request: " + (err.response?.data?.detail || err.message));
        }
    };

    if (loading) return <div>Loading...</div>;

    // Final Fallback: Only show full dashboard if status is Approved/Active or user is not a family head
    // EXCEPTION: Allow access to 'profile' tab for settings
    // EXCEPTION: Allow access if user is a committee member
    const isRestricted = !isCommittee && user?.role === 'family_head' && familyData?.status !== 'Active' && familyData?.status !== 'Approved' && activeTab !== 'profile' && activeTab !== 'settings';

    return (
        <DashboardLayout
            role={user?.role}
            title={isRestricted ? "Access Restricted" : "Family Portal"}
            showTitle={isRestricted}
            sidebarMenuItems={sidebarMenuItems}
            banner={!isRestricted && (
                <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    padding: '30px 40px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            👑
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px' }}>
                                    {user?.role === 'family_head' ? 'Family Head' : 'Portal Access'}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                                {user?.name || 'Authorized Member'}
                            </div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 600, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                🏘️ Verified Community Member
                            </div>
                        </div>
                    </div>
                    <div style={{
                        background: 'white',
                        color: '#d97706',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 900,
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <span>👤</span> Family Portal
                    </div>
                </div>
            )}
        >      {isRestricted ? (
            <div style={{ padding: isMobile ? '10px' : '40px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                    padding: '28px 32px',
                    borderRadius: '12px',
                    border: '1px solid #FCD34D',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(252, 211, 77, 0.15)'
                }}>
                    <h2 style={{ color: '#92400E', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.01em' }}>
                        <span style={{ fontSize: '1.5rem' }}>{familyData?.status === 'Pending' ? '⏳' : (!familyData || !familyData.status || familyData.status === 'Profile Incomplete') ? '👋' : '📋'}</span>
                        {familyData?.status === 'Pending' ? 'Application Under Review' : (!familyData || !familyData.status || familyData.status === 'Profile Incomplete') ? 'Complete Your Registration' : 'Registration Status'}
                    </h2>
                    <p style={{ color: '#B45309', lineHeight: '1.6', margin: 0, fontSize: '0.9375rem' }}>
                        {familyData?.status === 'Pending'
                            ? 'Your family registration has been submitted successfully and is currently under review by the committee.'
                            : (!familyData || !familyData.status || familyData.status === 'Profile Incomplete')
                                ? 'To unlock all dashboard features, please provide your complete family details below.'
                                : 'Your registration is being processed.'}
                    </p>
                    {familyData?.status === 'Pending' && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ color: '#92400E', fontWeight: 600, marginBottom: '12px', fontSize: '0.875rem' }}>
                                Current Stage: <span style={{ fontWeight: 700 }}>{familyData.verification_stage || 'Under Review'}</span>
                            </div>
                            {familyData.remarks && familyData.remarks.length > 0 && (
                                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '16px', borderRadius: '10px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', fontWeight: 600, color: '#B45309' }}>Application History & Remarks</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {familyData.remarks.map((rem, idx) => (
                                            <div key={idx} style={{ fontSize: '0.8125rem', borderLeft: '3px solid #F59E0B', paddingLeft: '12px' }}>
                                                <div style={{ fontWeight: 600, color: '#78350F', marginBottom: '4px' }}>{rem.stage}</div>
                                                <div style={{ color: '#444', lineHeight: '1.5' }}>{rem.remark || 'Processed'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '6px' }}>
                                                    By {rem.by} ({rem.role}) • {new Date(rem.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Only show form if status is Profile Incomplete or Missing */}
                {(!familyData || !familyData.status || familyData.status === 'Profile Incomplete') && (
                    <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                        <RegisterFamily isEmbedded={true} onSuccess={fetchData} />
                    </div>
                )}

                {/* Show locked message if Pending */}
                {familyData?.status === 'Pending' && (
                    <div style={{ background: 'white', padding: '48px 40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '20px', opacity: 0.9 }}>🔒</div>
                        <h3 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.01em' }}>Application Submitted</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto' }}>
                            Your family registration form has been submitted and is locked for editing during the review process.
                        </p>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '16px' }}>
                            You will be notified once the committee completes the verification.
                        </p>
                    </div>
                )}
            </div>
        ) : (
            <div style={{ padding: isMobile ? '15px' : '30px' }}>

                {/* Common Tab Content (Filtered for Profile for Family Head) */}
                {['funds', 'contributions', 'rules', 'accounts', 'notices', 'audit', 'inquiries', 'elections', 'governance', 'history', 'roles', 'nominee', 'coordinator', 'profile', 'settings'].includes(activeTab) && (
                    <CommonDashboardContent
                        activeTab={activeTab}
                        role={user?.role}
                        user={user}
                        formOptions={formOptions}
                        familyData={familyData}
                        refreshData={fetchData}
                    />
                )}


                {/* Tab Content */}
                {
                    activeTab === 'overview' && (
                        <DashboardOverview role="family_head" user={user} />
                    )
                }

                {
                    activeTab === 'update' && (
                        <div className="update-tab" style={{ background: 'white', padding: isMobile ? '15px' : '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                                <h3 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 800 }}>Update Family Details</h3>
                                {editingMember && (
                                    <button
                                        onClick={() => setEditingMember(null)}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}
                                    >
                                        ← Back to List
                                    </button>
                                )}
                            </div>

                            {!editingMember ? (
                                <>
                                    <div style={{ background: '#fffbeb', border: '1px solid #f97316', padding: '15px', borderRadius: '12px', marginBottom: '30px', color: '#9a3412', fontSize: '0.9rem' }}>
                                        <strong>Note:</strong> Any changes made to the profile will be sent for verification.
                                        Address changes are verified by the <strong>Secretary</strong>, while other details are verified by your <strong>Coordinator</strong>.
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                        {/* Family Head Card */}
                                        <div style={{ padding: '20px', borderRadius: '16px', border: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                                                <div style={{ fontSize: '2.5rem' }}>👑</div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{familyData?.head_details?.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Family Head (ID: {familyData?.family_id}-H01)</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEditingMember({ ...familyData.head_details, member_id: 'HEAD' })}
                                                className="cta-button"
                                                style={{ width: '100%', padding: '10px' }}
                                            >
                                                Edit Details
                                            </button>
                                        </div>

                                        {/* Other Members */}
                                        {familyData?.members?.map((member, idx) => (
                                            <div key={idx} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '2rem' }}>{member.gender === 'Male' ? '👨' : '👩'}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{member.full_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{member.relation} (ID: {member.member_id})</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setEditingMember(member)}
                                                    className="cta-button"
                                                    style={{ width: '100%', padding: '10px', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                                                >
                                                    Edit Details
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pending Requests Section */}
                                    {updateRequests?.length > 0 && (
                                        <div style={{ marginTop: '40px' }}>
                                            <h4 style={{ marginBottom: '15px', color: '#334155' }}>Recent Update Requests</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {updateRequests.map((req, idx) => (
                                                    <div key={idx} style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: req.status === 'Pending' ? '4px solid #f59e0b' : '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>Update for {req.target_member_id === 'HEAD' ? 'Family Head' : req.target_member_id}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Status: {req.status} | Stage: {req.current_stage}</div>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(req.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="edit-form-container">
                                    <div style={{ marginBottom: '25px', padding: '15px 20px', background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>👤</span>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Editing Profile</div>
                                            <strong style={{ color: '#1e293b' }}>{editingMember.full_name}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                        {/* PERSONAL DETAILS SECTION */}
                                        <section style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>🪪</div>
                                                <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 700 }}>Personal Details</h4>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Full Name</label>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <select style={{ width: '100px', padding: '12px' }} className="form-input" value={editingMember.full_name_title || 'Shri'} onChange={e => setEditingMember({ ...editingMember, full_name_title: e.target.value })}>
                                                            {PREFIX_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                        </select>
                                                        <input className="form-input" style={{ flex: 1, padding: '12px' }} value={editingMember.full_name} onChange={e => setEditingMember({ ...editingMember, full_name: e.target.value })} />
                                                    </div>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Full Name (Hindi)</label>
                                                    <input className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.full_name_hindi || ''} onChange={e => setEditingMember({ ...editingMember, full_name_hindi: e.target.value })} />
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Father / Husband Name</label>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <select style={{ width: '100px', padding: '12px' }} className="form-input" value={editingMember.father_husband_title || 'Shri'} onChange={e => setEditingMember({ ...editingMember, father_husband_title: e.target.value })}>
                                                            {PREFIX_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                        </select>
                                                        <input className="form-input" style={{ flex: 1, padding: '12px' }} value={editingMember.father_husband_name || editingMember.father_name || ''} onChange={e => setEditingMember({ ...editingMember, father_husband_name: e.target.value, father_name: e.target.value })} />
                                                    </div>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Father / Husband Name (Hindi)</label>
                                                    <input className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.father_husband_name_hindi || editingMember.father_name_hindi || ''} onChange={e => setEditingMember({ ...editingMember, father_husband_name_hindi: e.target.value, father_name_hindi: e.target.value })} />
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Gender</label>
                                                    <select className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.gender} onChange={e => setEditingMember({ ...editingMember, gender: e.target.value })}>
                                                        {formOptions?.gender.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                    </select>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Date of Birth</label>
                                                    <DateInput className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.dob} onChange={e => setEditingMember({ ...editingMember, dob: e.target.value })} />
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Marital Status</label>
                                                    <select className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.marital_status} onChange={e => setEditingMember({ ...editingMember, marital_status: e.target.value })}>
                                                        {formOptions?.marital_status.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                    </select>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Blood Group</label>
                                                    <select className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.blood_group || ''} onChange={e => setEditingMember({ ...editingMember, blood_group: e.target.value })}>
                                                        <option value="">Select</option>
                                                        {formOptions?.blood_group.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                    </select>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Mobile Number</label>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <CountryCodeSearch
                                                            value={editingMember.mobile_country_code || '+91'}
                                                            onChange={val => setEditingMember({ ...editingMember, mobile_country_code: val })}
                                                            options={countryCodes}
                                                        />
                                                        <input className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.mobile} onChange={e => setEditingMember({ ...editingMember, mobile: e.target.value })} />
                                                    </div>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>WhatsApp Number</label>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <CountryCodeSearch
                                                            value={editingMember.whatsapp_country_code || '+91'}
                                                            onChange={val => setEditingMember({ ...editingMember, whatsapp_country_code: val })}
                                                            options={countryCodes}
                                                        />
                                                        <input className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.whatsapp || ''} onChange={e => setEditingMember({ ...editingMember, whatsapp: e.target.value })} />
                                                    </div>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Education</label>
                                                    <select className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.education_level} onChange={e => setEditingMember({ ...editingMember, education_level: e.target.value })}>
                                                        {formOptions?.education_level.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                    </select>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Occupation Type</label>
                                                    <select className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.occupation_type} onChange={e => setEditingMember({ ...editingMember, occupation_type: e.target.value })}>
                                                        {formOptions?.occupation.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                    </select>
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Designation</label>
                                                    <input className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.designation || ''} onChange={e => setEditingMember({ ...editingMember, designation: e.target.value })} />
                                                </div>

                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Organization</label>
                                                    <input className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.organization || ''} onChange={e => setEditingMember({ ...editingMember, organization: e.target.value })} />
                                                </div>


                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Is Earning?</label>
                                                    <select className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.is_earning || 'No'} onChange={e => setEditingMember({ ...editingMember, is_earning: e.target.value })}>
                                                        <option value="Yes">Yes</option>
                                                        <option value="No">No</option>
                                                    </select>
                                                </div>

                                                {/* Education History & Skills Section */}
                                                <div className="input-group" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                                                    <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        🎓 Academic & Professional Details
                                                    </h5>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        <div className="input-group">
                                                            <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '10px', display: 'block' }}>Education History (Exam Form Style)</label>
                                                            <EducationHistoryManager
                                                                history={editingMember.education_history || []}
                                                                onChange={val => setEditingMember({ ...editingMember, education_history: val })}
                                                                t={t}
                                                                language={language}
                                                            />
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            <EnhancedListManager
                                                                items={editingMember.specialization_courses || []}
                                                                onAdd={val => setEditingMember({ ...editingMember, specialization_courses: [...(editingMember.specialization_courses || []), val] })}
                                                                onRemove={val => setEditingMember({ ...editingMember, specialization_courses: (editingMember.specialization_courses || []).filter(x => x !== val) })}
                                                                placeholder={t.addSpecialization}
                                                                label={t.specialization}
                                                                options={formOptions?.specialization_courses || []}
                                                                language={language}
                                                            />
                                                            <EnhancedListManager
                                                                items={editingMember.skills || []}
                                                                onAdd={val => setEditingMember({ ...editingMember, skills: [...(editingMember.skills || []), val] })}
                                                                onRemove={val => setEditingMember({ ...editingMember, skills: (editingMember.skills || []).filter(x => x !== val) })}
                                                                placeholder={t.addSkill}
                                                                label={t.skills}
                                                                options={formOptions?.skills || []}
                                                                language={language}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                                                    <div className="input-group">
                                                        <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Residence Status</label>
                                                        <select className="form-input" style={{ width: '100%', padding: '12px' }} value={editingMember.residence_status || 'With Family'} onChange={e => setEditingMember({ ...editingMember, residence_status: e.target.value })}>
                                                            <option value="With Family">With Family</option>
                                                            <option value="Staying Separate">Staying Separate</option>
                                                        </select>
                                                    </div>

                                                    {editingMember.residence_status === 'Staying Separate' && (
                                                        <div className="input-group">
                                                            <label style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Purpose (Separate Stay)</label>
                                                            <select
                                                                className="form-input"
                                                                style={{ width: '100%', padding: '10px' }}
                                                                value={editingMember.separate_stay_purpose || ''}
                                                                onChange={e => setEditingMember({ ...editingMember, separate_stay_purpose: e.target.value })}
                                                            >
                                                                <option value="">Select Purpose</option>
                                                                <option value="Job/Service">Job / Service</option>
                                                                <option value="Education">Education</option>
                                                                <option value="Business">Business</option>
                                                                <option value="Marriage">Marriage</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                {editingMember.residence_status === 'Staying Separate' && (
                                                    <div style={{ gridColumn: '1 / -1', marginTop: '15px', padding: '20px', background: '#fff7ed', borderRadius: '12px', border: '1px dashed #f97316' }}>
                                                        <h5 style={{ margin: '0 0 15px 0', color: '#c2410c', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span>🏙️</span> Separate Residence Address
                                                        </h5>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 600, marginBottom: '4px', display: 'block' }}>House No / Building</label>
                                                                <input
                                                                    placeholder="e.g. Flat 101, Shanti Niketan"
                                                                    value={editingMember.current_address?.house_no || ''}
                                                                    onChange={e => setEditingMember({ ...editingMember, current_address: { ...(editingMember.current_address || {}), house_no: e.target.value } })}
                                                                    className="form-input"
                                                                    style={{ width: '100%', padding: '10px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Locality / Area</label>
                                                                <input
                                                                    placeholder="e.g. Malviya Nagar"
                                                                    value={editingMember.current_address?.locality || ''}
                                                                    onChange={e => setEditingMember({ ...editingMember, current_address: { ...(editingMember.current_address || {}), locality: e.target.value } })}
                                                                    className="form-input"
                                                                    style={{ width: '100%', padding: '10px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 600, marginBottom: '4px', display: 'block' }}>City / District</label>
                                                                <input
                                                                    placeholder="e.g. Jaipur"
                                                                    value={editingMember.current_address?.city || ''}
                                                                    onChange={e => setEditingMember({ ...editingMember, current_address: { ...(editingMember.current_address || {}), city: e.target.value } })}
                                                                    className="form-input"
                                                                    style={{ width: '100%', padding: '10px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 600, marginBottom: '4px', display: 'block' }}>State</label>
                                                                <input
                                                                    placeholder="e.g. Rajasthan"
                                                                    value={editingMember.current_address?.state || ''}
                                                                    onChange={e => setEditingMember({ ...editingMember, current_address: { ...(editingMember.current_address || {}), state: e.target.value } })}
                                                                    className="form-input"
                                                                    style={{ width: '100%', padding: '10px' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        {/* ADDRESS DETAILS SECTION */}
                                        <section style={{ background: '#f0f9ff', padding: '24px', borderRadius: '20px', border: '1px solid #bae6fd', position: 'relative', overflow: 'hidden' }}>
                                            {/* Subtle decorative background icon */}
                                            <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: 0.05, transform: 'rotate(15deg)' }}>🏠</div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #bae6fd', paddingBottom: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>📍</div>
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#0369a1', fontSize: '1.1rem', fontWeight: 700 }}>Address Details</h4>
                                                    <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600, textTransform: 'uppercase' }}>Requires Secretary Approval</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                                                        PIN Code {isPinLoading && <span style={{ color: '#0ea5e9', fontSize: '0.7rem' }}>...</span>}
                                                    </label>
                                                    <input
                                                        placeholder="6 Digit PIN"
                                                        className="form-input"
                                                        style={{ width: '100%', borderColor: '#bae6fd' }}
                                                        value={editingMember.residence_address?.pin_code || ''}
                                                        onChange={e => handleAddrPinChange(e.target.value)}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>House No / Street</label>
                                                    <input placeholder="H.No" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.house_no || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, house_no: e.target.value } })} />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Locality / Colony</label>
                                                    <input placeholder="Locality" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.locality || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, locality: e.target.value } })} />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Village / Town / City</label>
                                                    <input placeholder="City" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.village_town_city || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, village_town_city: e.target.value } })} />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Block / Tehsil</label>
                                                    <input placeholder="Block" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.block_tehsil || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, block_tehsil: e.target.value } })} />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Post Office</label>
                                                    <input placeholder="P.O" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.post_office || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, post_office: e.target.value } })} />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Police Station</label>
                                                    <input placeholder="P.S" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.police_station || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, police_station: e.target.value } })} />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>District</label>
                                                    <input placeholder="District" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.district || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, district: e.target.value } })} />
                                                </div>
                                                <div className="input-group">
                                                    <label style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>State</label>
                                                    <input placeholder="State" className="form-input" style={{ width: '100%', borderColor: '#bae6fd' }} value={editingMember.residence_address?.state || ''} onChange={e => setEditingMember({ ...editingMember, residence_address: { ...editingMember.residence_address, state: e.target.value } })} />
                                                </div>
                                            </div>
                                        </section>

                                        {/* REASON SECTION */}
                                        <section style={{ padding: '0 5px' }}>
                                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '1rem' }}>📝</span>
                                                <label style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>Reason for Update *</label>
                                            </div>
                                            <textarea
                                                className="form-input"
                                                style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '12px', resize: 'none' }}
                                                placeholder="Briefly explain why you want to change these details. This helps the committee verify your request faster."
                                                id="update-reason"
                                                required
                                            ></textarea>
                                        </section>
                                    </div>

                                    <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setEditingMember(null)} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}>Cancel</button>
                                        <button
                                            onClick={async () => {
                                                const reason = document.getElementById('update-reason').value;
                                                if (!reason) return alert("Please provide a reason");
                                                try {
                                                    await api.createUpdateRequest({
                                                        member_id: editingMember.member_id,
                                                        changes: editingMember,
                                                        reason: reason
                                                    });
                                                    alert("Update request submitted! It will be reviewed by the respective authority.");
                                                    setEditingMember(null);
                                                    fetchData();
                                                } catch (err) {
                                                    alert("Failed to submit request: " + (err.response?.data?.detail || err.message));
                                                }
                                            }}
                                            className="cta-button"
                                            style={{ padding: '12px 40px' }}
                                        >
                                            Submit for Approval
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
                {
                    activeTab === 'family' && (
                        <div className="family-tab" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {familyData?.status === 'Profile Incomplete' ? (
                                <RegisterFamily isEmbedded={true} onSuccess={fetchData} />
                            ) : (
                                <>
                                    {(() => {
                                        const displayMembers = familyData ? [
                                            {
                                                ...familyData.head_details,
                                                relation: 'Family Head (Self)',
                                                member_id: familyData.family_id + '-H01',
                                                isHead: true
                                            },
                                            ...(familyData.members || [])
                                        ] : [];

                                        return (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                                                    <h3>My Family Members ({displayMembers.length})</h3>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        {/* View Toggle Buttons */}
                                                        <div style={{ display: 'flex', gap: '5px', background: '#f0f0f0', padding: '4px', borderRadius: '8px' }}>
                                                            {[
                                                                { id: 'list', icon: '☰', label: 'List' },
                                                                { id: 'tile', icon: '⊞', label: 'Tiles' },
                                                                { id: 'tree', icon: '🌳', label: 'Tree' }
                                                            ].map(view => (
                                                                <button
                                                                    key={view.id}
                                                                    onClick={() => setUserState(prev => ({ ...prev, viewMode: view.id }))}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        background: (userState.viewMode || 'list') === view.id ? 'var(--primary-blue)' : 'transparent',
                                                                        color: (userState.viewMode || 'list') === view.id ? 'white' : '#666',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 600,
                                                                        fontSize: '0.85rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    <span>{view.icon}</span>
                                                                    <span>{view.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => setUserState(prev => ({ ...prev, showAddMemberModal: true }))}
                                                            style={{ padding: '8px 15px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            + Add New Member
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* LIST VIEW */}
                                                {(!userState.viewMode || userState.viewMode === 'list') && (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                                                <th style={{ padding: '10px' }}>Member ID</th>
                                                                <th style={{ padding: '10px' }}>Name</th>
                                                                <th style={{ padding: '10px' }}>Relation</th>
                                                                <th style={{ padding: '10px' }}>Gender</th>
                                                                <th style={{ padding: '10px' }}>DOB</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {displayMembers.map((mem, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    onClick={() => setUserState(prev => ({ ...prev, selectedMember: mem }))}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        transition: 'background 0.2s',
                                                                        background: mem.isHead ? '#f0f7ff' : 'white'
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = mem.isHead ? '#f0f7ff' : 'white'}
                                                                >
                                                                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #eee' }}>
                                                                        {mem.isHead && <span style={{ background: 'var(--primary-blue)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, marginRight: '8px' }}>HEAD</span>}
                                                                        {mem.member_id || '-'}
                                                                    </td>
                                                                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #eee', fontWeight: mem.isHead ? 700 : 400 }}>{mem.full_name}</td>
                                                                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #eee' }}>{mem.relation}</td>
                                                                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #eee' }}>{mem.gender}</td>
                                                                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #eee' }}>{mem.dob}</td>
                                                                </tr>
                                                            ))}

                                                            {/* Pending Members */}
                                                            {familyData?.pending_members?.map((req, idx) => (
                                                                <tr
                                                                    key={`pending-${idx}`}
                                                                    style={{ background: '#fffbeb', cursor: 'pointer' }}
                                                                    onClick={() => setUserState(prev => ({ ...prev, selectedMember: req.member }))}
                                                                    onMouseEnter={e => e.currentTarget.style.background = '#fff3cd'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = '#fffbeb'}
                                                                >
                                                                    <td style={{ padding: '10px', borderBottom: '1px solid #eee', color: '#b7791f', fontStyle: 'italic' }}>Pending...</td>
                                                                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{req.member.full_name}</td>
                                                                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{req.member.relation}</td>
                                                                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{req.member.gender}</td>
                                                                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                                                        {req.member.dob}
                                                                        <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#b7791f' }}>Stage: {req.verification_stage}</div>
                                                                    </td>
                                                                </tr>
                                                            ))}

                                                            {(!familyData?.members || familyData.members.length === 0) && (!familyData?.pending_members || familyData.pending_members.length === 0) && (
                                                                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No members found.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}

                                                {userState.viewMode === 'tile' && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                                        {displayMembers.map((mem, idx) => (
                                                            <div key={idx} style={{
                                                                background: mem.isHead ? 'linear-gradient(135deg, #fff 0%, #f0f7ff 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                                                border: mem.isHead ? '2px solid var(--primary-blue)' : '1px solid #dee2e6',
                                                                borderRadius: '12px',
                                                                padding: '20px',
                                                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                                                transition: 'all 0.3s',
                                                                cursor: 'pointer',
                                                                position: 'relative'
                                                            }}
                                                                onClick={() => setUserState(prev => ({ ...prev, selectedMember: mem }))}
                                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                            >
                                                                {mem.isHead && (
                                                                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-blue)', color: 'white', padding: '4px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                                                        🏆 FAMILY HEAD
                                                                    </div>
                                                                )}
                                                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                                                    <div style={{
                                                                        width: '80px',
                                                                        height: '80px',
                                                                        borderRadius: '50%',
                                                                        background: mem.gender === 'Male' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        margin: '0 auto',
                                                                        fontSize: '2.5rem',
                                                                        color: 'white',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                                                    }}>
                                                                        {mem.gender === 'Male' ? '👨' : '👩'}
                                                                    </div>
                                                                </div>
                                                                <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', color: '#2c3e50', fontSize: '1.2rem', fontWeight: 800 }}>{mem.full_name}</h4>
                                                                <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                                                                        <span style={{ color: '#6c757d', fontWeight: 600 }}>ID:</span>
                                                                        <span style={{ color: '#495057', fontWeight: 700 }}>{mem.member_id || '-'}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                                                                        <span style={{ color: '#6c757d', fontWeight: 600 }}>Relation:</span>
                                                                        <span style={{ color: '#495057', fontWeight: 700 }}>{mem.relation}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                                                                        <span style={{ color: '#6c757d', fontWeight: 600 }}>DOB:</span>
                                                                        <span style={{ color: '#495057', fontWeight: 700 }}>{mem.dob}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Pending Members in Tile View */}
                                                        {familyData?.pending_members?.map((req, idx) => (
                                                            <div
                                                                key={`pending-${idx}`}
                                                                onClick={() => setUserState(prev => ({ ...prev, selectedMember: req.member }))}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
                                                                    border: '2px dashed #ffb700',
                                                                    borderRadius: '12px',
                                                                    padding: '20px',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                                    opacity: 0.8
                                                                }}>
                                                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                                                    <div style={{
                                                                        width: '80px',
                                                                        height: '80px',
                                                                        borderRadius: '50%',
                                                                        background: 'linear-gradient(135deg, #ffd89b 0%, #ff9a56 100%)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        margin: '0 auto',
                                                                        fontSize: '2.5rem'
                                                                    }}>
                                                                        ⏳
                                                                    </div>
                                                                </div>
                                                                <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', color: '#856404', fontSize: '1.1rem', fontWeight: 700 }}>{req.member.full_name}</h4>
                                                                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#856404', fontWeight: 600, marginBottom: '10px' }}>
                                                                    🟡 Pending Approval
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: '#856404', textAlign: 'center', background: 'rgba(255,255,255,0.5)', padding: '6px', borderRadius: '6px' }}>
                                                                    Stage: {req.verification_stage}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {(!displayMembers || displayMembers.length === 0) && (!familyData?.pending_members || familyData.pending_members.length === 0) && (
                                                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#999' }}>No members found.</div>
                                                        )}

                                                        {/* Add New Member Tile */}
                                                        <div
                                                            onClick={() => setUserState(prev => ({ ...prev, showAddMemberModal: true }))}
                                                            style={{
                                                                background: 'white',
                                                                border: '2px dashed #cbd5e1',
                                                                borderRadius: '12px',
                                                                padding: '30px 20px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s',
                                                                minHeight: '220px',
                                                                textAlign: 'center'
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.borderColor = 'var(--primary-blue)';
                                                                e.currentTarget.style.background = '#f0f9ff';
                                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                                                e.currentTarget.style.background = 'white';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                borderRadius: '50%',
                                                                background: '#f1f5f9',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '2rem',
                                                                marginBottom: '15px',
                                                                color: 'var(--primary-blue)'
                                                            }}>
                                                                ➕
                                                            </div>
                                                            <h4 style={{ margin: 0, color: 'var(--primary-blue)', fontWeight: 800 }}>Add Family Member</h4>
                                                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Add children, spouse or parents to your family profile.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TREE VIEW - Vanshavali Style */}
                                                {userState.viewMode === 'tree' && (
                                                    <div style={{ padding: '30px', background: 'linear-gradient(135deg, #fef9e7 0%, #fcf3d9 100%)', borderRadius: '12px', overflowX: 'auto', border: '2px solid #d4af37' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '800px' }}>

                                                            {(() => {
                                                                // Use all members for now, including the head
                                                                const allMembers = displayMembers;

                                                                // Find family head (already marked with isHead)
                                                                const head = allMembers.find(m => m.isHead) || allMembers[0];
                                                                const spouse = allMembers.find(m => m?.relation === 'Wife' || m?.relation === 'Husband');
                                                                const children = allMembers.filter(m => m?.relation === 'Son' || m?.relation === 'Daughter');
                                                                const parents = allMembers.filter(m => m?.relation === 'Father' || m?.relation === 'Mother');
                                                                const siblings = allMembers.filter(m => m?.relation === 'Brother' || m?.relation === 'Sister');
                                                                const others = allMembers.filter(m =>
                                                                    m !== head &&
                                                                    !['Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister'].includes(m?.relation)
                                                                );

                                                                if (!head || allMembers.length === 0) {
                                                                    return <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                                                        No family tree to display.
                                                                    </div>;
                                                                }

                                                                return (
                                                                    <>
                                                                        {/* Parents Generation (if any) */}
                                                                        {parents.length > 0 && (
                                                                            <>
                                                                                <div style={{ marginBottom: '20px' }}>
                                                                                    <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
                                                                                        {parents.map((parent, idx) => (
                                                                                            <div
                                                                                                key={idx}
                                                                                                onClick={() => setUserState(prev => ({ ...prev, selectedMember: parent }))}
                                                                                                style={{
                                                                                                    background: parent.gender === 'Male' ? 'linear-gradient(135deg, #5a67d8 0%, #4c51bf 100%)' : 'linear-gradient(135deg, #ed64a6 0%, #d53f8c 100%)',
                                                                                                    color: 'white',
                                                                                                    padding: '12px 20px',
                                                                                                    borderRadius: '12px',
                                                                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                                                                                    textAlign: 'center',
                                                                                                    minWidth: '150px',
                                                                                                    cursor: 'pointer'
                                                                                                }}>
                                                                                                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{parent.gender === 'Male' ? '👨' : '👩'}</div>
                                                                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>{parent.full_name}</h4>
                                                                                                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{parent.relation}</div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                {/* Connector from parents to head */}
                                                                                <div style={{ width: '3px', height: '40px', background: '#d4af37', marginBottom: '10px' }}></div>
                                                                            </>
                                                                        )}

                                                                        {/* Family Head + Spouse (Current Generation) */}
                                                                        <div style={{ marginBottom: '30px' }}>
                                                                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                                                                {/* Family Head - LARGER */}
                                                                                <div
                                                                                    onClick={() => setUserState(prev => ({ ...prev, selectedMember: head }))}
                                                                                    style={{
                                                                                        background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                                                                        color: '#1a1a1a',
                                                                                        padding: '30px 40px',
                                                                                        borderRadius: '20px',
                                                                                        boxShadow: '0 12px 30px rgba(255, 215, 0, 0.4)',
                                                                                        textAlign: 'center',
                                                                                        minWidth: '300px',
                                                                                        border: '3px solid #d4af37',
                                                                                        position: 'relative',
                                                                                        cursor: 'pointer'
                                                                                    }}>
                                                                                    {/* Crown Icon */}
                                                                                    <div style={{
                                                                                        position: 'absolute',
                                                                                        top: '-20px',
                                                                                        left: '50%',
                                                                                        transform: 'translateX(-50%)',
                                                                                        fontSize: '3rem',
                                                                                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
                                                                                    }}>👑</div>
                                                                                    <div style={{
                                                                                        width: '120px',
                                                                                        height: '120px',
                                                                                        borderRadius: '50%',
                                                                                        background: head.gender === 'Male' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        margin: '20px auto 15px',
                                                                                        fontSize: '4rem',
                                                                                        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                                                                                        border: '4px solid white'
                                                                                    }}>
                                                                                        {head.gender === 'Male' ? '👨' : '👩'}
                                                                                    </div>
                                                                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: 900, color: '#1a1a1a' }}>{head.full_name}</h3>
                                                                                    <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#4a3500' }}>🏠 Family Head</div>
                                                                                    <div style={{ fontSize: '0.9rem', opacity: 0.8, background: 'rgba(255,255,255,0.4)', padding: '4px 12px', borderRadius: '20px', display: 'inline-block' }}>
                                                                                        ID: {head.member_id || 'Pending'}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Spouse - beside head */}
                                                                                {spouse && (
                                                                                    <>
                                                                                        {/* Marriage Connection Line */}
                                                                                        <div style={{ width: '40px', height: '3px', background: '#d4af37', position: 'relative' }}>
                                                                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.5rem' }}>💑</div>
                                                                                        </div>

                                                                                        <div
                                                                                            onClick={() => setUserState(prev => ({ ...prev, selectedMember: spouse }))}
                                                                                            style={{
                                                                                                background: spouse.gender === 'Male' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                                                                color: 'white',
                                                                                                padding: '25px 30px',
                                                                                                borderRadius: '18px',
                                                                                                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                                                                                textAlign: 'center',
                                                                                                minWidth: '240px',
                                                                                                border: '3px solid rgba(255,255,255,0.3)',
                                                                                                cursor: 'pointer'
                                                                                            }}>
                                                                                            <div style={{
                                                                                                width: '90px',
                                                                                                height: '90px',
                                                                                                borderRadius: '50%',
                                                                                                background: 'rgba(255,255,255,0.2)',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                margin: '0 auto 12px',
                                                                                                fontSize: '3rem',
                                                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                                                                border: '3px solid white'
                                                                                            }}>
                                                                                                {spouse.gender === 'Male' ? '👨' : '👩'}
                                                                                            </div>
                                                                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800 }}>{spouse.full_name}</h4>
                                                                                            <div style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: 600 }}>{spouse.relation}</div>
                                                                                            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '6px' }}>ID: {spouse.member_id || '-'}</div>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Connector to children */}
                                                                        {children.length > 0 && (
                                                                            <div style={{ width: '3px', height: '50px', background: '#d4af37', marginBottom: '20px' }}></div>
                                                                        )}

                                                                        {/* Children Generation */}
                                                                        {children.length > 0 && (
                                                                            <div style={{ marginBottom: '30px' }}>
                                                                                <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '1.1rem', fontWeight: 700, color: '#8b4513' }}>
                                                                                    👶 Next Generation
                                                                                </div>
                                                                                <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                                                                                    {/* Horizontal line connecting all children */}
                                                                                    {children.length > 1 && (
                                                                                        <div style={{
                                                                                            position: 'absolute',
                                                                                            top: 0,
                                                                                            left: '15%',
                                                                                            right: '15%',
                                                                                            height: '3px',
                                                                                            background: '#d4af37',
                                                                                            zIndex: 0
                                                                                        }}></div>
                                                                                    )}

                                                                                    {children.map((child, idx) => (
                                                                                        <div key={idx} style={{ position: 'relative', zIndex: 1 }}>
                                                                                            {/* Vertical connector from horizontal line to child */}
                                                                                            <div style={{ width: '3px', height: '20px', background: '#d4af37', margin: '0 auto' }}></div>

                                                                                            <div
                                                                                                onClick={() => setUserState(prev => ({ ...prev, selectedMember: child }))}
                                                                                                style={{
                                                                                                    background: child.gender === 'Male' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                                                                    color: 'white',
                                                                                                    padding: '18px 24px',
                                                                                                    borderRadius: '14px',
                                                                                                    boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                                                                                                    textAlign: 'center',
                                                                                                    minWidth: '180px',
                                                                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                                                                    cursor: 'pointer'
                                                                                                }}>
                                                                                                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{child.gender === 'Male' ? '👦' : '👧'}</div>
                                                                                                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700 }}>{child.full_name}</h4>
                                                                                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{child.relation}</div>
                                                                                                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '6px' }}>{child.dob}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Siblings (if any) */}
                                                                        {siblings.length > 0 && (
                                                                            <div style={{ marginTop: '30px' }}>
                                                                                <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '1rem', fontWeight: 700, color: '#8b4513' }}>
                                                                                    👥 Siblings
                                                                                </div>
                                                                                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                                                    {siblings.map((sibling, idx) => (
                                                                                        <div
                                                                                            key={idx}
                                                                                            onClick={() => setUserState(prev => ({ ...prev, selectedMember: sibling }))}
                                                                                            style={{
                                                                                                background: sibling.gender === 'Male' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                                                                color: 'white',
                                                                                                padding: '15px 20px',
                                                                                                borderRadius: '12px',
                                                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                                                                                textAlign: 'center',
                                                                                                minWidth: '160px',
                                                                                                cursor: 'pointer'
                                                                                            }}>
                                                                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{sibling.gender === 'Male' ? '👨' : '👩'}</div>
                                                                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 700 }}>{sibling.full_name}</h4>
                                                                                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{sibling.relation}</div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Other Relations */}
                                                                        {others.length > 0 && (
                                                                            <div style={{ marginTop: '30px' }}>
                                                                                <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '1rem', fontWeight: 700, color: '#8b4513' }}>
                                                                                    👪 Other Family Members
                                                                                </div>
                                                                                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                                                    {others.map((member, idx) => (
                                                                                        <div
                                                                                            key={idx}
                                                                                            onClick={() => setUserState(prev => ({ ...prev, selectedMember: member }))}
                                                                                            style={{
                                                                                                background: member.gender === 'Male' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                                                                color: 'white',
                                                                                                padding: '15px 20px',
                                                                                                borderRadius: '12px',
                                                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                                                                                textAlign: 'center',
                                                                                                minWidth: '160px',
                                                                                                cursor: 'pointer'
                                                                                            }}>
                                                                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{member.gender === 'Male' ? '👨' : '👩'}</div>
                                                                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 700 }}>{member.full_name}</h4>
                                                                                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{member.relation}</div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Pending Members */}
                                                                        {familyData?.pending_members?.length > 0 && (
                                                                            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px dashed #d4af37' }}>
                                                                                <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '1rem', fontWeight: 700, color: '#856404' }}>
                                                                                    ⏳ Pending Approval
                                                                                </div>
                                                                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                                                    {familyData.pending_members.map((req, idx) => (
                                                                                        <div key={`pending-tree-${idx}`} onClick={() => setUserState(prev => ({ ...prev, selectedMember: req.member }))} style={{
                                                                                            background: 'linear-gradient(135deg, #ffd89b 0%, #ff9a56 100%)',
                                                                                            color: '#856404',
                                                                                            padding: '15px 20px',
                                                                                            borderRadius: '12px',
                                                                                            border: '2px dashed #ffb700',
                                                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                                            textAlign: 'center',
                                                                                            minWidth: '160px',
                                                                                            opacity: 0.85,
                                                                                            cursor: 'pointer'
                                                                                        }}>
                                                                                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                                                                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 700 }}>{req.member.full_name}</h4>
                                                                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{req.member.relation}</div>
                                                                                            <div style={{ fontSize: '0.75rem', marginTop: '6px' }}>{req.verification_stage}</div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}


                                    {/* Member Detail Modal */}
                                    {userState.selectedMember && (
                                        <MemberDetailModal
                                            member={userState.selectedMember}
                                            onClose={() => setUserState(prev => ({ ...prev, selectedMember: null }))}
                                        />
                                    )}

                                    {userState.showAddMemberModal && (
                                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
                                            <div style={{ background: 'white', borderRadius: '28px', width: '95%', maxWidth: '950px', maxHeight: '92vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', animation: 'modalAppear 0.3s ease-out' }}>
                                                {/* Sticky Header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 40px', borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 900 }}>{t.form.addMember}</h3>
                                                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Fill in the details to add a new member to your family profile.</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setUserState(prev => ({ ...prev, showAddMemberModal: false }))} 
                                                        style={{ background: '#f8fafc', border: 'none', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'all 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                                        onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                                                    >×</button>
                                                </div>

                                                {/* Scrollable Content */}
                                                <div style={{ padding: '40px', overflowY: 'auto', flex: 1, background: '#fbfcfd' }}>
                                                    {formOptions ? (
                                                        <form id="add-member-form" onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            try {
                                                                await api.addMemberRequest(memberTemp);
                                                                alert("Member addition request submitted! The committee will review it soon.");
                                                                setUserState(prev => ({ ...prev, showAddMemberModal: false }));
                                                                setMemberTemp(initialMemberState);
                                                                fetchData();
                                                            } catch (err) {
                                                                alert("Failed: " + (err.response?.data?.detail || err.message));
                                                            }
                                                        }}>
                                                            {/* SECTION: PERSONAL DETAILS */}
                                                            <div style={{ marginBottom: '40px' }}>
                                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                                                                    <span style={{ background: '#e0f2fe', padding: '6px', borderRadius: '8px', fontSize: '1.2rem' }}>👤</span>
                                                                    {t.form.personalDetails}
                                                                </h4>
                                                                
                                                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.fullName} *</label>
                                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                                            <select 
                                                                                style={{ width: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, color: '#1e293b' }} 
                                                                                value={memberTemp.full_name_title} 
                                                                                onChange={e => handleMemberChange('full_name_title', e.target.value)}
                                                                            >
                                                                                {PREFIX_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                            </select>
                                                                            <input 
                                                                                className="form-input" 
                                                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', transition: 'border-color 0.2s' }} 
                                                                                placeholder={t.form.placeholderName} 
                                                                                value={memberTemp.full_name} 
                                                                                onChange={e => handleMemberChange('full_name', e.target.value)} 
                                                                                required 
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.fullNameHindi}</label>
                                                                        <input 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            placeholder="लिखते ही अपने आप अनुवाद होगा" 
                                                                            value={memberTemp.full_name_hindi || ''} 
                                                                            onChange={e => handleMemberChange('full_name_hindi', e.target.value)} 
                                                                        />
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.relation} *</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.relation} 
                                                                            onChange={e => handleMemberChange('relation', e.target.value)} 
                                                                            required
                                                                        >
                                                                            <option value="">{t.form.selectRelation}</option>
                                                                            {formOptions.relation.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                        </select>
                                                                        {memberTemp.relation === 'Other' && (
                                                                            <input 
                                                                                className="form-input" 
                                                                                style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                                placeholder="Please specify relation" 
                                                                                value={memberTemp.relation_other} 
                                                                                onChange={e => handleMemberChange('relation_other', e.target.value)} 
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.fatherHusband} *</label>
                                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                                            <select 
                                                                                style={{ width: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }} 
                                                                                value={memberTemp.father_husband_title} 
                                                                                onChange={e => handleMemberChange('father_husband_title', e.target.value)}
                                                                            >
                                                                                {PREFIX_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                            </select>
                                                                            <input 
                                                                                className="form-input" 
                                                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                                placeholder={t.form.placeholderFather} 
                                                                                value={memberTemp.father_husband_name} 
                                                                                onChange={e => handleMemberChange('father_husband_name', e.target.value)} 
                                                                                required 
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.fatherNameHindi}</label>
                                                                        <input 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            placeholder="हिंदी नाम" 
                                                                            value={memberTemp.father_husband_name_hindi || ''} 
                                                                            onChange={e => handleMemberChange('father_husband_name_hindi', e.target.value)} 
                                                                        />
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.gender} *</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.gender} 
                                                                            onChange={e => handleMemberChange('gender', e.target.value)}
                                                                        >
                                                                            <option value="">{t.form.selectGender}</option>
                                                                            {formOptions.gender.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                        </select>
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.dob} *</label>
                                                                        <DateInput 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.dob} 
                                                                            onChange={e => handleMemberChange('dob', e.target.value)} 
                                                                            required 
                                                                        />
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.maritalStatus}</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.marital_status} 
                                                                            onChange={e => handleMemberChange('marital_status', e.target.value)}
                                                                        >
                                                                            <option value="">{t.form.selectMaritalStatus}</option>
                                                                            {formOptions.marital_status.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                        </select>
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.mobile}</label>
                                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                                            <CountryCodeSearch
                                                                                value={memberTemp.mobile_country_code || '+91'}
                                                                                onChange={val => handleMemberChange('mobile_country_code', val)}
                                                                                options={countryCodes}
                                                                            />
                                                                            <input 
                                                                                className="form-input" 
                                                                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                                placeholder="10-digit mobile" 
                                                                                value={memberTemp.mobile} 
                                                                                onChange={e => handleMemberChange('mobile', e.target.value)} 
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.bloodGroup}</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.blood_group} 
                                                                            onChange={e => handleMemberChange('blood_group', e.target.value)}
                                                                        >
                                                                            <option value="">Select</option>
                                                                            {formOptions.blood_group.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* SECTION: EDUCATION & OCCUPATION */}
                                                            <div style={{ marginBottom: '40px' }}>
                                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                                                                    <span style={{ background: '#fef3c7', padding: '6px', borderRadius: '8px', fontSize: '1.2rem' }}>🎓</span>
                                                                    {t.form.educationOccupation}
                                                                </h4>

                                                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.education}</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.education_level} 
                                                                            onChange={e => handleMemberChange('education_level', e.target.value)}
                                                                        >
                                                                            <option value="">{t.form.selectEducation}</option>
                                                                            {formOptions.education_level.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                        </select>
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.occupation}</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.occupation_type} 
                                                                            onChange={e => handleMemberChange('occupation_type', e.target.value)}
                                                                        >
                                                                            <option value="">{t.form.selectOccupation}</option>
                                                                            {formOptions.occupation.map(opt => <option key={opt.value} value={opt.value}>{opt[language]}</option>)}
                                                                        </select>
                                                                        {memberTemp.occupation_type === 'Other' && (
                                                                            <input 
                                                                                className="form-input" 
                                                                                style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                                placeholder="Please specify" 
                                                                                value={memberTemp.occupation_type_other} 
                                                                                onChange={e => handleMemberChange('occupation_type_other', e.target.value)} 
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.isEarning}</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.is_earning} 
                                                                            onChange={e => handleMemberChange('is_earning', e.target.value)}
                                                                        >
                                                                            <option value="No">{t.form.notEarning}</option>
                                                                            <option value="Yes">{t.form.earning}</option>
                                                                        </select>
                                                                    </div>

                                                                    {['Employed', 'Business', 'Self-Employed', 'Service'].includes(memberTemp.occupation_type) && (
                                                                        <>
                                                                            <div className="input-group">
                                                                                <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.designation}</label>
                                                                                <input 
                                                                                    className="form-input" 
                                                                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                                    placeholder="e.g. Manager, Owner" 
                                                                                    value={memberTemp.designation} 
                                                                                    onChange={e => handleMemberChange('designation', e.target.value)} 
                                                                                />
                                                                            </div>
                                                                            <div className="input-group">
                                                                                <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.organization}</label>
                                                                                <input 
                                                                                    className="form-input" 
                                                                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                                    placeholder="Company or Org Name" 
                                                                                    value={memberTemp.organization} 
                                                                                    onChange={e => handleMemberChange('organization', e.target.value)} 
                                                                                />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* SECTION: RESIDENCE & HEALTH */}
                                                            <div style={{ marginBottom: '40px' }}>
                                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                                                                    <span style={{ background: '#dcfce7', padding: '6px', borderRadius: '8px', fontSize: '1.2rem' }}>🏡</span>
                                                                    {t.form.healthResidence}
                                                                </h4>

                                                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
                                                                    <div className="input-group">
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.residenceType}</label>
                                                                        <select 
                                                                            className="form-input" 
                                                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                                                                            value={memberTemp.residence_type} 
                                                                            onChange={e => handleMemberChange('residence_type', e.target.value)}
                                                                        >
                                                                            <option value="With Family">{t.form.withFamily}</option>
                                                                            <option value="Separate">{t.form.separate}</option>
                                                                        </select>
                                                                    </div>

                                                                    <div className="input-group" style={{ gridColumn: isMobile ? 'auto' : '1 / -1', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                                        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                                                    checked={memberTemp.has_serious_illness} 
                                                                                    onChange={e => handleMemberChange('has_serious_illness', e.target.checked)} 
                                                                                />
                                                                                <span>{t.form.seriousIllness}</span>
                                                                            </label>
                                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                                                    checked={memberTemp.is_specially_abled} 
                                                                                    onChange={e => handleMemberChange('is_specially_abled', e.target.checked)} 
                                                                                />
                                                                                <span>{t.form.speciallyAbled}</span>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* SECTION: SKILLS & QUALIFICATIONS */}
                                                            <div style={{ marginBottom: '20px' }}>
                                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                                                                    <span style={{ background: '#fff7ed', padding: '6px', borderRadius: '8px', fontSize: '1.2rem' }}>🎨</span>
                                                                    {t.form.skillsQualifications}
                                                                </h4>

                                                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '25px' }}>
                                                                    <div className="input-group" style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                                                                        <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>{t.form.qualifications} (Detailed History)</label>
                                                                        <EducationHistoryManager
                                                                            history={memberTemp.education_history || []}
                                                                            onChange={val => handleMemberChange('education_history', val)}
                                                                            t={t.form}
                                                                            language={language}
                                                                        />
                                                                    </div>
                                                                    <EnhancedListManager
                                                                        items={memberTemp.skills || []}
                                                                        onAdd={val => handleMemberChange('skills', [...(memberTemp.skills || []), val])}
                                                                        onRemove={val => handleMemberChange('skills', (memberTemp.skills || []).filter(x => x !== val))}
                                                                        placeholder={t.form.addSkill}
                                                                        label={t.form.skills}
                                                                        options={formOptions?.skills || []}
                                                                        language={language}
                                                                    />
                                                                    <EnhancedListManager
                                                                        items={memberTemp.specialization_courses || []}
                                                                        onAdd={val => handleMemberChange('specialization_courses', [...(memberTemp.specialization_courses || []), val])}
                                                                        onRemove={val => handleMemberChange('specialization_courses', (memberTemp.specialization_courses || []).filter(x => x !== val))}
                                                                        placeholder={t.form.addSpecialization}
                                                                        label={t.form.specialization}
                                                                        options={formOptions?.specialization_courses || []}
                                                                        language={language}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                                            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                                            <p>Loading form options...</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Sticky Footer */}
                                                <div style={{ padding: '20px 40px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '15px', background: 'white' }}>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setUserState(prev => ({ ...prev, showAddMemberModal: false }))} 
                                                        style={{ padding: '14px 25px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                    >
                                                        {t.form.cancel}
                                                    </button>
                                                    <button 
                                                        type="submit" 
                                                        form="add-member-form"
                                                        className="cta-button" 
                                                        style={{ padding: '14px 40px', borderRadius: '14px', background: 'var(--primary-blue)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    >
                                                        {t.form.submit}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        }
                    </div>
                )}
                {
                    activeTab === 'help' && (
                        <div className="help-tab">
                            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '0 auto' }}>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Request Assistance</h3>
                                <form onSubmit={handleHelpSubmit}>
                                    <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '10px' }}>
                                            <span style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type of Help</span>
                                            <select
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                value={helpForm.request_type}
                                                onChange={(e) => setHelpForm({ ...helpForm, request_type: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Category...</option>
                                                <option value="Medical">Medical Emergency</option>
                                                <option value="Education">Education Support</option>
                                                <option value="Marriage">Marriage Assistance</option>
                                                <option value="Disaster">Natural Disaster</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </label>

                                        <label style={{ display: 'block', marginBottom: '10px' }}>
                                            <span style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount Required (₹)</span>
                                            <input
                                                type="number"
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                value={helpForm.amount_requested}
                                                onChange={(e) => setHelpForm({ ...helpForm, amount_requested: e.target.value })}
                                                required
                                            />
                                        </label>
                                    </div>

                                    <label style={{ display: 'block', marginBottom: '10px' }}>
                                        <span style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</span>
                                        <textarea
                                            style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                            value={helpForm.description}
                                            onChange={(e) => setHelpForm({ ...helpForm, description: e.target.value })}
                                            required
                                        ></textarea>
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '15px' }}>
                                        <span style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Attach Proof (Photo/Video/Audio/Docs)</span>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setSelectedFiles(e.target.files)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', background: '#f9f9f9' }}
                                        />
                                    </label>

                                    <button type="submit" style={{ width: '100%', padding: '12px', background: '#D87C1D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Submit Request</button>
                                </form>

                                {/* Request History */}
                                <div style={{ marginTop: '40px' }}>
                                    <h4>Your Request History</h4>
                                    {requests.length === 0 ? <p style={{ color: '#666' }}>No previous requests.</p> : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                            <thead>
                                                <tr style={{ background: '#f5f5f5', textAlign: 'left', fontSize: '0.9rem' }}>
                                                    <th style={{ padding: '8px' }}>Date</th>
                                                    <th style={{ padding: '8px' }}>Type</th>
                                                    <th style={{ padding: '8px' }}>Amount</th>
                                                    <th style={{ padding: '8px' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {requests.map(req => (
                                                    <tr key={req.id}>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{req.request_type}</td>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>₹{req.amount_requested}</td>
                                                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem',
                                                                background: req.status === 'Approved' ? '#e8f5e9' : (req.status === 'Rejected' ? '#ffebee' : '#fff3cd'),
                                                                color: req.status === 'Approved' ? '#2e7d32' : (req.status === 'Rejected' ? '#c62828' : '#f57f17')
                                                            }}>
                                                                {req.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'recommend' && (
                        <div className="recommend-tab">
                            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '900px', margin: '0 auto' }}>
                                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, color: 'var(--primary-blue)' }}>Invite New Family</h3>
                                    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>
                                        Recommend a known family to join the Samiti. You are responsible for verifying their identity.
                                    </p>
                                </div>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = new FormData(e.target);
                                    const data = Object.fromEntries(form.entries());
                                    try {
                                        const res = await api.recommendFamily(data);
                                        alert("Recommendation link generated successfully!");
                                        e.target.reset();
                                        fetchData(); // Refresh list
                                    } catch (err) {
                                        alert("Failed: " + (err.response?.data?.detail || err.message));
                                    }
                                }} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <input name="new_head_name" placeholder="Name of Family Head" required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        <input name="father_name" placeholder="Father's Name" required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        <input name="mobile" placeholder="Mobile Number" required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                        <input name="email" placeholder="Email (Optional)" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                    </div>
                                    <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        Generate Invitation Link
                                    </button>
                                </form>

                                <h4>Your Recommendations</h4>
                                {getMyRecs().length === 0 ? <p style={{ color: '#aaa', fontStyle: 'italic' }}>No recommendations yet.</p> : (
                                    <div style={{ display: 'grid', gap: '15px' }}>
                                        {getMyRecs().map(rec => (
                                            <div key={rec._id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{rec.new_head_name}</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Phone: {rec.mobile}</div>
                                                    <div style={{ marginTop: '8px' }}>
                                                        <span style={{ fontSize: '0.8rem', background: rec.status === 'Used' ? '#e8f5e9' : '#e3f2fd', color: rec.status === 'Used' ? '#2e7d32' : '#1565c0', padding: '2px 8px', borderRadius: '4px' }}>
                                                            {rec.status}
                                                        </span>
                                                        {rec.status === 'Issued' && (
                                                            <div style={{ marginTop: '5px', fontSize: '0.9rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '5px', borderRadius: '4px' }}>
                                                                Link: {window.location.origin}/register-family?token={rec.token}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    {/* Status specific actions could go here */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    error && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545', background: '#ffe6e6', borderRadius: '8px', margin: '20px 0' }}>
                            <p><strong>Connection Error:</strong> {error}</p>
                            <button onClick={fetchData} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Retry Connection
                            </button>
                        </div>
                    )
                }

                {loading && <p>Loading your family dashboard...</p>}
            </div >
        )}
        </DashboardLayout >
    );
};

export default FamilyDashboard;

