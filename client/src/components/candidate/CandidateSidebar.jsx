import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCircle2, Search, Sparkles, FileCheck2,
  Bookmark, FileText, Video, Bell, MessageCircle, TrendingUp,
  Settings, LogOut, ChevronLeft, ChevronRight, Zap,
  Wand2, FileSignature, Bot, Code2, GraduationCap, Folder, Mail, CalendarClock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard',         path: '/candidate/dashboard',         icon: LayoutDashboard, end: true },
  { name: 'MY AI AGENT',      path: '/candidate/ai-agent',          icon: Sparkles },
  { name: 'My Invitations',    path: '/candidate/invitations',       icon: Mail },
  { name: 'My Profile',        path: '/candidate/profile',           icon: UserCircle2 },
  { name: 'Find Jobs',         path: '/candidate/find-jobs',         icon: Search },
  { name: 'AI Job Match',      path: '/candidate/ai-job-match',      icon: Sparkles },
  { name: 'Resume Analyzer',   path: '/candidate/resume-analyzer',    icon: FileText },
  { name: 'AI Resume Builder', path: '/candidate/resume-builder',    icon: Wand2 },
  { name: 'AI Cover Letter',   path: '/candidate/cover-letter',      icon: FileSignature },
  { name: 'My Applications',   path: '/candidate/applications',      icon: FileCheck2 },
  { name: 'My Interviews',     path: '/candidate/my-interviews',     icon: CalendarClock },
  { name: 'Saved Jobs',        path: '/candidate/saved-jobs',        icon: Bookmark },
  { name: 'Interview Center',  path: '/candidate/interview-center',  icon: Video },
  { name: 'AI Mock Interview', path: '/candidate/mock-interview',   icon: Bot },
  { name: 'Coding Practice',   path: '/candidate/coding-practice',   icon: Code2 },
  { name: 'Career Insights',   path: '/candidate/career-insights',   icon: TrendingUp },
  { name: 'Learning Center',   path: '/candidate/learning-center',   icon: GraduationCap },
  { name: 'Notifications',     path: '/candidate/notifications',     icon: Bell },
  { name: 'Messages',          path: '/candidate/messages',          icon: MessageCircle },
  { name: 'Documents',         path: '/candidate/documents',          icon: Folder },
  { name: 'Settings',          path: '/candidate/settings',          icon: Settings },
];

const CandidateSidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
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
  const initials = candidateUser && candidateUser.name
    ? candidateUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CX';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="h-screen sticky top-0 flex flex-col transition-all duration-300 select-none z-30 flex-shrink-0"
      style={{
        width: collapsed ? '72px' : '240px',
        background: '#111111',
        borderRight: '1px solid #1F1F1F',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid #1F1F1F' }}>
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.4)' }}
        >
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-bold text-sm tracking-wide leading-none">APEX AI</div>
            <div className="text-orange-500 text-[10px] tracking-widest uppercase mt-0.5">Candidate Hub</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-600 hover:text-orange-400 transition-colors flex-shrink-0 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="truncate text-[13px]">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 space-y-2" style={{ borderTop: '1px solid #1F1F1F' }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'rgba(255,106,0,0.2)', border: '1px solid rgba(255,106,0,0.3)' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white text-xs font-semibold truncate leading-none">{candidateUser.name || 'Candidate'}</div>
              <div className="text-gray-600 text-[10px] truncate mt-0.5">{candidateUser.jobRole || 'Job Seeker'}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 cursor-pointer"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-[13px]">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default CandidateSidebar;
