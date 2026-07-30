import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Zap, AlertCircle, Eye, EyeOff, UserCircle2, Briefcase, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Client-side email validation (mirrors server emailValidator.js)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const FAKE_TEST_DOMAINS = new Set(['example.com','example.net','example.org','test.com','test.net','test.org','testing.com','local.com','localhost.com','invalid.com','fake.com']);
const DISPOSABLE_DOMAINS = new Set(['mailinator.com','guerrillamail.com','trashmail.com','yopmail.com','temp-mail.org','tempmail.com','maildrop.cc','10minutemail.com','fakeinbox.com','throwaway.email','discard.email']);
const FAKE_LOCAL_PARTS = new Set(['test','demo','fake','example','placeholder','dummy','noreply','no-reply','anonymous','nobody','void','null','undefined','sample','guest','temp','temporary','throwaway','aaa','bbb','abc','xyz','asdf','qwerty','zxcv','user','username','email']);

const validateEmailClient = (email) => {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(clean)) return 'Enter a valid email (e.g. name@company.com).';
  const [local, domain] = clean.split('@');
  if (FAKE_TEST_DOMAINS.has(domain)) return `"${domain}" is not accepted. Use your real email.`;
  if (DISPOSABLE_DOMAINS.has(domain)) return 'Disposable email addresses are not allowed.';
  if (FAKE_LOCAL_PARTS.has(local)) return `"${clean}" appears to be a placeholder. Use your real email.`;
  return null;
};

const Login = () => {
  const [role, setRole] = useState('recruiter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, role: contextRole, login } = useAuth();

  useEffect(() => {
    if (token && token !== 'undefined' && token !== 'null') {
      const activeRole = (contextRole || localStorage.getItem('role') || '').toLowerCase();
      if (activeRole === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else {
        navigate('/recruiter/dashboard', { replace: true });
      }
    }
  }, [token, contextRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    // Note: demo emails (recruiter@example.com, candidate@example.com) are
    // intentionally bypassed here — they exist in MongoDB and use the server
    // /auth/login route which accepts them via matchPassword lookup.
    setLoading(true);
    try {
      const result = await login(role, email, password);
      const targetRole = (result.role || role).toLowerCase();

      if (targetRole === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else {
        navigate('/recruiter/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[Login] Authentication Error:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || '';

      // Map common server responses to user-friendly messages
      if (serverMsg.toLowerCase().includes('not found') || serverMsg.toLowerCase().includes('account not found')) {
        setError('Account not found. Please check your email or sign up.');
      } else if (serverMsg.toLowerCase().includes('password') || serverMsg.toLowerCase().includes('incorrect')) {
        setError('Incorrect password. Please try again.');
      } else if (serverMsg.toLowerCase().includes('disposable') || serverMsg.toLowerCase().includes('placeholder')) {
        setEmailError(serverMsg);
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        setError('Login failed. Please verify your email, role selection, and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val.length > 6) {
      const err = validateEmailClient(val);
      setEmailError(err || '');
    } else {
      setEmailError('');
    }
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
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #FF6A00, transparent)' }} />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #FF6A00, transparent)' }} />

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
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 32px rgba(255,106,0,0.5)' }}
          >
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1.5">AI Talent Intelligence Platform</p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1px solid #2A2A2A', background: '#111' }}>
          <button
            type="button"
            onClick={() => { setRole('recruiter'); setError(''); }}
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
            onClick={() => { setRole('candidate'); setError(''); }}
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

        {error && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}
          >
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input type="email" required value={email} onChange={handleEmailChange} placeholder={role === 'candidate' ? 'yourname@gmail.com' : 'recruiter@company.com'} className={`input-field pl-10 ${emailError ? 'border-red-500/50' : ''}`} />
            </div>
            {emailError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle size={11} className="flex-shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-orange-500 hover:text-orange-400 transition-colors">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" className="input-field pl-10 pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 cursor-pointer"
            style={{
              background: loading ? 'rgba(255,106,0,0.5)' : 'linear-gradient(135deg, #FF6A00, #FF8C00)',
              boxShadow: loading ? 'none' : '0 0 20px rgba(255,106,0,0.4)',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Access Platform</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-gray-600">
          No account?{' '}
          <Link to="/register" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">Create one</Link>
        </p>

        {/* Demo Credentials */}
        <div className="mt-4 px-4 py-3 rounded-xl text-[11px] leading-relaxed space-y-1.5" style={{ background: 'rgba(255,106,0,0.05)', border: '1px solid rgba(255,106,0,0.15)' }}>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Click to auto-fill credentials:</div>
          <button
            type="button"
            onClick={() => { setRole('recruiter'); setEmail('recruiter@example.com'); setPassword('password123'); setError(''); }}
            className="w-full text-left p-1.5 rounded-lg hover:bg-orange-500/10 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-orange-500 font-semibold">Recruiter: </span>
              <span className="text-gray-400">recruiter@example.com / password123</span>
            </div>
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-mono">Fill</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('candidate'); setEmail('candidate@example.com'); setPassword('password123'); setError(''); }}
            className="w-full text-left p-1.5 rounded-lg hover:bg-orange-500/10 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-orange-500 font-semibold">Candidate: </span>
              <span className="text-gray-400">candidate@example.com / password123</span>
            </div>
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-mono">Fill</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
