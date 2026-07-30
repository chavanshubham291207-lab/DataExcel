import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Sun, Moon, Trash2, CheckCheck, ChevronRight } from 'lucide-react';
import { useTheme } from './ThemeContext';
import api from '../utils/api';

const BREADCRUMB_MAP = {
  '/': ['Command Center', 'Dashboard'],
  '/jobs': ['Command Center', 'Job Postings'],
  '/candidates': ['Command Center', 'Candidate Pipeline'],
  '/resume-intel': ['Command Center', 'AI Resume Intelligence'],
  '/search': ['Command Center', 'AI Smart Search'],
  '/compare': ['Command Center', 'Candidate Match'],
  '/calendar': ['Command Center', 'Interview Calendar'],
  '/reports': ['Command Center', 'Reports & Export'],
  '/settings': ['Command Center', 'Settings'],
};

const Navbar = ({ title }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const crumbs = BREADCRUMB_MAP[location.pathname] || ['Command Center', title];

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount((res.data.data || []).filter(n => !n.read).length);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, []);

  const markAsRead = async (id) => {
    try { await api.patch(`/notifications/${id}/read`); fetchNotifications(); } catch {}
  };
  const markAllRead = async () => {
    try { await api.post('/notifications/read-all'); fetchNotifications(); } catch {}
  };
  const deleteNotification = async (id) => {
    try { await api.delete(`/notifications/${id}`); fetchNotifications(); } catch {}
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-40 flex-shrink-0"
      style={{
        background: 'rgba(9,9,9,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1F1F1F',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 font-medium">{crumbs[0]}</span>
        <ChevronRight size={13} className="text-gray-700" />
        <span className="text-white font-semibold">{crumbs[1]}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-orange-400 hover:bg-white/5 transition-all duration-150 cursor-pointer"
          title="Toggle theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-orange-400 hover:bg-white/5 transition-all duration-150 relative cursor-pointer"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: '#FF3B30', transform: 'translate(50%, -50%)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div
                className="absolute right-0 mt-2 w-80 rounded-2xl shadow-modal z-50 overflow-hidden animate-slide-up"
                style={{ background: '#161616', border: '1px solid #2A2A2A' }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium cursor-pointer transition-colors"
                    >
                      <CheckCheck size={12} />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-600">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className="flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-white/3 transition-colors"
                        style={{ background: !n.read ? 'rgba(255,106,0,0.03)' : 'transparent' }}
                      >
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                        )}
                        {n.read && <div className="w-1.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-white leading-tight">{n.title}</span>
                            <span className="text-[10px] text-gray-600 flex-shrink-0">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">{n.message}</p>
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n._id)}
                              className="text-[10px] text-orange-500 hover:text-orange-400 mt-1 font-medium cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => deleteNotification(n._id)}
                          className="text-gray-700 hover:text-danger transition-colors p-0.5 cursor-pointer flex-shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-border/50">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white cursor-default"
            style={{ background: 'rgba(255,106,0,0.2)', border: '1px solid rgba(255,106,0,0.3)' }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-white leading-none">{recruiter.name || 'Recruiter'}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{recruiter.companyName || 'Apex AI'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
