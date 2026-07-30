import React, { useState, useEffect } from 'react';
import { Briefcase, Bookmark, Calendar, Award, Zap, ChevronRight, Clock, Star, MapPin, DollarSign, Search, User } from 'lucide-react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const CDashboard = () => {
  const [stats, setStats] = useState({
    appliedJobs: 18,
    savedJobs: 34,
    interviewInvites: 5,
    resumeScore: 91,
    aiMatchScore: 94,
    profileCompletion: 96,
    profileViews: 287,
    recruiterSearches: 142,
    resumeDownloads: 58
  });
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        try {
          const statsRes = await api.get('/candidate/dashboard-stats');
          if (statsRes.data && statsRes.data.data) {
            const d = statsRes.data.data;
            setStats(prev => ({
              ...prev,
              appliedJobs: d.totalApplied,
              savedJobs: d.savedJobs,
              interviewInvites: d.interviewInvites,
              resumeScore: d.atsScore || prev.resumeScore,
              profileCompletion: d.profileCompleteness || prev.profileCompletion
            }));
          }
        } catch (e) {
          console.warn("Stats API failed, using defaults");
        }

        try {
          const jobsRes = await api.get('/candidate/recommended-jobs');
          if (jobsRes.data && jobsRes.data.length > 0) {
            setRecommendedJobs(jobsRes.data.slice(0, 4));
          } else {
            setRecommendedJobs([
              { _id: '1', title: 'Senior Full Stack Engineer', company: 'Google', location: 'Bangalore', salary: '₹45L - ₹65L', match: 94 },
              { _id: '2', title: 'React Tech Lead', company: 'Microsoft', location: 'Hyderabad', salary: '₹40L - ₹55L', match: 91 },
              { _id: '3', title: 'Full Stack Developer', company: 'Adobe', location: 'Noida', salary: '₹30L - ₹45L', match: 87 }
            ]);
          }
        } catch (e) {
          console.warn("Jobs API failed, using defaults");
        }

        setActivities([
          { id: 1, text: 'Recruiter at Google viewed your profile', time: '1 hour ago', type: 'view' },
          { id: 2, text: 'Interview scheduled with Microsoft (Tech Round 1)', time: '3 hours ago', type: 'interview' },
          { id: 3, text: 'Resume downloaded by Swiggy', time: '1 day ago', type: 'download' },
          { id: 4, text: 'Shortlisted for Senior Full Stack Engineer at Meta', time: '2 days ago', type: 'shortlist' },
        ]);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getCandidateUser = () => {
    try {
      const val = localStorage.getItem('candidateUser');
      if (!val || val === 'undefined' || val === 'null') return { name: 'Arjun Mehta', role: 'Full Stack Developer' };
      return JSON.parse(val);
    } catch {
      return { name: 'Arjun Mehta', role: 'Full Stack Developer' };
    }
  };
  const user = getCandidateUser();

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-4 hover:border-[#FF6A00]/50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}1A` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div>
        <h4 className="text-2xl font-bold text-white mb-0.5">{value}</h4>
        <p className="text-gray-400 text-xs font-medium">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 bg-[#090909] min-h-screen text-white">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00] opacity-5 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name}! 👋</h1>
            <p className="text-gray-400 text-sm">{user.role}</p>
            
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Profile Completion</span>
                <span className="text-[#FF6A00] font-bold">{stats.profileCompletion}%</span>
              </div>
              <div className="w-full bg-[#1E1E1E] rounded-full h-2">
                <div className="bg-[#FF6A00] h-2 rounded-full" style={{ width: `${stats.profileCompletion}%`, boxShadow: '0 0 10px rgba(255,106,0,0.5)' }}></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2.5 mt-6">
            <button onClick={() => navigate('/candidate/jobs')} className="w-full bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2" style={{ boxShadow: '0 0 20px rgba(255,106,0,0.3)' }}>
              <Search className="w-4 h-4" /> Find Jobs
            </button>
            <button onClick={() => navigate('/candidate/profile')} className="w-full bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm transition-all flex items-center justify-center gap-2">
              <User className="w-4 h-4" /> Update Profile
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Applied Jobs" value={stats.appliedJobs} color="#3B82F6" />
          <StatCard icon={Bookmark} label="Saved Jobs" value={stats.savedJobs} color="#F59E0B" />
          <StatCard icon={Calendar} label="Interviews" value={stats.interviewInvites} color="#10B981" />
          <StatCard icon={Award} label="Resume Score" value={`${stats.resumeScore}%`} color="#FF6A00" />
          <StatCard icon={Zap} label="AI Match Score" value={`${stats.aiMatchScore}%`} color="#8B5CF6" />
          <StatCard icon={User} label="Profile Views" value={stats.profileViews} color="#EC4899" />
          <StatCard icon={Search} label="Searches" value={stats.recruiterSearches} color="#06B6D4" />
          <StatCard icon={Award} label="Downloads" value={stats.resumeDownloads} color="#14B8A6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Jobs */}
        <div className="lg:col-span-2 bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FF6A00]" /> AI Recommended Jobs
            </h2>
            <button onClick={() => navigate('/candidate/jobs')} className="text-gray-400 hover:text-white text-sm flex items-center transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white/5 h-24 rounded-xl"></div>)
            ) : recommendedJobs.length > 0 ? (
              recommendedJobs.map(job => (
                <div key={job._id} className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-[#FF6A00]/50 transition-colors group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-white group-hover:text-[#FF6A00] transition-colors">{job.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF6A00]/10 text-[#FF6A00] flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#FF6A00]" /> {job.match}% Match
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl transition-colors">
                      <Bookmark className="w-4 h-4 text-gray-300" />
                    </button>
                    <button className="flex-1 md:flex-none bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all shadow-[0_0_15px_rgba(255,106,0,0.2)]">
                      Quick Apply
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recommendations yet. Update your profile to get matched!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Recent Activity
          </h2>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#2A2A2A] before:to-transparent">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white/5 h-16 rounded-xl mb-4 ml-6"></div>)
            ) : activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#161616] bg-[#2A2A2A] group-[.is-active]:bg-[#FF6A00] text-white shadow shrink-0 z-10 mr-4 md:mx-auto">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A]">
                    <p className="text-sm text-gray-200 mb-1">{activity.text}</p>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 relative z-10 bg-[#161616]">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDashboard;
