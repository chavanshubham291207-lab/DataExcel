import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, Calendar, CheckCircle2, FileText, Plus,
  Search, TrendingUp, Activity, ArrowUpRight, Zap, Target, Clock, XCircle,
  ExternalLink, Mail, Phone, Star, Award
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../utils/api';

const CHART_COLORS = ['#FF6A00', '#FF8C00', '#FFA040', '#FFB870', '#00C853', '#007AFF', '#FFC107', '#FF3B30'];

// Animated counter
const CountUp = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white font-semibold">{p.value}</span>
          <span className="text-gray-500">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

const Skeleton = ({ className }) => (
  <div className={`skeleton ${className}`} />
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const recruiter = JSON.parse(localStorage.getItem('recruiter') || '{}');

  // Application & ATS tab states
  const [dashboardTab, setDashboardTab] = useState('analytics'); // 'analytics' | 'applications'
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsPage, setAppsPage] = useState(1);
  const [appsTotalPages, setAppsTotalPages] = useState(1);
  const [appsSearch, setAppsSearch] = useState('');
  const [appsStatus, setAppsStatus] = useState('');

  // Modal & Interview Scheduling states
  const [selectedApp, setSelectedApp] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interviewDate: '',
    startTime: '',
    endTime: '',
    mode: 'Video Call',
    meetingLink: '',
    notes: '',
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  const fetchApplications = async () => {
    try {
      setAppsLoading(true);
      const res = await api.get('/applications', {
        params: {
          search: appsSearch,
          status: appsStatus,
          page: appsPage,
          limit: 6
        }
      });
      setApplications(res.data.data || []);
      setAppsTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    if (dashboardTab === 'applications') {
      fetchApplications();
    }
  }, [dashboardTab, appsPage, appsSearch, appsStatus]);

  const load = async () => {
    try {
      setLoading(true);
      const [analyticsRes, jobsRes, candidatesRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/jobs'),
        api.get('/candidates'),
      ]);

      const rawAnalytics = analyticsRes.data;
      const analyticsData = (rawAnalytics && rawAnalytics.stats) ? rawAnalytics : (rawAnalytics?.data || rawAnalytics);
      setData(analyticsData);

      const rawJobs = jobsRes.data;
      const jobsList = Array.isArray(rawJobs) ? rawJobs : (Array.isArray(rawJobs?.data) ? rawJobs.data : []);
      setJobs(jobsList.slice(0, 4));

      const rawCandidates = candidatesRes.data;
      const candidatesList = Array.isArray(rawCandidates) ? rawCandidates : (Array.isArray(rawCandidates?.data) ? rawCandidates.data : []);
      setCandidates(candidatesList.slice(0, 5));
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError('Failed to fetch data. Ensure backend services are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSuccess('');

    if (!interviewForm.interviewDate || !interviewForm.startTime || !interviewForm.endTime) {
      setScheduleError('Please fill in Date, Start Time, and End Time.');
      return;
    }
    if (interviewForm.startTime >= interviewForm.endTime) {
      setScheduleError('End Time must be after Start Time.');
      return;
    }

    try {
      setScheduleLoading(true);
      await api.post('/interview-schedule/schedule', {
        applicationId: selectedApp._id,
        interviewDate: interviewForm.interviewDate,
        startTime: interviewForm.startTime,
        endTime: interviewForm.endTime,
        mode: interviewForm.mode,
        meetingLink: interviewForm.meetingLink,
        notes: interviewForm.notes
      });

      setScheduleSuccess('Interview scheduled successfully! Candidate notified.');
      fetchApplications();
      load();
      setSelectedApp(prev => ({ ...prev, status: 'Interview Scheduled' }));
      setInterviewForm({
        interviewDate: '',
        startTime: '',
        endTime: '',
        mode: 'Video Call',
        meetingLink: '',
        notes: ''
      });
      setTimeout(() => {
        setShowScheduleForm(false);
        setScheduleSuccess('');
      }, 2000);
    } catch (err) {
      setScheduleError(err.response?.data?.error || 'Failed to schedule interview.');
    } finally {
      setScheduleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)' }}>
            <Activity size={28} className="text-danger" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Backend Unreachable</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mx-auto"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalJobs: data?.totalJobs || 50,
    activeJobs: data?.activeJobs || 35,
    totalApplicants: data?.totalApplications || data?.totalApplicants || 200,
    shortlistedCandidates: data?.shortlistedCandidates || 90,
    interviewScheduled: data?.activeInterviews || data?.interviewScheduled || 15,
    offersSent: data?.offersSent || 5,
    hiredCandidates: data?.hiredCandidates || 23,
    rejectedCandidates: data?.rejectedCandidates || 12,
  };

  const charts = data?.charts || {
    appTrend: data?.weeklyApplications
      ? data.weeklyApplications.map(w => ({ name: w.week, Applications: w.count }))
      : [
          { name: 'Mon', Applications: 12 },
          { name: 'Tue', Applications: 19 },
          { name: 'Wed', Applications: 15 },
          { name: 'Thu', Applications: 22 },
          { name: 'Fri', Applications: 30 },
          { name: 'Sat', Applications: 18 },
          { name: 'Sun', Applications: 25 },
        ],
    funnelData: data?.hiringFunnel
      ? data.hiringFunnel.map(f => ({ name: f.stage, value: f.count }))
      : [
          { name: 'Applied', value: 200 },
          { name: 'Shortlisted', value: 90 },
          { name: 'Interview Scheduled', value: 45 },
          { name: 'Hired', value: 23 },
        ],
    skillsDistribution: data?.topSkills
      ? data.topSkills.map(s => ({ name: s.skill, value: s.count }))
      : [
          { name: 'React', value: 65 },
          { name: 'Node.js', value: 50 },
          { name: 'Python', value: 45 },
          { name: 'AWS', value: 38 },
        ],
    monthlyHiring: data?.monthlyHires
      ? data.monthlyHires.map(m => ({ name: m.month, Hired: m.hires, Rejected: 2 }))
      : [
          { name: 'Jan', Hired: 3, Rejected: 1 },
          { name: 'Feb', Hired: 5, Rejected: 2 },
          { name: 'Mar', Hired: 4, Rejected: 1 },
          { name: 'Apr', Hired: 7, Rejected: 3 },
        ],
  };

  const statCards = [
    { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: '#FF6A00', sub: `${stats.activeJobs} active` },
    { label: 'Active Jobs', value: stats.activeJobs, icon: Target, color: '#FF6A00', sub: 'Live postings' },
    { label: 'Applicants', value: stats.totalApplicants, icon: Users, color: '#007AFF', sub: 'Total applications' },
    { label: 'Shortlisted', value: stats.shortlistedCandidates, icon: CheckCircle2, color: '#00C853', sub: 'Qualified pool' },
    { label: 'Interviews', value: stats.interviewScheduled, icon: Calendar, color: '#FFC107', sub: 'Scheduled' },
    { label: 'Offers Sent', value: stats.offersSent || 0, icon: ArrowUpRight, color: '#FF6A00', sub: 'Pending decision' },
    { label: 'Hired', value: stats.hiredCandidates, icon: CheckCircle2, color: '#00C853', sub: 'Successful hires' },
    { label: 'Rejected', value: stats.rejectedCandidates, icon: XCircle, color: '#FF3B30', sub: 'Not proceeding' },
  ];

  const getStatusBadge = (status) => {
    if (status === 'Hired' || status === 'Selected') return <span className="badge-success">{status}</span>;
    if (status === 'Rejected') return <span className="badge-danger">{status}</span>;
    if (status === 'Interview Scheduled') return <span className="badge-warning">{status}</span>;
    if (status === 'Shortlisted') return <span className="badge-info">{status}</span>;
    return <span className="badge-neutral">{status}</span>;
  };

  const getJobStatusBadge = (status) => {
    if (status === 'Published') return <span className="badge-success">{status}</span>;
    if (status === 'Draft') return <span className="badge-neutral">{status}</span>;
    if (status === 'Closed') return <span className="badge-danger">{status}</span>;
    return <span className="badge-warning">{status}</span>;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span style={{ color: '#FF6A00' }}>{recruiter.name?.split(' ')[0] || 'Recruiter'}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {recruiter.companyName || 'Apex AI'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/jobs?create=true" className="btn-primary text-sm">
            <Plus size={15} />
            New Job
          </Link>
          <Link to="/search" className="btn-ghost text-sm">
            <Search size={15} />
            AI Search
          </Link>
          <Link to="/recruiter/interview-schedule" className="btn-ghost text-sm">
            <Calendar size={15} />
            Schedule
          </Link>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#2A2A2A]">
        <button
          onClick={() => setDashboardTab('analytics')}
          className={`px-5 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${dashboardTab === 'analytics' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-gray-500 hover:text-white'}`}
        >
          Analytics Overview
        </button>
        <button
          onClick={() => setDashboardTab('applications')}
          className={`px-5 py-2.5 font-bold text-sm transition-all border-b-2 cursor-pointer ${dashboardTab === 'applications' ? 'border-[#FF6A00] text-[#FF6A00]' : 'border-transparent text-gray-500 hover:text-white'}`}
        >
          Job Applications (ATS)
        </button>
      </div>

      {dashboardTab === 'analytics' ? (
        <>
          {/* Stat Cards — 8 KPIs */}
          <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="stat-card p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
                    >
                      <Icon size={14} style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="font-mono text-2xl font-bold text-white leading-none mb-1">
                    <CountUp value={s.value} />
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400 leading-tight">{s.label}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{s.sub}</div>
                </div>
              );
            })}
          </section>

          {/* Charts Row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Applications Trend */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Applications Trend</h3>
                  <p className="text-[11px] text-gray-600 mt-0.5">Daily incoming resumes · last 7 days</p>
                </div>
                <div className="flex items-center gap-1.5 text-success text-xs font-medium">
                  <TrendingUp size={13} />
                  <span>Live data</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts.appTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF6A00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F1F1F" />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Applications" stroke="#FF6A00" strokeWidth={2} fill="url(#gradApps)" dot={false} activeDot={{ r: 4, fill: '#FF6A00' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Hiring Funnel */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Hiring Funnel</h3>
                  <p className="text-[11px] text-gray-600 mt-0.5">Pipeline conversion by stage</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.funnelData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1F1F1F" />
                  <XAxis type="number" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#444" fontSize={10} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {charts.funnelData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Skills Distribution */}
            <div className="card p-5">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-white">Skills Distribution</h3>
                <p className="text-[11px] text-gray-600 mt-0.5">Most common skills in candidate pool</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={charts.skillsDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {charts.skillsDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#888' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Analytics */}
            <div className="card p-5">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-white">Monthly Analytics</h3>
                <p className="text-[11px] text-gray-600 mt-0.5">Hires vs. Rejections · last 4 months</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.monthlyHiring} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F1F1F" />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#888' }} />
                  <Bar dataKey="Hired" fill="#00C853" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="Rejected" fill="#FF3B30" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Bottom Row: Candidates + Jobs */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Candidates */}
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Recent Candidates</h3>
                  <p className="text-[11px] text-gray-600 mt-0.5">Latest applicants in the pipeline</p>
                </div>
                <Link to="/candidates" className="text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors flex items-center gap-1">
                  View all <ArrowUpRight size={12} />
                </Link>
              </div>
              <div className="space-y-2">
                {candidates.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-600">No candidates yet</div>
                ) : candidates.map(c => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/3 transition-colors"
                    style={{ border: '1px solid #1F1F1F' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, #FF6A00, #FF8C00)` }}
                      >
                        {c.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] text-gray-600">{c.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-gray-600">ATS</div>
                        <div className={`text-xs font-bold font-mono ${c.atsScore >= 80 ? 'text-success' : c.atsScore >= 60 ? 'text-warning' : 'text-danger'}`}>
                          {c.atsScore}
                        </div>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Jobs */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Active Postings</h3>
                  <p className="text-[11px] text-gray-600 mt-0.5">Recent job requisitions</p>
                </div>
                <Link to="/jobs" className="text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors flex items-center gap-1">
                  Manage <ArrowUpRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {jobs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-600">No jobs posted yet</div>
                ) : jobs.map(j => (
                  <div
                    key={j._id}
                    className="p-3.5 rounded-xl space-y-2 hover:bg-white/3 transition-colors"
                    style={{ border: '1px solid #1F1F1F' }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-sm font-semibold text-white leading-tight">{j.title}</div>
                      {getJobStatusBadge(j.status)}
                    </div>
                    <div className="text-[11px] text-gray-600">{j.department} · {j.location}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <Clock size={10} />
                        {new Date(j.deadline).toLocaleDateString()}
                      </div>
                      <div className="text-xs font-semibold" style={{ color: '#FF6A00' }}>
                        {j.applicantCount || 0} applicants
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Applications Tab (ATS View) */
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 bg-[#111] p-4 rounded-2xl border border-[#2A2A2A]">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search candidates or jobs..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:border-[#FF6A00] focus:outline-none transition-colors"
                value={appsSearch}
                onChange={e => { setAppsSearch(e.target.value); setAppsPage(1); }}
              />
            </div>
            <select
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-sm focus:border-[#FF6A00] focus:outline-none cursor-pointer"
              value={appsStatus}
              onChange={e => { setAppsStatus(e.target.value); setAppsPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {appsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-[#161616] border border-[#2A2A2A] h-48 rounded-2xl"></div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold">No applications found</p>
            </div>
          ) : (
            <>
              {/* ATS Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications.map(app => {
                  const candidate = app.candidateId || {};
                  const job = app.jobId || {};
                  const initials = (candidate.name || app.candidateName || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const photoUrl = candidate.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(candidate.name || app.candidateName)}`;

                  return (
                    <div
                      key={app._id}
                      onClick={() => { setSelectedApp(app); setShowScheduleForm(false); }}
                      className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#FF6A00]/50 transition-colors cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={photoUrl}
                            alt={candidate.name || app.candidateName}
                            className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-[#2A2A2A]"
                            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${initials}`; }}
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">{candidate.name || app.candidateName}</h4>
                            <p className="text-[11px] text-gray-500 truncate max-w-[180px]">{candidate.email || app.candidateEmail}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[11px] text-gray-600 font-medium">Applied Job:</span>
                            <span className="text-xs font-semibold text-orange-500 text-right">{job.title || 'Unknown Role'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[11px] text-gray-600 font-medium">Experience:</span>
                            <span className="text-xs text-white">{candidate.totalExperience ? `${candidate.totalExperience} Years` : 'Fresh Graduate'}</span>
                          </div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[11px] text-gray-600 font-medium">Applied Date:</span>
                            <span className="text-xs text-gray-400">{new Date(app.appliedDate).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Skills Preview */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {candidate.skills.slice(0, 3).map(skill => (
                              <span key={skill} className="px-2 py-0.5 rounded bg-[#1F1F1F] text-gray-300 text-[9px] border border-[#2A2A2A]">
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 3 && (
                              <span className="text-[9px] text-gray-600">+{candidate.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-[#2A2A2A]">
                        <span className="text-[10px] text-gray-600 font-mono">ID: {app._id.slice(-6)}</span>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {appsTotalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                  <button
                    disabled={appsPage === 1}
                    onClick={() => setAppsPage(prev => Math.max(prev - 1, 1))}
                    className="px-3.5 py-1.5 rounded-xl bg-[#161616] border border-[#2A2A2A] text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-medium">Page {appsPage} of {appsTotalPages}</span>
                  <button
                    disabled={appsPage === appsTotalPages}
                    onClick={() => setAppsPage(prev => Math.min(prev + 1, appsTotalPages))}
                    className="px-3.5 py-1.5 rounded-xl bg-[#161616] border border-[#2A2A2A] text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Complete Candidate Profile / Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
              <div>
                <h3 className="text-lg font-bold text-white">Application Details</h3>
                <p className="text-xs text-gray-500">Review candidate information and application metrics</p>
              </div>
              <button
                onClick={() => { setSelectedApp(null); setShowScheduleForm(false); }}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#252525] transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Main Grid: Details vs Action (Scheduler) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Columns - Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Candidate Bio Block */}
                  <div className="flex gap-4 items-start bg-[#1C1C1C] p-5 rounded-2xl border border-[#2A2A2A]">
                    <img
                      src={selectedApp.candidateId?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedApp.candidateName || selectedApp.candidateId?.name)}`}
                      alt="Candidate profile"
                      className="w-16 h-16 rounded-2xl object-cover bg-white/5 border border-[#2A2A2A]"
                    />
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white leading-none">{selectedApp.candidateId?.name || selectedApp.candidateName}</h4>
                      <p className="text-sm text-orange-500 font-semibold">{selectedApp.candidateId?.headline || 'Talent Intelligence Pipeline'}</p>
                      <p className="text-xs text-gray-500">{selectedApp.candidateId?.location || 'India'}</p>
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[#2A2A2A] pb-1.5">Candidate Profile</h5>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-gray-600 font-semibold mb-0.5">Email</span>
                        <span className="text-white font-medium">{selectedApp.candidateId?.email || selectedApp.candidateEmail}</span>
                      </div>
                      <div>
                        <span className="block text-gray-600 font-semibold mb-0.5">Phone</span>
                        <span className="text-white font-medium">{selectedApp.candidateId?.phone || 'Not Provided'}</span>
                      </div>
                    </div>

                    {/* Socials */}
                    <div className="flex flex-wrap gap-3 pt-1 text-xs">
                      {selectedApp.candidateId?.linkedin && (
                        <a href={selectedApp.candidateId.linkedin} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
                          LinkedIn <ArrowUpRight size={12} />
                        </a>
                      )}
                      {selectedApp.candidateId?.github && (
                        <a href={selectedApp.candidateId.github} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
                          GitHub <ArrowUpRight size={12} />
                        </a>
                      )}
                      {selectedApp.candidateId?.portfolio && (
                        <a href={selectedApp.candidateId.portfolio} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
                          Portfolio <ArrowUpRight size={12} />
                        </a>
                      )}
                      {selectedApp.candidateId?.resumePath && (
                        <a href={`http://localhost:5000${selectedApp.candidateId.resumePath}`} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1">
                          Resume / CV <ArrowUpRight size={12} />
                        </a>
                      )}
                    </div>

                    {/* Skills */}
                    <div>
                      <span className="block text-xs font-semibold text-gray-600 mb-1.5">Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedApp.candidateId?.skills || []).map(skill => (
                          <span key={skill} className="px-2.5 py-1 rounded-lg bg-[#1C1C1C] text-gray-300 text-xs border border-[#252525]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    {selectedApp.candidateId?.education && selectedApp.candidateId.education.length > 0 && (
                      <div>
                        <span className="block text-xs font-semibold text-gray-600 mb-1.5">Education</span>
                        <div className="space-y-2">
                          {selectedApp.candidateId.education.map((edu, index) => (
                            <div key={index} className="bg-[#1C1C1C] p-3 rounded-xl border border-[#252525]">
                              <p className="text-xs font-bold text-white">{edu.degree} in {edu.field}</p>
                              <p className="text-[11px] text-gray-500">{edu.institution} ({edu.startYear} – {edu.endYear})</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {selectedApp.candidateId?.workExperience && selectedApp.candidateId.workExperience.length > 0 && (
                      <div>
                        <span className="block text-xs font-semibold text-gray-600 mb-1.5">Work Experience</span>
                        <div className="space-y-2">
                          {selectedApp.candidateId.workExperience.map((exp, index) => (
                            <div key={index} className="bg-[#1C1C1C] p-3 rounded-xl border border-[#252525] space-y-1">
                              <p className="text-xs font-bold text-white">{exp.title}</p>
                              <p className="text-[11px] text-orange-500/80 font-medium">{exp.company} · {exp.location}</p>
                              <p className="text-[11px] text-gray-500">{exp.startDate} – {exp.endDate || 'Present'}</p>
                              {exp.description && <p className="text-[11px] text-gray-400 italic pt-1">"{exp.description}"</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Job, Application Info and Quick Scheduler */}
                <div className="space-y-6 lg:border-l lg:border-[#2A2A2A] lg:pl-6">
                  {/* Job Information */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Requisition Details</h5>
                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] space-y-1">
                      <p className="text-xs font-bold text-white">{selectedApp.jobId?.title || 'Unknown Job Title'}</p>
                      <p className="text-[11px] text-gray-500">{selectedApp.jobId?.company || 'Company'}</p>
                      <p className="text-[11px] text-gray-600">{selectedApp.jobId?.location || 'Remote'}</p>
                    </div>
                  </div>

                  {/* Application Metrics */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Application Metrics</h5>
                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold">Status:</span>
                        {getStatusBadge(selectedApp.status)}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold">Applied Date:</span>
                        <span className="text-white font-medium">{new Date(selectedApp.appliedDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      {selectedApp.aiMatchScore > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-semibold">AI Match Score:</span>
                          <span className="text-emerald-500 font-bold">{selectedApp.aiMatchScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule Actions */}
                  <div className="pt-2">
                    {selectedApp.status === 'Interview Scheduled' ? (
                      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] text-center text-gray-500 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-white">Interview Scheduled</p>
                        <p className="mt-1">Details sent to candidate portal.</p>
                      </div>
                    ) : !showScheduleForm ? (
                      <button
                        onClick={() => setShowScheduleForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FF6A00] to-[#FF8C00] cursor-pointer transition-all hover:opacity-90 shadow-md"
                      >
                        <Calendar size={15} /> Schedule Interview
                      </button>
                    ) : (
                      /* Interview scheduling form */
                      <form onSubmit={handleScheduleInterview} className="space-y-3 bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] text-xs">
                        <h6 className="font-bold text-white mb-2 flex items-center gap-1.5">
                          <Calendar size={13} className="text-orange-500" />
                          Set Interview Details
                        </h6>

                        {scheduleError && (
                          <p className="text-[10px] text-red-400 p-2 rounded bg-red-500/10 border border-red-500/20">{scheduleError}</p>
                        )}
                        {scheduleSuccess && (
                          <p className="text-[10px] text-emerald-400 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">{scheduleSuccess}</p>
                        )}

                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Interview Date</label>
                          <input
                            type="date"
                            className="w-full bg-[#141414] border border-[#2A2A2A] text-white rounded-lg p-2 focus:outline-none focus:border-[#FF6A00]"
                            value={interviewForm.interviewDate}
                            onChange={e => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Start Time</label>
                            <input
                              type="time"
                              className="w-full bg-[#141414] border border-[#2A2A2A] text-white rounded-lg p-2 focus:outline-none focus:border-[#FF6A00]"
                              value={interviewForm.startTime}
                              onChange={e => setInterviewForm({ ...interviewForm, startTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">End Time</label>
                            <input
                              type="time"
                              className="w-full bg-[#141414] border border-[#2A2A2A] text-white rounded-lg p-2 focus:outline-none focus:border-[#FF6A00]"
                              value={interviewForm.endTime}
                              onChange={e => setInterviewForm({ ...interviewForm, endTime: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Format</label>
                          <select
                            className="w-full bg-[#141414] border border-[#2A2A2A] text-white rounded-lg p-2 focus:outline-none focus:border-[#FF6A00]"
                            value={interviewForm.mode}
                            onChange={e => setInterviewForm({ ...interviewForm, mode: e.target.value })}
                          >
                            <option value="Video Call">Video Call</option>
                            <option value="Phone Call">Phone Call</option>
                            <option value="In-Person">In-Person</option>
                            <option value="Technical Test">Technical Test</option>
                            <option value="Panel Interview">Panel Interview</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Meeting Link / Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Google Meet Link"
                            className="w-full bg-[#141414] border border-[#2A2A2A] text-white rounded-lg p-2 focus:outline-none focus:border-[#FF6A00]"
                            value={interviewForm.meetingLink}
                            onChange={e => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-gray-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Notes</label>
                          <textarea
                            rows="2"
                            placeholder="Preparation details..."
                            className="w-full bg-[#141414] border border-[#2A2A2A] text-white rounded-lg p-2 focus:outline-none focus:border-[#FF6A00] resize-none"
                            value={interviewForm.notes}
                            onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowScheduleForm(false)}
                            className="flex-1 py-2 rounded-lg bg-[#252525] text-gray-300 font-bold text-center cursor-pointer transition-all hover:bg-white/5"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={scheduleLoading}
                            className="flex-1 py-2 rounded-lg bg-[#FF6A00] text-white font-bold text-center cursor-pointer transition-all hover:bg-orange-500 disabled:opacity-50"
                          >
                            {scheduleLoading ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
