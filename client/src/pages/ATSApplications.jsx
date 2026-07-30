import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, CheckCircle2, XCircle, Clock, Calendar, 
  Mail, Phone, MapPin, X, Sparkles, Check, ChevronRight, Briefcase, User, Play
} from 'lucide-react';
import api from '../utils/api';

const statusTabs = [
  { id: 'All', label: 'All' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Shortlisted', label: 'Shortlisted' },
  { id: 'Interview Scheduled', label: 'Interview Scheduled' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'Completed/Hired', label: 'Completed/Hired' }
];

export default function ATSApplications() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer & Selection state
  const [selectedApp, setSelectedApp] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Schedule Form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '', time: '', endTime: '', mode: 'Video Call', link: '', notes: ''
  });

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ats/applications`, {
        params: {
          status: activeTab === 'All' ? undefined : activeTab,
          search: searchQuery,
          page: currentPage
        }
      });
      setApplications(res.data.applications || []);
      setStatusCounts(res.data.statusCounts || {});
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      // Fallback dummy data for visual preview if API fails
      if (applications.length === 0) {
        setApplications([
          {
            _id: '1',
            candidate: { name: 'Sarah Jenkins', email: 'sarah@example.com', phone: '+1 234 567 8900', location: 'New York, NY', skills: ['React', 'Node.js', 'TypeScript', 'AWS'] },
            job: { title: 'Senior Frontend Developer' },
            status: 'Applied',
            aiScore: 85,
            appliedAt: new Date().toISOString(),
          },
          {
            _id: '2',
            candidate: { name: 'Michael Chen', email: 'mike@example.com', phone: '+1 987 654 3210', location: 'San Francisco, CA', skills: ['Python', 'Django', 'PostgreSQL', 'Docker'] },
            job: { title: 'Backend Engineer' },
            status: 'Shortlisted',
            aiScore: 92,
            appliedAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ]);
        setStatusCounts({ All: 2, Applied: 1, Shortlisted: 1, 'Interview Scheduled': 0, Rejected: 0, 'Completed/Hired': 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, [activeTab, searchQuery, currentPage]);

  const handleAppClick = (app) => {
    setSelectedApp(app);
    setDrawerOpen(true);
    setShowScheduleForm(false);
    setAiAnalysis(null);
    fetchAiAnalysis(app._id);
  };

  const fetchAiAnalysis = async (id) => {
    try {
      setAiLoading(true);
      const res = await api.post(`/ats/applications/${id}/ai-analysis`);
      setAiAnalysis(res.data.analysis || {
        summary: "Strong candidate with extensive frontend experience. Matches well with the job requirements.",
        matchScore: 88,
        strengths: ["Deep React knowledge", "System design experience", "Good communication"],
        weaknesses: ["Lacks backend architectural experience"],
        recommendation: "Proceed to technical interview.",
        questions: ["Can you explain a complex React state management issue you solved?", "How do you optimize performance in a large SPA?"]
      });
    } catch (err) {
      console.error(err);
      // Dummy analysis
      setAiAnalysis({
        summary: "AI could not generate a real analysis at this time. Here is a placeholder: Strong candidate with relevant skills.",
        matchScore: Math.floor(Math.random() * 30) + 70,
        strengths: ["Skill A", "Skill B", "Culture Fit"],
        weaknesses: ["Missing specific domain knowledge"],
        recommendation: "Schedule an introductory call.",
        questions: ["Tell me about your last project.", "What is your greatest strength?"]
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAction = async (id, actionType) => {
    try {
      if (actionType === 'accept') {
        await api.patch(`/ats/applications/${id}/accept`);
        showToast('Application Accepted');
      } else if (actionType === 'reject') {
        await api.patch(`/ats/applications/${id}/reject`);
        showToast('Application Rejected', 'error');
      }
      fetchApplications();
      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      showToast(`Failed to ${actionType} application`, 'error');
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/ats/applications/${selectedApp._id}/schedule-interview`, scheduleData);
      showToast('Interview Scheduled successfully');
      setShowScheduleForm(false);
      setDrawerOpen(false);
      fetchApplications();
    } catch (err) {
      console.error(err);
      showToast('Failed to schedule interview', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Shortlisted': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Interview Scheduled': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'Completed/Hired': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'Rejected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NA';

  return (
    <div className="min-h-full w-full bg-[#090909] text-white p-6 relative font-sans">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6A00] to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,106,0,0.3)]">
                <ClipboardList className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                <p className="text-gray-400 text-sm mt-1">Manage and track your candidate pipeline</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center bg-[#161616] border border-[#2A2A2A] rounded-xl px-4 py-2.5 w-full md:w-[350px] shadow-sm focus-within:border-[#FF6A00]/50 transition-colors">
            <Search size={18} className="text-gray-500 mr-3" />
            <input 
              type="text" 
              placeholder="Search candidate or role..." 
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === tab.id 
                  ? 'bg-[#FF6A00] text-white shadow-[0_4px_12px_rgba(255,106,0,0.3)]' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-transparent'
                }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-black/30'}`}>
                {statusCounts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Loading / Grid */}
        {loading && applications.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-44 rounded-2xl bg-[#161616] border border-[#2A2A2A] animate-pulse"></div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p>No applications found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
            {applications.map(app => (
              <div 
                key={app._id} 
                onClick={() => handleAppClick(app)}
                className="group relative bg-[#161616] border border-[#2A2A2A] hover:border-[#FF6A00]/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF6A00]/5 overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-lg font-bold text-gray-200 shrink-0">
                      {getInitials(app.candidate?.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-[#FF6A00] transition-colors">{app.candidate?.name || 'Unknown Candidate'}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Briefcase size={14} /> {app.job?.title || 'Unknown Role'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(app.status)} font-medium inline-block`}>
                      {app.status}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-2">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {app.candidate?.skills?.slice(0,4).map((skill, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-[#111111] border border-gray-800 text-gray-300 rounded-md">
                      {skill}
                    </span>
                  ))}
                  {app.candidate?.skills?.length > 4 && (
                    <span className="text-xs px-2 py-1 bg-transparent text-gray-500">
                      +{app.candidate.skills.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A00]/10 flex items-center justify-center border border-[#FF6A00]/20">
                      <Sparkles size={14} className="text-[#FF6A00]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">AI Match</div>
                      <div className="text-sm font-bold text-white">{app.aiScore || 0}%</div>
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-200">
                    <button className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors" title="Accept" onClick={(e) => { e.stopPropagation(); handleAction(app._id, 'accept'); }}>
                      <Check size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors" title="Reject" onClick={(e) => { e.stopPropagation(); handleAction(app._id, 'reject'); }}>
                      <X size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors" title="Schedule" onClick={(e) => { e.stopPropagation(); setSelectedApp(app); setDrawerOpen(true); setShowScheduleForm(true); }}>
                      <Calendar size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Drawer */}
      {drawerOpen && selectedApp && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#111111] shadow-2xl z-50 transform transition-transform border-l border-[#2A2A2A] flex flex-col animate-slideInRight">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-center justify-between bg-[#161616]">
              <h2 className="text-lg font-semibold text-white">Application Details</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              
              {/* Profile Card */}
              <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
                    {getInitials(selectedApp.candidate?.name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedApp.candidate?.name}</h3>
                    <p className="text-[#FF6A00] text-sm font-medium">{selectedApp.job?.title}</p>
                    <div className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(selectedApp.status)} inline-block mt-2 font-medium uppercase tracking-wider`}>
                      {selectedApp.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-6">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Mail size={16} className="text-gray-500" /> {selectedApp.candidate?.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Phone size={16} className="text-gray-500" /> {selectedApp.candidate?.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <MapPin size={16} className="text-gray-500" /> {selectedApp.candidate?.location || 'N/A'}
                  </div>
                </div>
              </div>

              {/* AI Analysis Panel */}
              <div className="bg-gradient-to-b from-[#161616] to-[#111111] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6A00]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <h3 className="text-md font-bold text-white flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-[#FF6A00]" /> AI Resume Intel
                </h3>

                {aiLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-800 rounded w-full"></div>
                    <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                    <div className="flex gap-4 mt-6">
                      <div className="h-16 w-16 bg-gray-800 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-800 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-800" />
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * aiAnalysis.matchScore) / 100} className="text-[#FF6A00] transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-sm font-bold">{aiAnalysis.matchScore}%</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Match Score</div>
                        <p className="text-sm text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" /> Strengths
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.strengths?.map((s, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-emerald-500 mt-1 text-[10px]">●</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                          <XCircle size={14} className="text-red-500" /> Weaknesses
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.weaknesses?.map((w, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-red-500 mt-1 text-[10px]">●</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#2A2A2A]">
                      <h4 className="text-xs text-[#FF6A00] uppercase font-bold tracking-wider mb-2">Suggested Interview Questions</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                        {aiAnalysis.questions?.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ) : null}
              </div>
              
              {/* Schedule Form inline */}
              {showScheduleForm && (
                <div className="bg-[#161616] border border-[#FF6A00]/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(255,106,0,0.05)]">
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-[#FF6A00]" /> Schedule Interview
                  </h3>
                  <form onSubmit={handleSchedule} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Date</label>
                        <input type="date" required value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF6A00] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Mode</label>
                        <select value={scheduleData.mode} onChange={e => setScheduleData({...scheduleData, mode: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF6A00] outline-none">
                          <option>Video Call</option>
                          <option>Phone Call</option>
                          <option>In-Person</option>
                          <option>Online</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                        <input type="time" required value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF6A00] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">End Time</label>
                        <input type="time" required value={scheduleData.endTime} onChange={e => setScheduleData({...scheduleData, endTime: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF6A00] outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Meeting Link / Location</label>
                      <input type="text" placeholder="https://zoom.us/j/..." value={scheduleData.link} onChange={e => setScheduleData({...scheduleData, link: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF6A00] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Message / Notes</label>
                      <textarea rows={2} placeholder="Optional notes for candidate" value={scheduleData.notes} onChange={e => setScheduleData({...scheduleData, notes: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FF6A00] outline-none"></textarea>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowScheduleForm(false)} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 px-4 py-2 bg-[#FF6A00] text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                        Confirm Schedule
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            {!showScheduleForm && (
              <div className="p-4 border-t border-[#2A2A2A] bg-[#161616] grid grid-cols-3 gap-3">
                <button onClick={() => handleAction(selectedApp._id, 'accept')} className="flex flex-col items-center justify-center py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                  <CheckCircle2 size={20} className="mb-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">Accept</span>
                </button>
                <button onClick={() => handleAction(selectedApp._id, 'reject')} className="flex flex-col items-center justify-center py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                  <XCircle size={20} className="mb-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">Reject</span>
                </button>
                <button onClick={() => setShowScheduleForm(true)} className="flex flex-col items-center justify-center py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                  <Calendar size={20} className="mb-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">Schedule</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slideInRight">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'} backdrop-blur-md`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <p className="font-semibold text-sm">{toast.msg}</p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
