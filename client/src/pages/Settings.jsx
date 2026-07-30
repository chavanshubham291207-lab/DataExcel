import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Bell, Shield, Trash2, Save, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const inputCls = "w-full bg-[#1E1E1E] border border-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00] transition-colors";
const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: '', email: '', companyName: '', companyWebsite: '',
    notificationSettings: { newApplications: true, interviewReminders: true, jobExpiration: true, offerStatus: true }
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try { setLoading(true); const res = await api.get('/auth/me'); setProfile(res.data.data); }
      catch (err) { console.error('Failed to load settings:', err.message); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setSaveSuccess(false); setError('');
    try {
      const res = await api.put('/auth/profile', profile);
      setProfile(res.data.data);
      localStorage.setItem('recruiter', JSON.stringify({ id: res.data.data._id, name: res.data.data.name, email: res.data.data.email, companyName: res.data.data.companyName, companyWebsite: res.data.data.companyWebsite, notificationSettings: res.data.data.notificationSettings }));
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save settings.'); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault(); setPassSuccess(false); setError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) { setError('New passwords do not match.'); return; }
    try {
      await api.put('/auth/change-password', { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPassSuccess(true); setTimeout(() => setPassSuccess(false), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Password update failed.'); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Delete your recruiter account permanently? This is irreversible.')) return;
    try { await api.delete('/auth/delete-account'); localStorage.removeItem('token'); localStorage.removeItem('recruiter'); navigate('/login'); }
    catch (err) { alert(err.message); }
  };

  const toggleNotif = (field) => setProfile({ ...profile, notificationSettings: { ...profile.notificationSettings, [field]: !profile.notificationSettings[field] } });

  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <div className="h-8 w-48 animate-pulse rounded-xl" style={{ background: '#1E1E1E' }} />
        <div className="h-64 animate-pulse rounded-2xl" style={{ background: '#1E1E1E' }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Profile & Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure recruiter identity, notification alerts, and security keys.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}>
          <AlertCircle size={14} className="flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Profile + Password */}
        <div className="md:col-span-2 space-y-5">
          {/* Profile Card */}
          <div className="rounded-2xl p-6 space-y-5" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center gap-2">
              <User size={15} className="text-[#FF6A00]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recruiter Identity</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input type="text" required value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input type="email" disabled value={profile.email} className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Company Name</label>
                  <input type="text" value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Company Website</label>
                  <input type="text" value={profile.companyWebsite} onChange={e => setProfile({ ...profile, companyWebsite: e.target.value })} placeholder="https://company.com" className={inputCls} />
                </div>
              </div>

              {/* Notification toggles */}
              <div className="pt-3 border-t border-[#1F1F1F] space-y-3">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-[#007AFF]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alert Subscriptions</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ['newApplications', 'New application resumes parsed'],
                    ['interviewReminders', 'Interview panel schedule notices'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => toggleNotif(key)}
                        className="w-9 h-5 rounded-full relative cursor-pointer transition-all duration-200 flex-shrink-0"
                        style={{ background: profile.notificationSettings[key] ? '#FF6A00' : '#2A2A2A' }}>
                        <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all duration-200"
                          style={{ left: profile.notificationSettings[key] ? '18px' : '2px' }} />
                      </div>
                      <span className="text-xs text-gray-400">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1F1F1F]">
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: saveSuccess ? '#00C853' : 'transparent' }}>
                  <CheckCircle2 size={14} /> Profile saved successfully!
                </div>
                <button type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all"
                  style={{ background: '#FF6A00', boxShadow: '0 0 12px rgba(255,106,0,0.3)' }}>
                  <Save size={14} /> Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Password Card */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-[#FFC107]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Security Keys</h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Current Password</label>
                <input type="password" required value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" required value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input type="password" required value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#1F1F1F]">
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: passSuccess ? '#00C853' : 'transparent' }}>
                  <CheckCircle2 size={14} /> Password updated!
                </div>
                <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-colors"
                  style={{ background: '#FFC107' }}>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,59,48,0.04)', border: '1px solid rgba(255,59,48,0.15)' }}>
          <div className="flex items-center gap-2">
            <Trash2 size={15} className="text-[#FF3B30]" />
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FF3B30' }}>Danger Zone</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Deleting your account will permanently purge all candidate profiles, job listings, notes, and interviews from the database.
          </p>
          <div className="p-3 rounded-xl text-[11px] text-gray-600 leading-relaxed" style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.1)' }}>
            This action is <strong className="text-[#FF3B30]">irreversible</strong>. Make sure to export your data before proceeding.
          </div>
          <button onClick={handleDeleteAccount}
            className="w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.25)' }}>
            Delete Recruiter Account
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
