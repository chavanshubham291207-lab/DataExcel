import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, normalizeRole } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

// Recruiter Layout & Pages
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import FloatingCopilot from './components/FloatingCopilot';
import Dashboard from './pages/Dashboard';
import JobManagement from './pages/JobManagement';
import CandidateManagement from './pages/CandidateManagement';
import ResumeIntelligence from './pages/ResumeIntelligence';
import SmartSearch from './pages/SmartSearch';
import CandidateComparison from './pages/CandidateComparison';
import InterviewManagement from './pages/InterviewManagement';
import InterviewSchedule from './pages/InterviewSchedule';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SentInvitations from './pages/SentInvitations';
import ATSApplications from './pages/ATSApplications';

// Candidate Layout & Pages
import CandidateLayout from './components/candidate/CandidateLayout';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateInvitations from './pages/candidate/CandidateInvitations';
import CandidateProfile from './pages/candidate/CandidateProfile';
import CandidateFindJobs from './pages/candidate/CandidateFindJobs';
import CandidateAIJobMatch from './pages/candidate/CandidateAIJobMatch';
import CandidateApplications from './pages/candidate/CandidateApplications';
import CandidateSavedJobs from './pages/candidate/CandidateSavedJobs';
import CandidateResumeAnalyzer from './pages/candidate/CandidateResumeAnalyzer';
import CandidateResumeBuilder from './pages/candidate/CandidateResumeBuilder';
import CandidateCoverLetter from './pages/candidate/CandidateCoverLetter';
import CandidateInterviewCenter from './pages/candidate/CandidateInterviewCenter';
import CandidateMyInterviews from './pages/candidate/CandidateMyInterviews';
import CandidateMockInterview from './pages/candidate/CandidateMockInterview';
import CandidateCodingPractice from './pages/candidate/CandidateCodingPractice';
import CandidateNotifications from './pages/candidate/CandidateNotifications';
import CandidateMessages from './pages/candidate/CandidateMessages';
import CandidateCareerInsights from './pages/candidate/CandidateCareerInsights';
import CandidateLearningCenter from './pages/candidate/CandidateLearningCenter';
import CandidateDocuments from './pages/candidate/CandidateDocuments';
import CandidateSettings from './pages/candidate/CandidateSettings';

import VoiceGenie from './pages/VoiceGenie';
import { ProtectedCandidateRoute, ProtectedRecruiterRoute } from './components/ProtectedRoute';

const getRecruiterPageTitle = (pathname) => {
  switch (pathname) {
    case '/':
    case '/recruiter/dashboard': return 'Dashboard';
    case '/jobs':
    case '/recruiter/jobs': return 'Job Postings';
    case '/candidates':
    case '/recruiter/candidates': return 'Candidate Pipeline';
    case '/resume-intel':
    case '/recruiter/resume-intel': return 'AI Resume Intelligence';
    case '/search':
    case '/recruiter/search': return 'AI Smart Search';
    case '/compare':
    case '/recruiter/compare': return 'Candidate Match';
    case '/calendar':
    case '/recruiter/calendar': return 'Interview Calendar';
    case '/recruiter/interview-schedule': return 'Interview Scheduler';
    case '/recruiter/applications': return 'ATS Applications';
    case '/reports':
    case '/recruiter/reports': return 'Reports & Export';
    case '/settings':
    case '/recruiter/settings': return 'Settings';
    default: return 'Talent Intelligence';
  }
};

// Root index redirector based on user role
const RootRedirect = () => {
  const { token, role: contextRole } = useAuth();
  const effectiveToken = token || localStorage.getItem('token');
  const role = contextRole || normalizeRole(localStorage.getItem('role'));
  const isValidToken = effectiveToken && effectiveToken !== 'undefined' && effectiveToken !== 'null' && typeof effectiveToken === 'string' && effectiveToken.length > 5;

  if (!isValidToken) return <Navigate to="/login" replace />;
  if (role === 'candidate') return <Navigate to="/candidate/dashboard" replace />;
  if (role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

// Recruiter Layout Container
const RecruiterLayoutContainer = ({ children }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeJobId = params.get('jobId') || '';

  return (
    <ProtectedRecruiterRoute>
      <div className="flex min-h-screen" style={{ background: '#090909' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar title={getRecruiterPageTitle(location.pathname)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <FloatingCopilot jobId={activeJobId} />
      </div>
    </ProtectedRecruiterRoute>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Candidate Routes */}
      <Route path="/candidate/dashboard" element={<CandidateLayout><CandidateDashboard /></CandidateLayout>} />
      <Route path="/candidate/profile" element={<CandidateLayout><CandidateProfile /></CandidateLayout>} />
      <Route path="/candidate/find-jobs" element={<CandidateLayout><CandidateFindJobs /></CandidateLayout>} />
      <Route path="/candidate/ai-job-match" element={<CandidateLayout><CandidateAIJobMatch /></CandidateLayout>} />
      <Route path="/candidate/applications" element={<CandidateLayout><CandidateApplications /></CandidateLayout>} />
      <Route path="/candidate/saved-jobs" element={<CandidateLayout><CandidateSavedJobs /></CandidateLayout>} />
      <Route path="/candidate/resume-analyzer" element={<CandidateLayout><CandidateResumeAnalyzer /></CandidateLayout>} />
      <Route path="/candidate/resume-builder" element={<CandidateLayout><CandidateResumeBuilder /></CandidateLayout>} />
      <Route path="/candidate/cover-letter" element={<CandidateLayout><CandidateCoverLetter /></CandidateLayout>} />
      <Route path="/candidate/interview-center" element={<CandidateLayout><CandidateInterviewCenter /></CandidateLayout>} />
      <Route path="/candidate/my-interviews" element={<CandidateLayout><CandidateMyInterviews /></CandidateLayout>} />
      <Route path="/candidate/mock-interview" element={<CandidateLayout><CandidateMockInterview /></CandidateLayout>} />
      <Route path="/candidate/coding-practice" element={<CandidateLayout><CandidateCodingPractice /></CandidateLayout>} />
      <Route path="/candidate/notifications" element={<CandidateLayout><CandidateNotifications /></CandidateLayout>} />
      <Route path="/candidate/messages" element={<CandidateLayout><CandidateMessages /></CandidateLayout>} />
      <Route path="/candidate/career-insights" element={<CandidateLayout><CandidateCareerInsights /></CandidateLayout>} />
      <Route path="/candidate/learning-center" element={<CandidateLayout><CandidateLearningCenter /></CandidateLayout>} />
      <Route path="/candidate/documents" element={<CandidateLayout><CandidateDocuments /></CandidateLayout>} />
      <Route path="/candidate/settings" element={<CandidateLayout><CandidateSettings /></CandidateLayout>} />
      <Route path="/candidate/invitations" element={<CandidateLayout><CandidateInvitations /></CandidateLayout>} />

      {/* VoiceGenie Full-Screen AI Agent Routes */}
      <Route path="/candidate/ai-agent" element={<ProtectedCandidateRoute><VoiceGenie /></ProtectedCandidateRoute>} />
      <Route path="/c/ai-agent" element={<ProtectedCandidateRoute><VoiceGenie /></ProtectedCandidateRoute>} />

      {/* Candidate /c/ aliases */}
      <Route path="/c" element={<Navigate to="/candidate/dashboard" replace />} />
      <Route path="/c/invitations" element={<CandidateLayout><CandidateInvitations /></CandidateLayout>} />
      <Route path="/c/profile" element={<CandidateLayout><CandidateProfile /></CandidateLayout>} />
      <Route path="/c/jobs" element={<CandidateLayout><CandidateFindJobs /></CandidateLayout>} />
      <Route path="/c/ai-match" element={<CandidateLayout><CandidateAIJobMatch /></CandidateLayout>} />
      <Route path="/c/applications" element={<CandidateLayout><CandidateApplications /></CandidateLayout>} />
      <Route path="/c/saved" element={<CandidateLayout><CandidateSavedJobs /></CandidateLayout>} />
      <Route path="/c/resume" element={<CandidateLayout><CandidateResumeAnalyzer /></CandidateLayout>} />
      <Route path="/c/resume-builder" element={<CandidateLayout><CandidateResumeBuilder /></CandidateLayout>} />
      <Route path="/c/cover-letter" element={<CandidateLayout><CandidateCoverLetter /></CandidateLayout>} />
      <Route path="/c/interviews" element={<CandidateLayout><CandidateInterviewCenter /></CandidateLayout>} />
      <Route path="/c/mock-interview" element={<CandidateLayout><CandidateMockInterview /></CandidateLayout>} />
      <Route path="/c/coding" element={<CandidateLayout><CandidateCodingPractice /></CandidateLayout>} />
      <Route path="/c/notifications" element={<CandidateLayout><CandidateNotifications /></CandidateLayout>} />
      <Route path="/c/messages" element={<CandidateLayout><CandidateMessages /></CandidateLayout>} />
      <Route path="/c/insights" element={<CandidateLayout><CandidateCareerInsights /></CandidateLayout>} />
      <Route path="/c/learning" element={<CandidateLayout><CandidateLearningCenter /></CandidateLayout>} />
      <Route path="/c/documents" element={<CandidateLayout><CandidateDocuments /></CandidateLayout>} />
      <Route path="/c/settings" element={<CandidateLayout><CandidateSettings /></CandidateLayout>} />

      {/* Recruiter Routes */}
      <Route path="/recruiter/dashboard" element={<RecruiterLayoutContainer><Dashboard /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/jobs" element={<RecruiterLayoutContainer><JobManagement /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/candidates" element={<RecruiterLayoutContainer><CandidateManagement /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/sent-invitations" element={<RecruiterLayoutContainer><SentInvitations /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/resume-intel" element={<RecruiterLayoutContainer><ResumeIntelligence /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/search" element={<RecruiterLayoutContainer><SmartSearch /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/compare" element={<RecruiterLayoutContainer><CandidateComparison /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/calendar" element={<RecruiterLayoutContainer><InterviewManagement /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/interview-schedule" element={<RecruiterLayoutContainer><InterviewSchedule /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/applications" element={<RecruiterLayoutContainer><ATSApplications /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/reports" element={<RecruiterLayoutContainer><Reports /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/settings" element={<RecruiterLayoutContainer><Settings /></RecruiterLayoutContainer>} />
      <Route path="/recruiter/ai-agent" element={<ProtectedRecruiterRoute><VoiceGenie /></ProtectedRecruiterRoute>} />

      {/* Legacy recruiter aliases */}
      <Route path="/sent-invitations" element={<RecruiterLayoutContainer><SentInvitations /></RecruiterLayoutContainer>} />
      <Route path="/ai-agent" element={<ProtectedRecruiterRoute><VoiceGenie /></ProtectedRecruiterRoute>} />
      <Route path="/jobs" element={<RecruiterLayoutContainer><JobManagement /></RecruiterLayoutContainer>} />
      <Route path="/candidates" element={<RecruiterLayoutContainer><CandidateManagement /></RecruiterLayoutContainer>} />
      <Route path="/resume-intel" element={<RecruiterLayoutContainer><ResumeIntelligence /></RecruiterLayoutContainer>} />
      <Route path="/search" element={<RecruiterLayoutContainer><SmartSearch /></RecruiterLayoutContainer>} />
      <Route path="/compare" element={<RecruiterLayoutContainer><CandidateComparison /></RecruiterLayoutContainer>} />
      <Route path="/calendar" element={<RecruiterLayoutContainer><InterviewManagement /></RecruiterLayoutContainer>} />
      <Route path="/reports" element={<RecruiterLayoutContainer><Reports /></RecruiterLayoutContainer>} />

      {/* Catch-all */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default App;
