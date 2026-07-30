import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Briefcase, MapPin, Calendar,
  DollarSign, Plus, Brain, Star, Mail, BookOpen,
  Paperclip, Award, AlertCircle, Settings, CheckCircle2,
  XCircle, TrendingUp, Users, ChevronDown
} from 'lucide-react';
import api from '../utils/api';

const StatusBadge = ({ status }) => {
  const map = {
    'Hired': { bg: 'rgba(0,200,83,0.12)', color: '#00C853', border: 'rgba(0,200,83,0.25)' },
    'Rejected': { bg: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: 'rgba(255,59,48,0.25)' },
    'Interview Scheduled': { bg: 'rgba(255,193,7,0.12)', color: '#FFC107', border: 'rgba(255,193,7,0.25)' },
    'Shortlisted': { bg: 'rgba(0,122,255,0.12)', color: '#007AFF', border: 'rgba(0,122,255,0.25)' },
    'Applied': { bg: 'rgba(255,255,255,0.06)', color: '#888', border: 'rgba(255,255,255,0.08)' },
  };
  const s = map[status] || map['Applied'];
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExp, setFilterExp] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [selectedJobId, setSelectedJobId] = useState('');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({ dateTime: '', panelists: '', meetingLink: '', notes: '' });
  const [noteContent, setNoteContent] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.query = search;
      if (filterStatus) params.status = filterStatus;
      if (filterExp) params.experience = filterExp;
      if (filterLocation) params.location = filterLocation;
      if (sortBy) params.sort = sortBy;
      if (selectedJobId) params.jobId = selectedJobId;
      const res = await api.get('/candidates', { params });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCandidates(list);
      if (selectedCandidate) {
        const u = list.find(c => c._id === selectedCandidate._id);
        if (u) setSelectedCandidate(u);
      }
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  const fetchJobs = async () => {
    try { const res = await api.get('/jobs'); setJobs(res.data.data); }
    catch (err) { console.error(err.message); }
  };

  useEffect(() => { fetchCandidates(); }, [search, filterStatus, filterExp, filterLocation, sortBy, selectedJobId]);
  useEffect(() => { fetchJobs(); }, []);

  const handleStatusChange = async (candId, newStatus) => {
    try { await api.patch(`/candidates/${candId}/status`, { status: newStatus, jobId: selectedJobId || undefined }); fetchCandidates(); }
    catch (err) { alert(err.message); }
  };

  const handleRatingChange = async (candId, rating) => {
    try { await api.patch(`/candidates/${candId}/rating`, { rating }); fetchCandidates(); }
    catch (err) { alert(err.message); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try { await api.post(`/candidates/${selectedCandidate._id}/notes`, { comment: noteContent }); setNoteContent(''); fetchCandidates(); }
    catch (err) { alert(err.message); }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/candidates/${selectedCandidate._id}/email`, { subject: emailSubject, body: emailBody });
      setShowEmailModal(false); setEmailSubject(''); setEmailBody(''); fetchCandidates();
      alert('Email sent!');
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedJobId) { alert('Select a job first.'); return; }
    try {
      await api.post('/interviews', {
        candidateId: selectedCandidate._id, jobId: selectedJobId,
        dateTime: interviewData.dateTime,
        panelists: interviewData.panelists.split(',').map(p => p.trim()).filter(p => p),
        meetingLink: interviewData.meetingLink, notes: interviewData.notes
      });
      setShowInterviewModal(false); setInterviewData({ dateTime: '', panelists: '', meetingLink: '', notes: '' }); fetchCandidates();
      alert('Interview scheduled!');
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const applyToJob = async (jobId) => {
    try { await api.post(`/candidates/${selectedCandidate._id}/apply/${jobId}`); fetchCandidates(); alert('AI match scores generated!'); }
    catch (err) { alert(err.response?.data?.error || 'Matching failure.'); }
  };

  const inputCls = "w-full bg-[#1E1E1E] border border-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00] transition-colors";
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'interviews', label: 'Interviews' },
    { id: 'emails', label: 'Email' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Candidate Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Audit resumes, review ratings, track timelines, and query talent pools via AI.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Job Context</label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="bg-[#1E1E1E] border border-[#2A2A2A] px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6A00]"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">Global Pool</option>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        </div>
      </div>

      {/* Main Split */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        {/* Left: List */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0 rounded-2xl p-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          {/* Search & Filters */}
          <div className="space-y-2 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search candidates or ask AI..."
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: filterStatus, set: setFilterStatus, opts: [['','All Status'],['Applied','Applied'],['Shortlisted','Shortlisted'],['Interview Scheduled','Interview'],['Hired','Hired'],['Rejected','Rejected']] },
                { value: filterExp, set: setFilterExp, opts: [['','Experience'],['0','Freshers'],['2','2+ Years'],['5','5+ Years']] },
                { value: sortBy, set: setSortBy, opts: [['-createdAt','Newest'],['atsScore','ATS Score'],['-experience','Experience']] },
              ].map((f, i) => (
                <select key={i} value={f.value} onChange={e => f.set(e.target.value)}
                  className="bg-[#1E1E1E] border border-[#2A2A2A] px-2 py-2 rounded-xl text-[10px] text-gray-500 focus:outline-none focus:border-[#FF6A00]"
                  style={{ colorScheme: 'dark' }}>
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
            </div>
          </div>

          {/* Candidate List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#1E1E1E' }} />
              ))
            ) : candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-sm text-gray-600">
                <Users size={24} className="mb-2 opacity-40" />
                No candidates found
              </div>
            ) : candidates.map(c => (
              <div
                key={c._id}
                onClick={() => setSelectedCandidate(c)}
                className="p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3"
                style={{
                  background: selectedCandidate?._id === c._id ? 'rgba(255,106,0,0.08)' : '#1E1E1E',
                  border: `1px solid ${selectedCandidate?._id === c._id ? 'rgba(255,106,0,0.3)' : '#2A2A2A'}`,
                }}
              >
                <div className="min-w-0 space-y-1">
                  <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-gray-600">{c.experience}y exp{c.location && ` · ${c.location}`}</div>
                  <div className="flex flex-wrap gap-1">
                    {c.tags?.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[9px] text-gray-600 bg-white/5 border border-[#2A2A2A] px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <div className="text-[10px] text-gray-600 font-mono">
                    {selectedJobId ? `${c.matchScore}%` : `${c.atsScore} ATS`}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-3 flex flex-col min-h-0 rounded-2xl p-5" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          {!selectedCandidate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                <BookOpen size={24} className="text-gray-600" />
              </div>
              <h4 className="font-semibold text-white mb-1">No Candidate Selected</h4>
              <p className="text-sm text-gray-600 max-w-xs">Select a candidate from the left panel to view their profile, schedule interviews, and send emails.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-[#1F1F1F] flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)' }}>
                    {selectedCandidate.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white leading-tight">{selectedCandidate.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedCandidate.email} · {selectedCandidate.phone || 'No phone'}</p>
                    <div className="flex gap-1 mt-1.5">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => handleRatingChange(selectedCandidate._id, star)} className="cursor-pointer">
                          <Star size={12} className={star <= selectedCandidate.internalRatings ? 'text-warning fill-warning' : 'text-gray-700'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => handleStatusChange(selectedCandidate._id, 'Shortlisted')}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.2)' }}>
                    Shortlist
                  </button>
                  <button onClick={() => handleStatusChange(selectedCandidate._id, 'Hired')}
                    className="flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(0,200,83,0.1)', color: '#00C853', border: '1px solid rgba(0,200,83,0.2)' }}>
                    <CheckCircle2 size={11} /> Hire
                  </button>
                  <button onClick={() => handleStatusChange(selectedCandidate._id, 'Rejected')}
                    className="flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                    <XCircle size={11} /> Reject
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-[#1F1F1F] flex-shrink-0 mt-3">
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className="px-4 py-2 text-xs font-semibold transition-colors relative cursor-pointer"
                    style={{ color: activeTab === t.id ? '#FF6A00' : '#666' }}>
                    {t.label}
                    {activeTab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6A00]" />}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto py-4 min-h-0 space-y-4 no-scrollbar">
                {activeTab === 'profile' && (
                  <>
                    {selectedCandidate.resumePath && (
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Paperclip size={13} /> Extracted CV Document
                        </div>
                        <a href={`http://localhost:5000${selectedCandidate.resumePath}`} target="_blank" rel="noreferrer"
                          className="text-xs text-[#FF6A00] hover:text-[#FF8C00] font-semibold transition-colors">
                          Download
                        </a>
                      </div>
                    )}

                    {selectedJobId && selectedCandidate.matchScore > 0 && (
                      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,106,0,0.05)', border: '1px solid rgba(255,106,0,0.2)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#FF6A00' }}>
                            <Brain size={14} /> AI Job Match Score
                          </div>
                          <span className="text-xl font-bold font-mono" style={{ color: '#FF6A00' }}>{selectedCandidate.matchScore}%</span>
                        </div>
                        {selectedCandidate.aiAnalysis?.relevanceExplanation && (
                          <p className="text-xs text-gray-500 leading-relaxed p-2.5 rounded-xl" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                            {selectedCandidate.aiAnalysis.relevanceExplanation}
                          </p>
                        )}
                        {selectedCandidate.aiAnalysis?.missingSkills?.length > 0 && (
                          <div>
                            <div className="text-[10px] text-[#FF3B30] font-bold uppercase tracking-wide mb-1.5">Missing Skills</div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedCandidate.aiAnalysis.missingSkills.map((s, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div className={`text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1`}>Summary</div>
                      <p className="text-sm text-gray-400 leading-relaxed">{selectedCandidate.summary || 'No resume summary parsed.'}</p>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.skills.map((s, i) => (
                          <span key={i} className="text-xs text-gray-400 bg-white/5 border border-[#2A2A2A] px-2.5 py-1 rounded-lg">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Education</div>
                      <ul className="space-y-1 text-sm text-gray-400">
                        {selectedCandidate.education.map((e, i) => <li key={i} className="flex items-start gap-2"><span className="text-[#FF6A00] mt-1">▸</span>{e}</li>)}
                      </ul>
                    </div>
                    {selectedCandidate.certifications?.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Certifications</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCandidate.certifications.map((c, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,193,7,0.08)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.2)' }}>
                              <Award size={11} /> {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'interviews' && (
                  <div className="space-y-4">
                    <button onClick={() => setShowInterviewModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all"
                      style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}>
                      <Calendar size={16} /> Schedule Panel Interview
                    </button>
                    <div className="p-4 rounded-xl text-sm text-gray-500" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                      View all calendar meetings under the <strong className="text-white">Interview Calendar</strong> section in the sidebar.
                    </div>
                  </div>
                )}

                {activeTab === 'emails' && (
                  <div>
                    <button onClick={() => {
                      setEmailSubject(`Re: Application - ${selectedCandidate.name}`);
                      setEmailBody(`Hi ${selectedCandidate.name.split(' ')[0]},\n\nThank you for applying. We reviewed your CV and would like to move you forward.\n\nBest Regards,\nApex AI Systems`);
                      setShowEmailModal(true);
                    }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                      style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.2)' }}>
                      <Mail size={16} /> Compose Email Invitation
                    </button>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4 flex flex-col h-full">
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input type="text" value={noteContent} onChange={e => setNoteContent(e.target.value)}
                        placeholder="Add internal comment..."
                        className="flex-1 bg-[#1E1E1E] border border-[#2A2A2A] px-4 py-2.5 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00]" />
                      <button type="submit" disabled={!noteContent.trim()}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-40 transition-colors"
                        style={{ background: '#FF6A00' }}>Add</button>
                    </form>
                    <div className="space-y-2 overflow-y-auto no-scrollbar">
                      {selectedCandidate.notes?.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-600">No notes yet</div>
                      ) : selectedCandidate.notes?.map((n, i) => (
                        <div key={i} className="p-3 rounded-xl space-y-1" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-white">{n.writer}</span>
                            <span className="text-[10px] text-gray-600">{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500">{n.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Match CTA */}
              {selectedJobId && selectedCandidate.matchScore === 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-[#1F1F1F] flex-shrink-0">
                  <span className="text-xs text-gray-600">Apply candidate to this job?</span>
                  <button onClick={() => applyToJob(selectedJobId)}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors text-white"
                    style={{ background: '#FF6A00' }}>
                    Generate AI Score
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <form onSubmit={handleSendEmail} className="relative z-10 w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: '#161616', border: '1px solid #2A2A2A', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
            <div>
              <h3 className="font-bold text-base text-white">Compose Email</h3>
              <p className="text-xs text-gray-500 mt-0.5">Send notification to candidate's email address.</p>
            </div>
            <div><label className={labelCls}>Subject</label>
              <input type="text" required value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Body</label>
              <textarea required rows={6} value={emailBody} onChange={e => setEmailBody(e.target.value)} className={`${inputCls} resize-none`} /></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-[#2A2A2A] hover:bg-white/5 cursor-pointer transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: '#FF6A00' }}>Send Email</button>
            </div>
          </form>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInterviewModal(false)} />
          <form onSubmit={handleScheduleInterview} className="relative z-10 w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: '#161616', border: '1px solid #2A2A2A', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
            <div>
              <h3 className="font-bold text-base text-white">Schedule Panel Interview</h3>
              <p className="text-xs text-gray-500 mt-0.5">For {selectedCandidate?.name}</p>
            </div>
            {[
              { label: 'Date & Time', type: 'datetime-local', key: 'dateTime' },
              { label: 'Panel Members (comma separated)', type: 'text', key: 'panelists', placeholder: 'Sarah Jenkins, Alan Turing' },
              { label: 'Meeting Link', type: 'text', key: 'meetingLink', placeholder: 'https://meet.google.com/...' },
            ].map(f => (
              <div key={f.key}><label className={labelCls}>{f.label}</label>
                <input type={f.type} required={f.key !== 'meetingLink'} value={interviewData[f.key]}
                  onChange={e => setInterviewData({ ...interviewData, [f.key]: e.target.value })}
                  placeholder={f.placeholder} className={inputCls} style={{ colorScheme: 'dark' }} /></div>
            ))}
            <div><label className={labelCls}>Notes</label>
              <textarea rows={3} value={interviewData.notes} onChange={e => setInterviewData({ ...interviewData, notes: e.target.value })}
                className={`${inputCls} resize-none`} /></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowInterviewModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-[#2A2A2A] hover:bg-white/5 cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: '#FF6A00' }}>Schedule & Alert</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;
