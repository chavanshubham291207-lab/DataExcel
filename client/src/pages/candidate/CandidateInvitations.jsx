import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Building2, Calendar, Briefcase, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../../utils/api';

const CandidateInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invitations/candidate');
      if (res.data && res.data.data) {
        setInvitations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch candidate invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, status) => {
    setActionLoadingId(id);
    try {
      const res = await api.patch(`/invitations/${id}/respond`, { status });
      if (res.data && res.data.success) {
        setInvitations(prev =>
          prev.map(inv => (inv._id === id ? { ...inv, status } : inv))
        );
      }
    } catch (err) {
      console.error(`Error updating invitation status to ${status}:`, err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <Mail size={22} />
            </div>
            My Recruitment Invitations
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            View in-app recruitment applications and interview invitations received directly from hiring managers.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck size={14} /> In-App Platform Verified
        </div>
      </div>

      {/* Invitations List / Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 p-8 space-y-3">
          <Sparkles size={36} className="text-orange-400 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Invitations Yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            When recruiters review your profile and send recruitment invitations via VoiceGenie or hiring tools, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invitations.map((inv) => {
            const isPending = inv.status === 'Pending';
            const isAccepted = inv.status === 'Accepted';
            const isRejected = inv.status === 'Rejected';

            return (
              <div
                key={inv._id}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all space-y-4 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{inv.jobTitle || 'Software Developer'}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isAccepted
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isRejected
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-orange-400" />
                        <span className="text-gray-200 font-medium">{inv.companyName || inv.recruiter?.companyName || 'Apex AI Systems'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={14} className="text-gray-500" />
                        <span>Recruiter: {inv.recruiter?.name || 'Hiring Manager'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-500" />
                        <span>Received: {new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(inv._id, 'Accepted')}
                        disabled={actionLoadingId === inv._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        <Check size={14} /> Accept Invitation
                      </button>
                      <button
                        onClick={() => handleRespond(inv._id, 'Rejected')}
                        disabled={actionLoadingId === inv._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  )}

                  {!isPending && (
                    <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                      {isAccepted && <Check size={16} className="text-emerald-400" />}
                      {isRejected && <X size={16} className="text-red-400" />}
                      Status: <strong className="text-white">{inv.status}</strong>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 leading-relaxed">
                  <p className="font-semibold text-gray-400 mb-1">Message from Recruiter:</p>
                  "{inv.message}"
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateInvitations;
