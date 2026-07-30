import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, User, Users, Info, ExternalLink, Lightbulb } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CInterviewCenter = () => {
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/candidate/interviews');
      let data = response.data?.interviews || response.data;
      if (Array.isArray(data) && data.length > 0) {
        setInterviews(data.map(i => ({
          _id: i._id || i.id,
          jobTitle: i.jobTitle || 'Software Engineer',
          company: i.company || 'TechCorp',
          recruiterName: i.recruiterName || i.company || 'Recruiter',
          date: i.scheduledAt || i.date || new Date().toISOString(),
          status: i.status || 'Scheduled',
          meetingLink: i.meetingLink || '',
          panelists: i.panelists || ['Tech Lead']
        })));
      } else {
        setInterviews(mockData.candidateInterviews.map(i => ({
          _id: i._id,
          jobTitle: i.jobTitle,
          company: i.company,
          recruiterName: i.company,
          date: i.scheduledAt,
          status: i.status,
          meetingLink: i.meetingLink,
          panelists: i.panelists
        })));
      }
      setError('');
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setInterviews(mockData.candidateInterviews.map(i => ({
        _id: i._id,
        jobTitle: i.jobTitle,
        company: i.company,
        recruiterName: i.company,
        date: i.scheduledAt,
        status: i.status,
        meetingLink: i.meetingLink,
        panelists: i.panelists
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const isPast = new Date(interview.date) < new Date();
    if (filter === 'upcoming') return !isPast && interview.status !== 'Cancelled';
    if (filter === 'past') return isPast || interview.status === 'Completed' || interview.status === 'Cancelled';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled': return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Scheduled</span>;
      case 'Completed': return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'Cancelled': return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Cancelled</span>;
      case 'Rescheduled': return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Rescheduled</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Center</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your upcoming interviews and prepare effectively.</p>
        </div>
        
        <div className="flex bg-[#161616] p-1 rounded-xl border border-[#2A2A2A]">
          {['upcoming', 'past', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === t 
                  ? 'bg-[#1E1E1E] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {filter} Interviews ({filteredInterviews.length})
          </p>

          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-white/5 rounded w-1/3"></div>
                  <div className="h-3 bg-white/5 rounded w-1/4"></div>
                  <div className="h-3 bg-white/5 rounded w-1/2 mt-4"></div>
                </div>
              </div>
            ))
          ) : filteredInterviews.length === 0 ? (
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#1E1E1E] rounded-full flex items-center justify-center mb-4">
                <Calendar size={24} className="text-gray-500" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No {filter} interviews</h3>
              <p className="text-gray-400 text-sm max-w-sm">
                You don't have any {filter} interviews scheduled at the moment. Keep applying to land your next opportunity!
              </p>
            </div>
          ) : (
            filteredInterviews.map((interview) => (
              <div key={interview._id} className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#3A3A3A] transition-colors">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#FF6A00]/10 rounded-xl flex items-center justify-center shrink-0">
                      <Video size={20} className="text-[#FF6A00]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-bold text-base">{interview.jobTitle}</h3>
                        {getStatusBadge(interview.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-500" />
                          <span>{formatDate(interview.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-500" />
                          <span>{formatTime(interview.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-500" />
                          <span>{interview.recruiterName}</span>
                        </div>
                      </div>

                      {interview.panelists && interview.panelists.length > 0 && (
                        <div className="mt-4 flex items-start gap-2">
                          <Users size={14} className="text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Panelists</span>
                            <div className="flex flex-wrap gap-2">
                              {interview.panelists.map((panelist, idx) => (
                                <span key={idx} className="bg-[#1E1E1E] text-gray-300 px-2 py-0.5 rounded text-xs">
                                  {panelist}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col justify-end gap-2 mt-4 md:mt-0 border-t border-[#2A2A2A] md:border-none pt-4 md:pt-0">
                    {interview.meetingLink && (interview.status === 'Scheduled' || interview.status === 'Rescheduled') && (
                      <a 
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                        style={{ boxShadow: '0 0 15px rgba(255,106,0,0.2)' }}
                      >
                        <ExternalLink size={16} />
                        Join Meeting
                      </a>
                    )}
                    <button className="bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl px-4 py-2 text-sm font-medium transition-all">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={20} className="text-[#F59E0B]" />
              <h2 className="text-white font-bold text-base">Preparation Tips</h2>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              AI-generated hints to help you ace your upcoming technical interviews based on your profile.
            </p>

            <div className="space-y-4">
              <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#2A2A2A]">
                <h4 className="text-white text-sm font-medium mb-1">System Design Focus</h4>
                <p className="text-gray-400 text-xs">For senior roles, brush up on scalability, microservices architecture, and load balancing concepts.</p>
              </div>
              
              <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#2A2A2A]">
                <h4 className="text-white text-sm font-medium mb-1">Behavioral Questions</h4>
                <p className="text-gray-400 text-xs">Prepare stories using the STAR method (Situation, Task, Action, Result) focusing on leadership and conflict resolution.</p>
              </div>
              
              <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#2A2A2A]">
                <h4 className="text-white text-sm font-medium mb-1">Tech Stack Prep</h4>
                <p className="text-gray-400 text-xs">Review React hooks lifecycle, state management patterns, and advanced JavaScript concepts (closures, event loop).</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#2A2A2A] flex items-start gap-2">
              <Info size={16} className="text-gray-500 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">Ensure you have a stable internet connection and test your camera/microphone 15 minutes before the interview.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CInterviewCenter;
