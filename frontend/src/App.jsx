import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TreasurerDashboard from './pages/committee/TreasurerDashboard';
import SecretaryDashboard from './pages/committee/SecretaryDashboard';
import FamilyDashboard from './pages/FamilyDashboard';
import MemberDashboard from './pages/MemberDashboard';
import RegisterFamily from './pages/RegisterFamily';
import Signup from './pages/Signup';
import RegisterSociety from './pages/RegisterSociety';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/:societyCode" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/register-family" element={<Signup />} />
            <Route path="/register-society" element={<RegisterSociety />} />

            {/* Protected Routes */}
            {/* Main Committee / Admin Portal */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'president', 'vice_president', 'secretary', 'treasurer', 'executive_member', 'coordinator', 'joint_secretary', 'auditor', 'pro', 'legal_advisor', 'medical_advisor']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/:tab" element={<AdminDashboard />} />
            </Route>

            {/* Specialized Views (can still exist or can point to AdminDashboard) */}
            <Route element={<ProtectedRoute allowedRoles={['treasurer']} />}>
              <Route path="/treasurer" element={<TreasurerDashboard />} />
              <Route path="/treasurer/:tab" element={<TreasurerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['secretary']} />}>
              <Route path="/secretary" element={<SecretaryDashboard />} />
              <Route path="/secretary/:tab" element={<SecretaryDashboard />} />
            </Route>

            {/* Family Head Dashboard */}
            <Route element={<ProtectedRoute allowedRoles={['family_head', 'admin', 'super_admin']} />}>
              <Route path="/family" element={<FamilyDashboard />} />
              <Route path="/family/:tab" element={<FamilyDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['member', 'family_member', 'admin', 'super_admin']} />}>
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/:tab" element={<MemberDashboard />} />
            </Route>
            {/* Fallback */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
