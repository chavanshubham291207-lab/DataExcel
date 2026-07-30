import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Brain, Search,
  GitCompare, CalendarDays, FileBarChart2, Settings,
  LogOut, ChevronLeft, ChevronRight, Zap, Sparkles, Send, CalendarClock, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard',           path: '/recruiter/dashboard',          icon: LayoutDashboard },
  { name: 'MY AI AGENT',         path: '/recruiter/ai-agent',           icon: Sparkles },
  { name: 'Job Postings',        path: '/jobs',                         icon: Briefcase },
  { name: 'Candidates',          path: '/candidates',                   icon: Users },
  { name: 'Sent Invitations',    path: '/recruiter/sent-invitations',   icon: Send },
  { name: 'Applications',        path: '/recruiter/applications',       icon: ClipboardList },
  { name: 'AI Resume Intel',     path: '/resume-intel',                 icon: Brain },
  { name: 'AI Smart Search',     path: '/search',                       icon: Search },
  { name: 'Candidate Match',     path: '/compare',                      icon: GitCompare },
  { name: 'Interview Cal.',      path: '/calendar',                     icon: CalendarDays },
  { name: 'Interview Schedule',  path: '/recruiter/interview-schedule', icon: CalendarClock },
  { name: 'Reports',             path: '/reports',                      icon: FileBarChart2 },
  { name: 'Settings',            path: '/settings',                     icon: Settings },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const getRecruiter = () => {
    try {
      const val = localStorage.getItem('recruiter');
      if (!val || val === 'undefined' || val === 'null') return {};
      return JSON.parse(val);
    } catch {
      return {};
    }
  };
  const recruiter = getRecruiter();
  const initials = recruiter && recruiter.name
    ? recruiter.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RX';

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
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, #FF6A00, #FF8C00)',
            boxShadow: '0 0 16px rgba(255,106,0,0.4)',
          }}
        >
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-bold text-sm tracking-wide leading-none">APEX AI</div>
            <div className="text-gray-600 text-[10px] tracking-widest uppercase mt-0.5">Talent Intel</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-600 hover:text-orange-400 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-link-active' : 'nav-link'
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && (
                <span className="truncate text-[13px]">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border/50 space-y-2">
        {/* Profile */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'rgba(255,106,0,0.2)', border: '1px solid rgba(255,106,0,0.3)' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white text-xs font-semibold truncate leading-none">
                {recruiter.name || 'Recruiter'}
              </div>
              <div className="text-gray-600 text-[10px] truncate mt-0.5">
                {recruiter.companyName || 'Apex Systems'}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-danger hover:bg-danger/5 transition-all duration-150 cursor-pointer"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-[13px]">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
