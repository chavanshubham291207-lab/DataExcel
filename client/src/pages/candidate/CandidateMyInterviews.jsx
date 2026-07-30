import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Video, Phone, MapPin, Users, FileText,
  ExternalLink, Link2, Building2, Loader2, RefreshCw,
  CalendarDays, CheckCircle2, XCircle, AlertCircle, Briefcase
} from 'lucide-react';
import api from '../../utils/api';

// ─── Style constants ──────────────────────────────────────────
const card = {
  background: 'rgba(22,22,22,0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid #2A2A2A',
  borderRadius: '16px',
};

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

const statusConfig = {
  Scheduled: { bg: 'rgba(0,122,255,0.12)', color: '#007AFF', border: 'rgba(0,122,255,0.25)', icon: CalendarDays },
  Rescheduled: { bg: 'rgba(255,193,7,0.12)', color: '#FFC107', border: 'rgba(255,193,7,0.25)', icon: RefreshCw },
  Completed: { bg: 'rgba(0,200,83,0.12)', color: '#00C853', border: 'rgba(0,200,83,0.25)', icon: CheckCircle2 },
  Cancelled: { bg: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: 'rgba(255,59,48,0.25)', icon: XCircle },
};

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = statusConfig[status] || statusConfig.Scheduled;
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <Icon size={9} /> {status}
    </span>
  );
};

// ─── Empty State ──────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,106,0,0.06)', border: '1px solid rgba(255,106,0,0.12)' }}>
      <CalendarDays size={28} className="text-orange-500/40" />
    </div>
    <h3 className="text-white font-bold text-base mb-1">No interviews yet</h3>
    <p className="text-gray-500 text-sm max-w-xs">
      When a recruiter schedules an interview for your application, it will appear here.
    </p>
    <p className="text-gray-700 text-xs mt-3">Keep applying and stay active on your profile!</p>
  </div>
);

// ─── Interview Card ────────────────────────────────────────────
const InterviewCard = ({ iv }) => {
  const ModeIcon = modeIcons[iv.mode] || Video;
  const modeColor = modeColors[iv.mode] || '#FF6A00';
  const job = iv.jobId;

  // Format date
  const formattedDate = iv.interviewDate
    ? new Date(iv.interviewDate + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  // Countdown
  const getDaysUntil = () => {
    if (!iv.interviewDate || iv.status !== 'Scheduled') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ivDate = new Date(iv.interviewDate + 'T00:00:00');
    const diff = Math.round((ivDate - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return null;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const countdown = getDaysUntil();

  return (
    <div
      className="relative rounded-2xl p-5 transition-all hover:border-[#3A3A3A] group"
      style={{ background: '#141414', border: '1px solid #252525' }}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${modeColor}18`, border: `1px solid ${modeColor}30` }}>
            <ModeIcon size={16} style={{ color: modeColor }} />
          </div>
          <div>
            {job ? (
              <>
                <p className="text-base font-bold text-white leading-tight">{job.title}</p>
                <p className="text-xs text-gray-400">{job.company}{job.department ? ` · ${job.department}` : ''}</p>
              </>
            ) : (
              <p className="text-base font-bold text-white">Interview</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={iv.status} />
          {countdown && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,106,0,0.1)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.2)' }}>
              {countdown}
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Date */}
        {formattedDate && (
          <div className="col-span-2 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <Calendar size={13} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Interview Date</p>
              <p className="text-xs font-semibold text-white">{formattedDate}</p>
            </div>
          </div>
        )}

        {/* Time */}
        {iv.startTime && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <Clock size={13} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Time</p>
              <p className="text-xs font-semibold text-white">{iv.startTime}{iv.endTime ? ` – ${iv.endTime}` : ''}</p>
            </div>
          </div>
        )}

        {/* Mode */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <ModeIcon size={13} style={{ color: modeColor }} className="flex-shrink-0" />
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Format</p>
            <p className="text-xs font-semibold" style={{ color: modeColor }}>{iv.mode}</p>
          </div>
        </div>

        {/* Location if in-person */}
        {job?.location && iv.mode === 'In-Person' && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <MapPin size={13} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">Location</p>
              <p className="text-xs font-semibold text-white truncate">{job.location}</p>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Link */}
      {iv.meetingLink && iv.status !== 'Cancelled' && (
        <a
          href={iv.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all mb-3 hover:opacity-90"
          style={{ background: `${modeColor}22`, border: `1px solid ${modeColor}40`, color: modeColor }}
        >
          <Link2 size={12} /> Join {iv.mode === 'Video Call' ? 'Meeting' : 'Interview'} <ExternalLink size={10} />
        </a>
      )}

      {/* Notes */}
      {iv.notes && (
        <div className="px-3.5 py-2.5 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Recruiter Notes</p>
          <p className="text-xs text-gray-400 italic">{iv.notes}</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const CandidateMyInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/interview-schedule/candidate/my-interviews');
      setInterviews(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const filters = ['All', 'Scheduled', 'Rescheduled', 'Completed', 'Cancelled'];

  const filteredInterviews = filter === 'All'
    ? interviews
    : interviews.filter(iv => iv.status === filter);

  const upcomingCount = interviews.filter(iv => iv.status === 'Scheduled' || iv.status === 'Rescheduled').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 20px rgba(255,106,0,0.4)' }}>
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">My Interviews</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {upcomingCount > 0 ? `${upcomingCount} upcoming interview${upcomingCount > 1 ? 's' : ''}` : 'Track your scheduled interviews'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchInterviews}
          className="p-2 rounded-xl hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Row */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: interviews.length, color: '#FF6A00' },
            { label: 'Upcoming', value: interviews.filter(iv => iv.status === 'Scheduled').length, color: '#007AFF' },
            { label: 'Completed', value: interviews.filter(iv => iv.status === 'Completed').length, color: '#00C853' },
            { label: 'Cancelled', value: interviews.filter(iv => iv.status === 'Cancelled').length, color: '#FF3B30' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '12px 16px' }}>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={
              filter === f
                ? { background: 'rgba(255,106,0,0.15)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.3)' }
                : { background: '#141414', color: '#555', border: '1px solid #252525' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin text-orange-500" />
          <span className="text-sm">Loading interviews...</span>
        </div>
      ) : filteredInterviews.length === 0 ? (
        filter === 'All' ? <EmptyState /> : (
          <div className="text-center py-12 text-gray-500 text-sm">
            No {filter.toLowerCase()} interviews.
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredInterviews.map(iv => (
            <InterviewCard key={iv._id} iv={iv} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateMyInterviews;
