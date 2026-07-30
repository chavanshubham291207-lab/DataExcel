import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Briefcase, ArrowRight, Zap, AlertCircle, UserCircle2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ──────────────────────────────────────────
// Client-side email validation (mirrors server)
// ──────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const FAKE_TEST_DOMAINS = new Set([
  'example.com', 'example.net', 'example.org', 'test.com', 'test.net', 'test.org',
  'testing.com', 'local.com', 'localhost.com', 'invalid.com', 'fake.com',
  'noemail.com', 'nomail.com', 'mailtest.com'
]);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'temp-mail.org',
  'tempmail.com', 'dispostable.com', 'maildrop.cc', '10minutemail.com', 'fakeinbox.com',
  'throwaway.email', 'mailnull.com', 'spaml.com', 'fakemail.net', 'discard.email',
  'tempinbox.com', 'jetable.fr.nf', 'jetable.net', 'sharklasers.com'
]);

const FAKE_LOCAL_PARTS = new Set([
  'test', 'demo', 'fake', 'example', 'placeholder', 'dummy', 'noreply', 'no-reply',
  'anonymous', 'nobody', 'void', 'null', 'undefined', 'sample', 'guest', 'temp',
  'temporary', 'throwaway', 'aaa', 'bbb', 'abc', 'xyz', 'asdf', 'qwerty', 'zxcv',
  '1234', '12345', 'user', 'username', 'email'
]);

const validateEmailClient = (email) => {
  if (!email || typeof email !== 'string') return 'Email address is required.';
  const clean = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(clean)) return 'Please enter a valid email format (e.g. name@company.com).';
  const [local, domain] = clean.split('@');
  if (FAKE_TEST_DOMAINS.has(domain)) return `"${domain}" is not accepted. Please use your real email address.`;
  if (DISPOSABLE_DOMAINS.has(domain)) return 'Disposable email addresses are not allowed.';
  if (FAKE_LOCAL_PARTS.has(local)) return `"${clean}" appears to be a placeholder. Please use your real email.`;
  if (local.length < 2) return 'Email address is too short.';
  return null; // null means valid
};

// ──────────────────────────────────────────
// Register Page Component
// ──────────────────────────────────────────
const Register = () => {
  const [role, setRole] = useState('recruiter');

  // Shared fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Recruiter-only
  const [companyName, setCompanyName] = useState('');

  // Candidate-only
  const [jobRole, setJobRole] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveAuthSession } = useAuth();

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val.length > 4) {
      const err = validateEmailClient(val);
      setEmailError(err || '');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side email check before network request
    const emailValidationError = validateEmailClient(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setLoading(true);
    try {
      let res;
      // `role` is the form state — it controls which API is called, so it IS the authoritative role.
      if (role === 'recruiter') {
        res = await api.post('/auth/register', { name, email, password, companyName });
      } else {
        res = await api.post('/candidate-auth/register', { name, email, password, jobRole, phone });
      }

      // Extract token and user payload from backend response
      const token = res.data.token;
      if (!token) throw new Error('Registration succeeded but no token was returned.');

      const userData = res.data.user || res.data.candidateUser || res.data.recruiter || { name, email };
      // Prefer backend role, fall back to the form role state (which is authoritative)
      const finalRole = res.data.role || userData?.role || role;

      // Use saveAuthSession from AuthContext — updates BOTH localStorage AND React state
      // This is critical: raw localStorage.setItem alone bypasses React state, causing
      // ProtectedRoute to see stale context values and redirect to the wrong dashboard.
      if (typeof saveAuthSession === 'function') {
        saveAuthSession(token, { ...userData, role: finalRole }, finalRole);
      } else {
        // Fallback (should never happen after AuthContext fix)
        localStorage.setItem('token', token);
        localStorage.setItem('role', finalRole === 'candidate' ? 'candidate' : 'recruiter');
        localStorage.setItem('user', JSON.stringify({ ...userData, role: finalRole }));
      }
      localStorage.removeItem('candidateUser');
      localStorage.removeItem('recruiter');

      // Navigate based on the actual final role
      if (finalRole === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else {
        navigate('/recruiter/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  const switchRole = (newRole) => {
    setRole(newRole);
    setError('');
    setEmailError('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: '#090909' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,106,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,106,0,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #FF6A00, transparent)' }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md z-10 rounded-2xl p-8 animate-slide-up"
        style={{
          background: 'rgba(22,22,22,0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #2A2A2A',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
        }}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #FF6A00, #FF8C00)',
              boxShadow: '0 0 32px rgba(255,106,0,0.5)',
            }}
          >
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1.5">AI-Powered Talent Intelligence Platform</p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1px solid #2A2A2A', background: '#111' }}>
          <button
            type="button"
            onClick={() => switchRole('recruiter')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: role === 'recruiter' ? 'rgba(255,106,0,0.15)' : 'transparent',
              color: role === 'recruiter' ? '#FF6A00' : '#555',
              borderRight: '1px solid #2A2A2A'
            }}
          >
            <Briefcase size={14} />
            Recruiter
          </button>
          <button
            type="button"
            onClick={() => switchRole('candidate')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: role === 'candidate' ? 'rgba(255,106,0,0.15)' : 'transparent',
              color: role === 'candidate' ? '#FF6A00' : '#555',
            }}
          >
            <UserCircle2 size={14} />
            Candidate
          </button>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm"
            style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}
          >
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={role === 'recruiter' ? 'Sarah Jenkins' : 'Akash Kumar'}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder={role === 'recruiter' ? 'sarah@company.com' : 'akash@gmail.com'}
                className={`input-field pl-10 ${emailError ? 'border-red-500/60' : ''}`}
              />
            </div>
            {emailError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={11} className="flex-shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          {/* Recruiter-only: Company Name */}
          {role === 'recruiter' && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Apex Systems Inc."
                  className="input-field pl-10"
                />
              </div>
            </div>
          )}

          {/* Candidate-only: Job Role */}
          {role === 'candidate' && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Desired Job Role <span className="text-gray-600">(optional)</span></label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={jobRole}
                  onChange={e => setJobRole(e.target.value)}
                  placeholder="Full Stack Developer"
                  className="input-field pl-10"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Role badge indicator */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{ background: 'rgba(255,106,0,0.06)', border: '1px solid rgba(255,106,0,0.15)' }}
          >
            <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0" />
            <span className="text-gray-400">
              Registering as: <strong className="text-orange-400 font-semibold capitalize">{role}</strong>
              {role === 'recruiter' ? ' — You will be redirected to the Recruiter Dashboard.' : ' — You will be redirected to the Candidate Dashboard.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !!emailError}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white mt-2 transition-all duration-200 cursor-pointer"
            style={{
              background: loading || emailError ? 'rgba(255,106,0,0.5)' : 'linear-gradient(135deg, #FF6A00, #FF8C00)',
              boxShadow: loading || emailError ? 'none' : '0 0 20px rgba(255,106,0,0.4)',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : (
              <>
                <span>Create {role === 'recruiter' ? 'Recruiter' : 'Candidate'} Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
