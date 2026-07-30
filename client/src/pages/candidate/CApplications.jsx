import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, Clock, CheckCircle, XCircle, ChevronRight, X, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const statuses = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Applied': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Under Review': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Shortlisted': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Interview': return 'bg-[#FF6A00]/10 text-[#FF6A00] border-[#FF6A00]/20';
      case 'Selected': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/candidate/applications');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const normalized = response.data.map((app, idx) => ({
          id: app._id || app.id || idx + 1,
          jobTitle: app.jobTitle || app.title || 'Software Engineer',
          company: app.company || 'Tech Company',
          appliedDate: app.appliedDate || app.applied || '2025-07-10',
          matchScore: app.aiMatchScore || app.matchScore || 90,
          status: app.status || 'Applied',
          timeline: app.timeline || [{ status: 'Applied', date: '2025-07-10' }],
          notes: app.recruiterNotes || app.notes || '',
          location: app.location || 'Bangalore',
          salary: app.salary || '₹25L - ₹40L'
        }));
        setApplications(normalized);
      } else {
        setApplications(mockData.candidateApplications.map((app, idx) => ({
          id: app._id || idx + 1,
          jobTitle: app.jobTitle,
          company: app.company,
          appliedDate: app.appliedDate,
          matchScore: app.aiMatchScore,
          status: app.status,
          timeline: app.timeline.map(t => ({ status: t.stage, date: t.date })),
          notes: app.recruiterNotes || 'Application under evaluation by hiring manager.',
          location: app.location,
          salary: app.salary
        })));
      }
    } catch (err) {
      setApplications(mockData.candidateApplications.map((app, idx) => ({
        id: app._id || idx + 1,
        jobTitle: app.jobTitle,
        company: app.company,
        appliedDate: app.appliedDate,
        matchScore: app.aiMatchScore,
        status: app.status,
        timeline: app.timeline.map(t => ({ status: t.stage, date: t.date })),
        notes: app.recruiterNotes || 'Application under evaluation by hiring manager.',
        location: app.location,
        salary: app.salary
      })));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleWithdraw = async (id) => {
    try {
      await api.post(`/candidate/applications/${id}/withdraw`);
      setApplications(prev => prev.filter(app => app.id !== id));
      setSelectedApp(null);
      showToast('Application withdrawn successfully');
    } catch (err) {
      showToast('Failed to withdraw application', 'error');
    }
  };

  const filteredApps = filter === 'All' ? applications : applications.filter(app => app.status === filter);

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 w-24 bg-white/5 animate-pulse rounded-full flex-shrink-0"></div>)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl w-full"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-white font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/50' : 'bg-green-500/20 border-green-500/50'}`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Briefcase className="text-blue-500" size={28} />
        </div>
        <div>
          <h1 className="text-white font-bold text-2xl">My Applications</h1>
          <p className="text-gray-400 text-sm">Track your job applications and their statuses</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === status 
                ? 'bg-[#FF6A00] text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredApps.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border border-[#2A2A2A] bg-[#161616]">
          <Briefcase className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Applications Found</h3>
          <p className="text-gray-400">You haven't applied to any jobs with this status yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map(app => (
            <div 
              key={app.id} 
              onClick={() => setSelectedApp(app)}
              className="rounded-2xl p-5 border border-[#2A2A2A] bg-[#161616] cursor-pointer hover:border-[#FF6A00]/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-bold text-lg">{app.jobTitle}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <div className="text-gray-400 text-sm">{app.company}</div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="hidden md:flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Applied</span>
                  <span className="text-gray-300 flex items-center gap-1"><Calendar size={14} /> {app.appliedDate}</span>
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">AI Match</span>
                  <span className="text-[#FF6A00] font-bold">{app.matchScore}%</span>
                </div>
                <ChevronRight className="text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-[#2A2A2A]">
              <h2 className="text-white font-bold text-xl">Application Details</h2>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Header Info */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedApp.jobTitle}</h3>
                <p className="text-lg text-gray-400 mb-4">{selectedApp.company}</p>
                <div className="flex flex-wrap gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedApp.status)}`}>
                    Status: {selectedApp.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20">
                    AI Match: {selectedApp.matchScore}%
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4">Application Timeline</h4>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                  {selectedApp.timeline.map((step, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-[#161616] bg-[#FF6A00] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] bg-[#1E1E1E] p-3 rounded-xl border border-[#2A2A2A]">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-bold text-white text-sm">{step.status}</h5>
                          <span className="text-xs text-gray-500">{step.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recruiter Notes */}
              {selectedApp.notes && (
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Recruiter Notes</h4>
                  <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 text-sm text-gray-300">
                    {selectedApp.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#2A2A2A] bg-[#1E1E1E] flex justify-end gap-3">
              <button 
                onClick={() => setSelectedApp(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => handleWithdraw(selectedApp.id)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              >
                Withdraw Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CApplications;
