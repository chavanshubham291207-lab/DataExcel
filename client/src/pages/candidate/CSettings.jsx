import React, { useState } from 'react';
import { Settings, Lock, Bell, Shield, User, Zap, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';

const CSettings = () => {
  const candidateUser = JSON.parse(localStorage.getItem('candidateUser') || '{}');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/candidate-auth/password', { oldPassword, newPassword });
      if (res.data?.success) {
        showToast('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-orange-500 text-white font-semibold shadow-2xl flex items-center gap-2">
          <Zap size={16} />
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="text-orange-500" size={20} /> Account Settings
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">Manage your credentials, security settings, and notifications</p>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <User size={16} className="text-orange-400" /> Account Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-gray-500 block uppercase font-semibold text-[10px]">Full Name</label>
            <div className="p-2.5 rounded-xl bg-[#1E1E1E] text-white font-medium mt-1">{candidateUser.name || 'Candidate'}</div>
          </div>
          <div>
            <label className="text-gray-500 block uppercase font-semibold text-[10px]">Email Address</label>
            <div className="p-2.5 rounded-xl bg-[#1E1E1E] text-white font-medium mt-1">{candidateUser.email}</div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <Lock size={16} className="text-orange-400" /> Security & Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="text-gray-500 block uppercase font-semibold text-[10px]">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:border-orange-500 focus:outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-gray-500 block uppercase font-semibold text-[10px]">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-xs focus:border-orange-500 focus:outline-none mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs cursor-pointer transition-all"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notifications Preferences */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <Bell size={16} className="text-orange-400" /> Notification Preferences
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#2A2A2A]">
            <div>
              <p className="text-white font-semibold">Email Alerts for Interview Invites</p>
              <p className="text-gray-500 text-[11px]">Receive direct emails when recruiters schedule interviews</p>
            </div>
            <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} className="accent-orange-500 cursor-pointer w-4 h-4" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-[#2A2A2A]">
            <div>
              <p className="text-white font-semibold">Weekly AI Job Match Digest</p>
              <p className="text-gray-500 text-[11px]">Get top matched positions every Monday</p>
            </div>
            <input type="checkbox" defaultChecked className="accent-orange-500 cursor-pointer w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSettings;
