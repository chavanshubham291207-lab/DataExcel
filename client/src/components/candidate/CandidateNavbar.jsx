import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, UserCircle2, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const pathTitles = {
  '/candidate/dashboard': 'Dashboard',
  '/candidate/profile': 'My Profile',
  '/candidate/find-jobs': 'Find Jobs',
  '/candidate/ai-job-match': 'AI Job Match',
  '/candidate/applications': 'My Applications',
  '/candidate/saved-jobs': 'Saved Jobs',
  '/candidate/resume-analyzer': 'Resume Analyzer',
  '/candidate/resume-builder': 'AI Resume Builder',
  '/candidate/cover-letter': 'AI Cover Letter Generator',
  '/candidate/interview-center': 'Interview Center',
  '/candidate/mock-interview': 'AI Mock Interview',
  '/candidate/coding-practice': 'Coding Practice & Tests',
  '/candidate/career-insights': 'Career Insights',
  '/candidate/learning-center': 'Learning Center',
  '/candidate/notifications': 'Notifications',
  '/candidate/messages': 'Messages',
  '/candidate/documents': 'Document Vault',
  '/candidate/settings': 'Settings',
  '/c': 'Dashboard',
  '/c/profile': 'My Profile',
  '/c/jobs': 'Find Jobs',
  '/c/ai-match': 'AI Job Match',
  '/c/applications': 'My Applications',
  '/c/saved': 'Saved Jobs',
  '/c/resume': 'Resume Analyzer',
  '/c/resume-builder': 'AI Resume Builder',
  '/c/cover-letter': 'AI Cover Letter Generator',
  '/c/interviews': 'Interview Center',
  '/c/mock-interview': 'AI Mock Interview',
  '/c/coding': 'Coding Practice & Tests',
  '/c/insights': 'Career Insights',
  '/c/learning': 'Learning Center',
  '/c/notifications': 'Notifications',
  '/c/messages': 'Messages',
  '/c/documents': 'Document Vault',
  '/c/settings': 'Settings',
};

const CandidateNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const getCandidateUser = () => {
    try {
      const val = localStorage.getItem('candidateUser');
      if (!val || val === 'undefined' || val === 'null') return {};
      return JSON.parse(val);
    } catch {
      return {};
    }
  };
  const candidateUser = getCandidateUser();
  const title = pathTitles[location.pathname] || 'Candidate Portal';
  const initials = candidateUser && candidateUser.name
    ? candidateUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CX';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-3"
      style={{
        background: 'rgba(17,17,17,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1F1F1F',
        minHeight: '60px'
      }}
    >
      {/* Title breadcrumb */}
      <div>
        <div className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">Candidate Portal</div>
        <h2 className="text-white font-bold text-base leading-tight">{title}</h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications bell */}
        <button
          onClick={() => navigate('/candidate/notifications')}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-orange-400 transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2A2A2A' }}
        >
          <Bell size={16} />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2A2A2A' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'rgba(255,106,0,0.25)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-white text-xs font-semibold leading-none">{candidateUser.name || 'Candidate'}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">{candidateUser.jobRole || 'Job Seeker'}</div>
            </div>
            <ChevronDown size={13} className="text-gray-600" />
          </button>

          {showProfile && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50 shadow-2xl"
              style={{ background: '#161616', border: '1px solid #2A2A2A' }}
            >
              <div className="px-4 py-3 border-b border-[#2A2A2A]">
                <div className="text-white text-sm font-semibold">{candidateUser.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">{candidateUser.email}</div>
              </div>
              <button
                onClick={() => { navigate('/candidate/profile'); setShowProfile(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors cursor-pointer"
              >
                <UserCircle2 size={14} />My Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/5 text-sm transition-colors cursor-pointer"
              >
                <LogOut size={14} />Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CandidateNavbar;
