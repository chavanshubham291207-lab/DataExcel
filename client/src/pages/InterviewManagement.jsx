import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, FileText, XCircle, CheckCircle2, Pencil, X } from 'lucide-react';
import api from '../utils/api';

const StatusBadge = ({ status }) => {
  const map = {
    Scheduled: { bg: 'rgba(0,122,255,0.12)', color: '#007AFF', border: 'rgba(0,122,255,0.25)' },
    Rescheduled: { bg: 'rgba(255,193,7,0.12)', color: '#FFC107', border: 'rgba(255,193,7,0.25)' },
    Completed: { bg: 'rgba(0,200,83,0.12)', color: '#00C853', border: 'rgba(0,200,83,0.25)' },
    Cancelled: { bg: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: 'rgba(255,59,48,0.25)' },
  };
  const s = map[status] || map.Scheduled;
  return (
    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

const inputCls = "w-full bg-[#1E1E1E] border border-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00] transition-colors";
const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

const InterviewManagement = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDateTime, setNewDateTime] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [panelNotes, setPanelNotes] = useState('');
  const [decision, setDecision] = useState('Pending');

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interviews');
      setInterviews(res.data.data);
      if (selectedInterview) {
        const updated = res.data.data.find(i => i._id === selectedInterview._id);
        if (updated) setSelectedInterview(updated);
      }
    } catch (err) { console.error('Failed to load interviews:', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this interview?')) return;
    try { await api.put(`/interviews/${id}/cancel`); fetchInterviews(); setSelectedInterview(null); alert('Interview cancelled.'); }
    catch (err) { alert(err.message); }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try { await api.put(`/interviews/${selectedInterview._id}/reschedule`, { dateTime: newDateTime }); setShowReschedule(false); setNewDateTime(''); fetchInterviews(); alert('Rescheduled!'); }
    catch (err) { alert(err.message); }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/interviews/${selectedInterview._id}/feedback`, { feedback: feedbackText, notes: panelNotes, finalDecision: decision });
      setShowFeedback(false); setFeedbackText(''); setPanelNotes(''); setDecision('Pending'); fetchInterviews(); alert('Evaluation saved!');
    } catch (err) { alert(err.message); }
  };

  const getDaysInMonth = () => {
    const date = new Date(), year = date.getFullYear(), month = date.getMonth();
    const startDay = new Date(year, month, 1).getDay(), totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push({ day: null, dateStr: '' });
    for (let d = 1; d <= totalDays; d++) days.push({ day: d, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    return days;
  };

  const calendarDays = getDaysInMonth();
  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const getInterviewsForDate = (dateStr) => !dateStr ? [] : interviews.filter(i => i.status !== 'Cancelled' && new Date(i.dateTime).toISOString().split('T')[0] === dateStr);
  const upcomingInterviews = interviews.filter(i => i.status === 'Scheduled' || i.status === 'Rescheduled');

  return (
    <div className="p-6 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-5">
      {/* Calendar */}
      <div className="flex-1 rounded-2xl p-6 space-y-5" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Interview Schedule</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Monthly calendar overview</p>
          </div>
          <span className="text-xs font-semibold text-gray-400 px-3 py-1.5 rounded-xl" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
            {currentMonthLabel}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
            <div key={w} className="py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider text-center">{w}</div>
          ))}
          {calendarDays.map((item, idx) => {
            const dateInterviews = getInterviewsForDate(item.dateStr);
            const isToday = item.day && new Date().getDate() === item.day;
            return (
              <div key={idx} className="min-h-[70px] rounded-xl p-1.5 flex flex-col text-[10px]"
                style={{
                  background: isToday ? 'rgba(255,106,0,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isToday ? 'rgba(255,106,0,0.3)' : '#1F1F1F'}`,
                }}>
                <span className={`font-semibold leading-none ${isToday ? 'text-[#FF6A00]' : 'text-gray-600'}`}>{item.day}</span>
                <div className="space-y-0.5 mt-1">
                  {dateInterviews.map(i => (
                    <div key={i._id} onClick={() => setSelectedInterview(i)}
                      className="rounded px-1 py-0.5 text-[8px] truncate font-semibold cursor-pointer hover:scale-[1.02] transition-transform"
                      style={{ background: 'rgba(255,106,0,0.15)', color: '#FF6A00' }}
                      title={`${i.candidate.name} - ${i.job.title}`}>
                      {i.candidate.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-80 flex-shrink-0">
        {selectedInterview ? (
          <div className="rounded-2xl p-5 space-y-4 animate-slide-up" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white">Panel Evaluation</h3>
                <div className="mt-1.5"><StatusBadge status={selectedInterview.status} /></div>
              </div>
              <button onClick={() => setSelectedInterview(null)} className="text-gray-600 hover:text-white transition-colors cursor-pointer"><X size={15} /></button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Candidate', val: selectedInterview.candidate.name },
                { label: 'Position', val: selectedInterview.job.title },
                { label: 'Date & Time', val: new Date(selectedInterview.dateTime).toLocaleString(), icon: <Clock size={11} className="text-gray-600" /> },
              ].map(r => (
                <div key={r.label}>
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">{r.label}</div>
                  <div className="flex items-center gap-1 text-white font-medium">{r.icon}{r.val}</div>
                </div>
              ))}
              {selectedInterview.meetingLink && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">Meeting Link</div>
                  <a href={selectedInterview.meetingLink} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: '#FF6A00' }}>
                    <Video size={12} /> Join Panel Call
                  </a>
                </div>
              )}
              <div>
                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Panelists</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedInterview.panelists.map((p, i) => (
                    <span key={i} className="text-[10px] text-gray-400 px-2 py-0.5 rounded-lg" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {selectedInterview.status !== 'Completed' && selectedInterview.status !== 'Cancelled' && (
              <div className="flex gap-2 pt-3 border-t border-[#1F1F1F] flex-wrap">
                <button onClick={() => setShowFeedback(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer text-white transition-colors"
                  style={{ background: '#00C853' }}>
                  Submit Feedback
                </button>
                <button onClick={() => setShowReschedule(true)} title="Reschedule"
                  className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors text-gray-400"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A' }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleCancel(selectedInterview._id)} title="Cancel"
                  className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                  <XCircle size={14} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-5 space-y-4 flex flex-col max-h-[520px]" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <h3 className="text-sm font-bold text-white">Upcoming Panels</h3>
            <div className="overflow-y-auto space-y-2 flex-1 no-scrollbar">
              {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#1E1E1E' }} />) :
                upcomingInterviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-600">
                    <Calendar size={24} className="mb-2 opacity-40" />
                    No active panels scheduled.
                  </div>
                ) : upcomingInterviews.map(item => (
                  <div key={item._id} onClick={() => setSelectedInterview(item)}
                    className="p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between hover:bg-white/3"
                    style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                    <div>
                      <div className="text-xs font-semibold text-white">{item.candidate.name}</div>
                      <div className="text-[10px] text-gray-600">{item.job.title}</div>
                    </div>
                    <div className="text-[10px] font-semibold flex-shrink-0" style={{ color: '#FF6A00' }}>
                      {new Date(item.dateTime).toLocaleDateString()}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowReschedule(false)} />
          <form onSubmit={handleReschedule} className="relative z-10 w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: '#161616', border: '1px solid #2A2A2A', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
            <div>
              <h3 className="font-bold text-base text-white">Reschedule Meeting</h3>
              <p className="text-xs text-gray-500 mt-0.5">Set a new date and time for this interview.</p>
            </div>
            <div><label className={labelCls}>New Date & Time</label>
              <input type="datetime-local" required value={newDateTime} onChange={e => setNewDateTime(e.target.value)} className={inputCls} style={{ colorScheme: 'dark' }} /></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowReschedule(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-[#2A2A2A] hover:bg-white/5 cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: '#FF6A00' }}>Reschedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowFeedback(false)} />
          <form onSubmit={handleFeedback} className="relative z-10 w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: '#161616', border: '1px solid #2A2A2A', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
            <div>
              <h3 className="font-bold text-base text-white">Record Panel Evaluation</h3>
              <p className="text-xs text-gray-500 mt-0.5">Record candidate observations and finalize the hiring decision.</p>
            </div>
            <div><label className={labelCls}>Panel Feedback</label>
              <textarea required rows={3} value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                placeholder="Candidate demonstrated deep understanding of state machines..." className={`${inputCls} resize-none`} /></div>
            <div><label className={labelCls}>Internal Notes</label>
              <textarea rows={2} value={panelNotes} onChange={e => setPanelNotes(e.target.value)}
                placeholder="Suggested starting salary alignment..." className={`${inputCls} resize-none`} /></div>
            <div><label className={labelCls}>Hiring Decision</label>
              <select value={decision} onChange={e => setDecision(e.target.value)} className={inputCls} style={{ colorScheme: 'dark' }}>
                <option value="Pending">Pending Decision</option>
                <option value="Hire">Extend Offer (Hire)</option>
                <option value="Reject">Archive Candidate (Reject)</option>
              </select></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowFeedback(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-[#2A2A2A] hover:bg-white/5 cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: '#00C853' }}>Save Evaluation</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InterviewManagement;
