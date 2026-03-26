import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || '/api';


const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
    // Auth
    login: (credentials) => axios.post(`${API_URL}/auth/login`, credentials),
    register: (data) => axios.post(`${API_URL}/auth/register`, data),
    signup: (data) => axios.post(`${API_URL}/auth/signup`, data),
    changePassword: (data) => axios.post(`${API_URL}/auth/change-password`, data, { headers: getAuthHeaders() }),
    updateProfile: (data) => axios.post(`${API_URL}/auth/update-profile`, data, { headers: getAuthHeaders() }),
    updateProfilePhoto: (url) => axios.post(`${API_URL}/auth/update-photo`, { photo_url: url }, { headers: getAuthHeaders() }),
    verifyPassword: (password) => axios.post(`${API_URL}/auth/verify-password`, { password }, { headers: getAuthHeaders() }),
    lookupCommunity: (identifier) => axios.get(`${API_URL}/auth/community-lookup/${identifier}`),

    // Families (for Admin)
    getFamilies: () => axios.get(`${API_URL}/families`, { headers: getAuthHeaders() }),
    approveFamily: (id) => axios.post(`${API_URL}/families/${id}/approve`, {}, { headers: getAuthHeaders() }),
    getMyFamily: () => axios.get(`${API_URL}/families/me`, { headers: getAuthHeaders() }),
    completeProfile: (data) => axios.post(`${API_URL}/families/complete-profile`, data, { headers: getAuthHeaders() }),
    saveProgress: (data) => axios.post(`${API_URL}/families/save-progress`, data, { headers: getAuthHeaders() }),
    recommendFamily: (data) => axios.post(`${API_URL}/families/recommend`, data, { headers: getAuthHeaders() }),
    getMyRecommendations: () => axios.get(`${API_URL}/families/recommendations/my`, { headers: getAuthHeaders() }),
    verifyToken: (token) => axios.post(`${API_URL}/families/verify-token/${token}`),
    verifyFamilyStage: (id, data = {}) => axios.post(`${API_URL}/families/${id}/verify-stage`, data, { headers: getAuthHeaders() }),
    assignCoordinator: (familyId, coordinatorId, coordinatorName) => axios.post(`${API_URL}/families/${familyId}/assign-coordinator`, { coordinator_id: coordinatorId, coordinator_name: coordinatorName }, { headers: getAuthHeaders() }),
    addMemberRequest: (data) => axios.post(`${API_URL}/families/members/add`, data, { headers: getAuthHeaders() }),
    getMemberRequests: () => axios.get(`${API_URL}/families/members/requests`, { headers: getAuthHeaders() }),
    actionMemberRequest: (reqId, action) => axios.post(`${API_URL}/families/members/requests/${reqId}/action`, {}, { headers: getAuthHeaders(), params: { action } }),
    updateNominees: (data) => axios.put(`${API_URL}/families/me/nominees`, data, { headers: getAuthHeaders() }),
    createUpdateRequest: (data) => axios.post(`${API_URL}/families/requests/update`, data, { headers: getAuthHeaders() }),
    getMyUpdateRequests: () => axios.get(`${API_URL}/families/requests/my-updates`, { headers: getAuthHeaders() }),
    getAllUpdateRequests: () => axios.get(`${API_URL}/families/requests/updates/all`, { headers: getAuthHeaders() }),
    processUpdateRequest: (reqId, action, remark) => axios.post(`${API_URL}/families/requests/updates/${reqId}/process`, { action, remark }, { headers: getAuthHeaders() }),

    // Upload
    uploadFile: (formData) => axios.post(`${API_URL}/upload`, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } }),

    // Core Modules
    // Assistance
    createAssistanceRequest: (data) => axios.post(`${API_URL}/assistance`, data, { headers: getAuthHeaders() }),
    getAssistanceRequests: () => axios.get(`${API_URL}/assistance`, { headers: getAuthHeaders() }),
    updateAssistanceStatus: (id, status) => axios.put(`${API_URL}/assistance/${id}/status`, { status }, { headers: getAuthHeaders() }),

    // Contributions
    getContributions: () => axios.get(`${API_URL}/contributions`, { headers: getAuthHeaders() }),

    // Notices
    getNotices: (filterType = 'all') => axios.get(`${API_URL}/notices`, { headers: getAuthHeaders(), params: { filter_type: filterType } }),
    createNotice: (data) => axios.post(`${API_URL}/notices`, data, { headers: getAuthHeaders() }),
    updateNotice: (id, data) => axios.put(`${API_URL}/notices/${id}`, data, { headers: getAuthHeaders() }),
    deleteNotice: (id) => axios.delete(`${API_URL}/notices/${id}`, { headers: getAuthHeaders() }),

    // Rules
    getRules: () => axios.get(`${API_URL}/rules`),
    updateRules: (data) => axios.post(`${API_URL}/rules`, data, { headers: getAuthHeaders() }),

    // Finance
    getFinanceStats: () => axios.get(`${API_URL}/finance/stats`, { headers: getAuthHeaders() }),
    getFinanceContributions: (filters = {}) => axios.get(`${API_URL}/finance/contributions`, { headers: getAuthHeaders(), params: filters }),
    getAccountOverview: () => axios.get(`${API_URL}/finance/accounts/overview`, { headers: getAuthHeaders() }),
    getExpenses: () => axios.get(`${API_URL}/finance/expenses`, { headers: getAuthHeaders() }),
    createExpense: (data) => axios.post(`${API_URL}/finance/expenses`, data, { headers: getAuthHeaders() }),
    approveExpense: (id) => axios.post(`${API_URL}/finance/expenses/${id}/approve`, {}, { headers: getAuthHeaders() }),
    getMyFinanceStats: () => axios.get(`${API_URL}/finance/my-stats`, { headers: getAuthHeaders() }),
    getPublicBeneficiaries: () => axios.get(`${API_URL}/finance/beneficiaries`),
    getAuditLogs: () => axios.get(`${API_URL}/finance/audit-logs`, { headers: getAuthHeaders() }),
    submitInquiry: (data) => axios.post(`${API_URL}/inquiry`, data),
    getInquiries: () => axios.get(`${API_URL}/inquiries`, { headers: getAuthHeaders() }),

    // Role Management (President Only)
    getUsers: (communityId = null) => {
        const params = communityId && communityId !== 'all' ? { community_id: communityId } : {};
        return axios.get(`${API_URL}/management/users`, { headers: getAuthHeaders(), params });
    },
    updateUserRole: (id, role) => axios.put(`${API_URL}/management/users/${id}/role`, { new_role: role }, { headers: getAuthHeaders() }),
    updateUserPosition: (id, pos) => axios.put(`${API_URL}/management/users/${id}/position`, { new_position: pos }, { headers: getAuthHeaders() }),
    updateUserStatus: (id, is_active) => axios.put(`${API_URL}/management/users/${id}/status`, { is_active }, { headers: getAuthHeaders() }),
    getRoleLogs: () => axios.get(`${API_URL}/management/role-logs`, { headers: getAuthHeaders() }),
    getRecentActivity: () => axios.get(`${API_URL}/management/recent-activity`, { headers: getAuthHeaders() }),

    // Elections & Committee
    getActiveElections: () => axios.get(`${API_URL}/elections/active`, { headers: getAuthHeaders() }),
    createElection: (data) => axios.post(`${API_URL}/elections/create`, data, { headers: getAuthHeaders() }),
    nominateSelf: (postId, manifesto) => axios.post(`${API_URL}/elections/candidates/nominate/${postId}`, { manifesto }, { headers: getAuthHeaders() }),
    submitVote: (electionId, selections) => axios.post(`${API_URL}/elections/vote/${electionId}`, selections, { headers: getAuthHeaders() }),
    declareElectionResults: (electionId) => axios.post(`${API_URL}/elections/declare-results/${electionId}`, {}, { headers: getAuthHeaders() }),
    getCommitteeHistory: () => axios.get(`${API_URL}/elections/committee-history`, { headers: getAuthHeaders() }),

    // Governance & Ratings
    initiateStrike: (data) => axios.post(`${API_URL}/governance/strikes/initiate`, data, { headers: getAuthHeaders() }),
    supportStrike: (strikeId) => axios.post(`${API_URL}/governance/strikes/${strikeId}/support`, {}, { headers: getAuthHeaders() }),
    voteStrike: (strikeId, approve) => axios.post(`${API_URL}/governance/strikes/${strikeId}/vote`, approve, { headers: getAuthHeaders() }),
    getActiveStrikes: () => axios.get(`${API_URL}/governance/strikes/active`, { headers: getAuthHeaders() }),
    submitRating: (data) => axios.post(`${API_URL}/governance/ratings/submit`, data, { headers: getAuthHeaders() }),
    getLeaderPerformance: (userId) => axios.get(`${API_URL}/governance/ratings/leader/${userId}`, { headers: getAuthHeaders() }),
    getAllCommitteePerformance: () => axios.get(`${API_URL}/governance/committee/performance`, { headers: getAuthHeaders() }),

    // Fundraising Campaigns
    getApprovedAssistance: () => axios.get(`${API_URL}/finance/approved-assistance`, { headers: getAuthHeaders() }),
    createCampaign: (data) => axios.post(`${API_URL}/finance/campaigns`, data, { headers: getAuthHeaders() }),
    getCampaigns: () => axios.get(`${API_URL}/finance/campaigns`, { headers: getAuthHeaders() }),
    submitCampaignProof: (campaignId, data) => axios.post(`${API_URL}/finance/campaigns/${campaignId}/proof`, data, { headers: getAuthHeaders() }),
    getCampaignReceipts: (campaignId) => axios.get(`${API_URL}/finance/campaigns/${campaignId}/receipts`, { headers: getAuthHeaders() }),

    // Communities
    registerCommunity: (data) => axios.post(`${API_URL}/communities/register`, data),
    getCommunities: () => axios.get(`${API_URL}/communities`),
    searchCommunityByCode: (code) => axios.get(`${API_URL}/communities/search`, { params: { code } }),
    getCommunityByCode: (code) => axios.get(`${API_URL}/communities/code/${code}`)
};





