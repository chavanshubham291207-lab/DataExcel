import React, { useState, useEffect } from 'react';
import { Send, Building2, Calendar, User, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const SentInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invitations/recruiter');
      if (res.data && res.data.data) {
        setInvitations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recruiter invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = invitations.filter(i => i.status === 'Pending').length;
  const acceptedCount = invitations.filter(i => i.status === 'Accepted').length;
  const rejectedCount = invitations.filter(i => i.status === 'Rejected').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <Send size={22} />
            </div>
            Sent Recruitment Invitations
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track in-app recruitment invitations issued to candidates via VoiceGenie and recruitment tools.
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
            Pending: {pendingCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            Accepted: {acceptedCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            Declined: {rejectedCount}
          </div>
        </div>
      </div>

      {/* Invitations Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10 p-8 space-y-3">
          <Send size={36} className="text-orange-400 mx-auto opacity-60" />
          <h3 className="text-sm font-semibold text-white">No Invitations Sent Yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Use VoiceGenie (*"Send application to these top 5 candidates"*) or recruitment tools to issue in-app candidate invitations.
          </p>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Job Title</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Sent Date</th>
                  <th className="px-6 py-3.5">Message Excerpt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invitations.map((inv) => {
                  const isAccepted = inv.status === 'Accepted';
                  const isRejected = inv.status === 'Rejected';

                  return (
                    <tr key={inv._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold text-orange-400">
                          {inv.candidateName ? inv.candidateName.slice(0, 2).toUpperCase() : 'CA'}
                        </div>
                        <div>
                          <div>{inv.candidateName}</div>
                          <div className="text-[10px] text-gray-500 font-normal">{inv.candidateEmail || 'Candidate'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-200">{inv.jobTitle}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isAccepted
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : isRejected
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          }`}
                        >
                          {isAccepted && <CheckCircle2 size={12} />}
                          {isRejected && <XCircle size={12} />}
                          {!isAccepted && !isRejected && <AlertCircle size={12} />}
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{inv.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentInvitations;
