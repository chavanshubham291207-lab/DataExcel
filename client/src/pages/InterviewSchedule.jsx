import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Search, Video, Phone, MapPin, Users, FileText,
  CheckCircle2, XCircle, AlertCircle, ExternalLink, ChevronRight,
  Briefcase, User, Mail, Star, Award, RefreshCw, X, CalendarDays,
  Loader2, Link2, StickyNote, Wifi, Building2
} from 'lucide-react';
import api from '../utils/api';

// ─── Reusable style constants ───────────────────────────────
const card = {
  background: 'rgba(22,22,22,0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid #2A2A2A',
  borderRadius: '16px',
};

const inputCls = [
  'w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-600',
  'focus:outline-none focus:border-[#FF6A00] transition-colors',
  'bg-[#141414] border border-[#2A2A2A]',
].join(' ');

const labelCls = 'block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

const modeIcons = {
  'Video Call': Video,
  'Phone Call': Phone,
  'In-Person': Building2,
  'Technical Test': FileText,
  'Panel Interview': Users,
};

const modeColors = {
  'Video Call': '#007AFF',
  'Phone Call': '#34C759',
  'In-Person': '#FF9500',
  'Technical Test': '#AF52DE',
  'Panel Interview': '#FF6A00',
};

// ─── Status Badge ────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Scheduled: { bg: 'rgba(0,122,255,0.12)', color: '#007AFF', border: 'rgba(0,122,255,0.25)' },
    Rescheduled: { bg: 'rgba(255,193,7,0.12)', color: '#FFC107', border: 'rgba(255,193,7,0.25)' },
    Completed: { bg: 'rgba(0,200,83,0.12)', color: '#00C853', border: 'rgba(0,200,83,0.25)' },
    Cancelled: { bg: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: 'rgba(255,59,48,0.25)' },
  };
  const s = map[status] || map.Scheduled;
  return (
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

// ─── Skill Tag ────────────────────────────────────────────────
const SkillTag = ({ skill }) => (
  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,106,0,0.1)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.2)' }}>
    {skill}
  </span>
);

// ─── Main Component ───────────────────────────────────────────
const InterviewSchedule = () => {
  // ── Application Lookup State ──
  const [appIdInput, setAppIdInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupData, setLookupData] = useState(null);   // { application, candidate, job, existingInterview }

  // ── Schedule Form State ──
  const [form, setForm] = useState({
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

  // ── Scheduled Interviews List ──
  const [allInterviews, setAllInterviews] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const fetchAllInterviews = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await api.get('/interview-schedule/recruiter/all');
      setAllInterviews(res.data.data || []);
    } catch (err) {
      console.error('[InterviewSchedule] fetch all interviews:', err.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllInterviews(); }, [fetchAllInterviews]);

  // ── Lookup Application ──
  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLookupData(null);
    setScheduleError('');
    setScheduleSuccess('');

    const trimmedId = appIdInput.trim();
    if (!trimmedId) { setLookupError('Please enter an Application ID.'); return; }
    if (!/^[a-f\d]{24}$/i.test(trimmedId)) { setLookupError('Invalid Application ID format. It should be a 24-character hex string.'); return; }

    setLookupLoading(true);
    try {
      const res = await api.post('/interview-schedule/lookup-application', { applicationId: trimmedId });
      setLookupData(res.data.data);
      // Pre-fill meeting link if Google Meet
      if (!form.meetingLink) {
        setForm(f => ({ ...f, meetingLink: '' }));
      }
    } catch (err) {
      setLookupError(err.response?.data?.error || 'Failed to find application. Please check the ID.');
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Submit Schedule ──
  const handleSchedule = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSuccess('');

    if (!lookupData) { setScheduleError('Please look up an application first.'); return; }
    if (!form.interviewDate) { setScheduleError('Please select an interview date.'); return; }
    if (!form.startTime) { setScheduleError('Please set a start time.'); return; }
    if (!form.endTime) { setScheduleError('Please set an end time.'); return; }
    if (form.startTime >= form.endTime) { setScheduleError('End time must be after start time.'); return; }

    setScheduleLoading(true);
    try {
      await api.post('/interview-schedule/schedule', {
        applicationId: lookupData.application._id,
        ...form,
      });
      setScheduleSuccess(`Interview successfully scheduled for ${lookupData.candidate.name} on ${form.interviewDate} at ${form.startTime}!`);
      // Refresh list and reset form
      fetchAllInterviews();
      setLookupData(null);
      setAppIdInput('');
      setForm({ interviewDate: '', startTime: '', endTime: '', mode: 'Video Call', meetingLink: '', notes: '' });
    } catch (err) {
      setScheduleError(err.response?.data?.error || 'Failed to schedule interview.');
    } finally {
      setScheduleLoading(false);
    }
  };

  // ── Cancel Interview ──
  const handleCancel = async (interviewId) => {
    if (!window.confirm('Cancel this interview? The application status will revert to Shortlisted.')) return;
    try {
      await api.put(`/interview-schedule/${interviewId}/cancel`);
      fetchAllInterviews();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel.');
    }
  };

  const { candidate, job, existingInterview } = lookupData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 20px rgba(255,106,0,0.4)' }}>
          <CalendarDays size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Interview Scheduler</h1>
          <p className="text-xs text-gray-500 mt-0.5">Schedule interviews for candidates via Application ID</p>
        </div>
      </div>

      {/* Success Banner */}
      {scheduleSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.25)', color: '#00C853' }}>
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{scheduleSuccess}</span>
          <button onClick={() => setScheduleSuccess('')} className="ml-auto text-[#00C853]/60 hover:text-[#00C853] cursor-pointer"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT PANEL — Lookup + Form */}
        <div className="xl:col-span-2 space-y-5">

          {/* Application ID Lookup */}
          <div style={card} className="p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Search size={14} className="text-orange-500" />
              Find Application
            </h2>
            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className={labelCls}>Application ID</label>
                <input
                  value={appIdInput}
                  onChange={e => setAppIdInput(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 64f8d3b2a9c1e2f3a4b5c6d7"
                  spellCheck={false}
                />
              </div>
              {lookupError && (
                <div className="flex items-center gap-2 text-xs text-red-400 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)' }}>
                  <AlertCircle size={12} className="flex-shrink-0" /> {lookupError}
                </div>
              )}
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all"
                style={{ background: 'linear-gradient(135deg,#FF6A00,#FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}
              >
                {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                {lookupLoading ? 'Searching...' : 'Look Up Application'}
              </button>
            </form>
          </div>

          {/* Candidate Preview Card */}
          {lookupData && (
            <div style={card} className="p-5 space-y-4 animate-in fade-in">
              {/* Existing interview warning */}
              {existingInterview && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', color: '#FFC107' }}>
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>An interview is already scheduled for this application (Status: {existingInterview.status}). Cancel it before creating a new one.</span>
                </div>
              )}

              {/* Candidate Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,106,0,0.15)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.25)' }}>
                    {(candidate?.name || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{candidate?.name || 'Unknown Candidate'}</p>
                    <p className="text-[10px] text-gray-500">{candidate?.email}</p>
                  </div>
                  {candidate?.atsScore > 0 && (
                    <div className="ml-auto flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,106,0,0.1)', color: '#FF6A00' }}>
                      <Star size={10} /> {candidate.atsScore}%
                    </div>
                  )}
                </div>

                {candidate?.headline && <p className="text-xs text-gray-400 mb-2 italic">"{candidate.headline}"</p>}

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                  {candidate?.phone && (
                    <div className="flex items-center gap-1.5 text-gray-500"><Phone size={9} />{candidate.phone}</div>
                  )}
                  {candidate?.totalExperience > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500"><Award size={9} />{candidate.totalExperience}y exp</div>
                  )}
                </div>

                {candidate?.skills?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 10).map(s => <SkillTag key={s} skill={s} />)}
                      {candidate.skills.length > 10 && <span className="text-[10px] text-gray-600">+{candidate.skills.length - 10}</span>}
                    </div>
                  </div>
                )}

                {candidate?.resumePath && (
                  <a href={`http://localhost:5000${candidate.resumePath}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-[10px] text-orange-400 hover:text-orange-300 font-semibold cursor-pointer">
                    <FileText size={10} /> View Resume <ExternalLink size={8} />
                  </a>
                )}
              </div>

              {/* Job Info */}
              <div className="pt-3 border-t border-[#2A2A2A]">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Applied For</p>
                <div className="flex items-start gap-2">
                  <Briefcase size={12} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{job?.title}</p>
                    <p className="text-[10px] text-gray-500">{job?.company} · {job?.department}</p>
                    <p className="text-[10px] text-gray-600">{job?.location} · {job?.employmentType}</p>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
                <span className="text-[10px] text-gray-600">Application Status</span>
                <StatusBadge status={lookupData.application.status} />
              </div>
            </div>
          )}

          {/* Schedule Form */}
          {lookupData && !existingInterview && (
            <div style={card} className="p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calendar size={14} className="text-orange-500" />
                Schedule Interview
              </h2>
              <form onSubmit={handleSchedule} className="space-y-3.5">
                <div>
                  <label className={labelCls}>Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={form.interviewDate}
                    onChange={e => setForm(f => ({ ...f, interviewDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className={inputCls}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Start Time *</label>
                    <input
                      type="time"
                      required
                      value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className={inputCls}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>End Time *</label>
                    <input
                      type="time"
                      required
                      value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className={inputCls}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Interview Mode *</label>
                  <select
                    value={form.mode}
                    onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                    className={inputCls}
                    style={{ colorScheme: 'dark' }}
                  >
                    {Object.keys(modeIcons).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Meeting Link <span className="text-gray-700 normal-case">(optional)</span></label>
                  <div className="relative">
                    <Link2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="url"
                      value={form.meetingLink}
                      onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                      className={inputCls + ' pl-9'}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notes <span className="text-gray-700 normal-case">(optional)</span></label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className={inputCls}
                    rows={3}
                    placeholder="Add interview notes, instructions for candidate..."
                    style={{ resize: 'none' }}
                  />
                </div>

                {scheduleError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)' }}>
                    <AlertCircle size={12} /> {scheduleError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={scheduleLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white cursor-pointer transition-all"
                  style={{ background: 'linear-gradient(135deg,#FF6A00,#FF8C00)', boxShadow: '0 0 20px rgba(255,106,0,0.35)' }}
                >
                  {scheduleLoading ? <><Loader2 size={14} className="animate-spin" /> Scheduling...</> : <><CheckCircle2 size={14} /> Confirm Interview</>}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Scheduled Interviews List */}
        <div className="xl:col-span-3">
          <div style={card} className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarDays size={14} className="text-orange-500" />
                Scheduled Interviews
                {allInterviews.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(255,106,0,0.12)', color: '#FF6A00' }}>
                    {allInterviews.length}
                  </span>
                )}
              </h2>
              <button onClick={fetchAllInterviews} className="p-1.5 rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer" title="Refresh">
                <RefreshCw size={13} className={`text-gray-500 ${listLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading interviews...
              </div>
            ) : allInterviews.length === 0 ? (
              <div className="text-center py-14">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,106,0,0.06)', border: '1px solid rgba(255,106,0,0.12)' }}>
                  <CalendarDays size={20} className="text-orange-500/40" />
                </div>
                <p className="text-gray-500 text-sm font-semibold">No interviews scheduled yet</p>
                <p className="text-gray-700 text-xs mt-1">Look up an application ID to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allInterviews.map(iv => {
                  const ModeIcon = modeIcons[iv.mode] || Video;
                  const modeColor = modeColors[iv.mode] || '#FF6A00';
                  const jobData = iv.jobId;

                  return (
                    <div
                      key={iv._id}
                      className="group relative rounded-xl p-4 transition-all hover:border-[#3A3A3A] cursor-default"
                      style={{ background: '#141414', border: '1px solid #252525' }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Mode Icon */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${modeColor}18`, border: `1px solid ${modeColor}30` }}>
                          <ModeIcon size={14} style={{ color: modeColor }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Candidate + Job */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <p className="text-sm font-bold text-white truncate">{iv.candidateName || 'Candidate'}</p>
                              <p className="text-[10px] text-gray-500 truncate">{iv.candidateEmail}</p>
                            </div>
                            <StatusBadge status={iv.status} />
                          </div>

                          {/* Job */}
                          {jobData && (
                            <p className="text-xs text-gray-400 mb-2">
                              <span className="text-orange-500 font-semibold">{jobData.title}</span>
                              {jobData.company && <span className="text-gray-600"> · {jobData.company}</span>}
                            </p>
                          )}

                          {/* Date / Time / Mode */}
                          <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                            {iv.interviewDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={9} />
                                {new Date(iv.interviewDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {iv.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={9} />
                                {iv.startTime}{iv.endTime ? ` – ${iv.endTime}` : ''}
                              </span>
                            )}
                            <span className="flex items-center gap-1" style={{ color: modeColor }}>
                              <ModeIcon size={9} /> {iv.mode}
                            </span>
                          </div>

                          {/* Meeting Link */}
                          {iv.meetingLink && (
                            <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-400 hover:text-blue-300 font-semibold">
                              <Link2 size={9} /> Join Meeting <ExternalLink size={7} />
                            </a>
                          )}

                          {/* Notes */}
                          {iv.notes && (
                            <p className="text-[10px] text-gray-600 mt-2 italic truncate">"{iv.notes}"</p>
                          )}
                        </div>

                        {/* Actions */}
                        {iv.status === 'Scheduled' && (
                          <button
                            onClick={() => handleCancel(iv._id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all cursor-pointer hover:bg-red-500/10 flex-shrink-0"
                            title="Cancel interview"
                          >
                            <XCircle size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSchedule;
