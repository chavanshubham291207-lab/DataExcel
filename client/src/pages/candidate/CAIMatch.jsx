import React, { useState, useEffect } from 'react';
import { Brain, Briefcase, MapPin, DollarSign, Star, CheckCircle, XCircle, ArrowRight, Bookmark, Building, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CAIMatch = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/candidate/ai-recommendations');
      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        setRecommendations(data.map((j, idx) => ({
          id: j._id || j.id || idx + 1,
          jobTitle: j.title || j.jobTitle,
          company: j.company,
          location: j.location,
          salary: j.minSalary ? `₹${(j.minSalary/100000).toFixed(0)}L - ₹${(j.maxSalary/100000).toFixed(0)}L` : (j.salary || '₹30L - ₹50L'),
          matchScore: j.aiMatchScore || j.matchScore || 92,
          skillScore: j.matchBreakdown?.skillScore || j.skillScore || 94,
          experienceScore: j.matchBreakdown?.experienceScore || j.experienceScore || 90,
          educationScore: j.matchBreakdown?.educationScore || j.educationScore || 95,
          matchingSkills: j.matchingSkills || j.skills?.slice(0, 3) || ['React', 'Node.js'],
          missingSkills: j.missingSkills || ['Kubernetes'],
          explanation: j.matchExplanation || j.explanation || `Your background aligns with this ${j.title || 'engineering'} role.`,
          isSaved: j.isSaved || false
        })));
      } else {
        setRecommendations(mockData.aiRecommendations.map((j, idx) => ({
          id: j._id || idx + 1,
          jobTitle: j.title,
          company: j.company,
          location: j.location,
          salary: `₹${(j.minSalary/100000).toFixed(0)}L - ₹${(j.maxSalary/100000).toFixed(0)}L`,
          matchScore: j.aiMatchScore,
          skillScore: j.matchBreakdown.skillScore,
          experienceScore: j.matchBreakdown.experienceScore,
          educationScore: j.matchBreakdown.educationScore,
          matchingSkills: j.matchingSkills,
          missingSkills: j.missingSkills,
          explanation: j.matchExplanation,
          isSaved: j.isSaved
        })));
      }
    } catch (err) {
      console.warn('AI Recommendations API fallback to mockData');
      setRecommendations(mockData.aiRecommendations.map((j, idx) => ({
        id: j._id || idx + 1,
        jobTitle: j.title,
        company: j.company,
        location: j.location,
        salary: `₹${(j.minSalary/100000).toFixed(0)}L - ₹${(j.maxSalary/100000).toFixed(0)}L`,
        matchScore: j.aiMatchScore,
        skillScore: j.matchBreakdown.skillScore,
        experienceScore: j.matchBreakdown.experienceScore,
        educationScore: j.matchBreakdown.educationScore,
        matchingSkills: j.matchingSkills,
        missingSkills: j.missingSkills,
        explanation: j.matchExplanation,
        isSaved: j.isSaved
      })));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleApply = async (jobId) => {
    try {
      await api.post(`/candidate/apply/${jobId}`);
      showToast('Successfully applied for the job!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply', 'error');
    }
  };

  const handleToggleSave = async (jobId) => {
    try {
      await api.post(`/candidate/save-job/${jobId}`);
      setRecommendations(prev => prev.map(job => 
        job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
      ));
      showToast('Job save status updated');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save job', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <div className="h-8 w-64 bg-white/5 animate-pulse rounded-xl mb-8"></div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white/5 rounded-2xl p-6 h-[400px]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-white font-medium flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-500/20 border-red-500/50' : 'bg-green-500/20 border-green-500/50'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#FF6A00]/10 rounded-xl">
          <Brain className="text-[#FF6A00]" size={28} />
        </div>
        <div>
          <h1 className="text-white font-bold text-2xl">AI Match Recommendations</h1>
          <p className="text-gray-400 text-sm">Jobs perfectly aligned with your skills and experience</p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border border-[#2A2A2A] bg-[#161616]">
          <Brain className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No AI Matches Found</h3>
          <p className="text-gray-400">Complete your profile to get personalized AI job recommendations.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {recommendations.map((job) => (
            <div key={job.id} className="rounded-2xl p-6 border border-[#2A2A2A] bg-[#161616] flex flex-col hover:border-[#FF6A00]/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-xl mb-1">{job.jobTitle}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Building size={14} /> <span>{job.company}</span>
                    <span>•</span>
                    <MapPin size={14} /> <span>{job.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-3 py-1 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 flex items-center gap-1">
                    <Star size={14} className="text-[#FF6A00] fill-[#FF6A00]" />
                    <span className="text-[#FF6A00] font-bold">{job.matchScore}% Match</span>
                  </div>
                  <button onClick={() => handleToggleSave(job.id)} className="text-gray-400 hover:text-white transition-colors">
                    <Bookmark size={20} fill={job.isSaved ? '#fff' : 'none'} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#1E1E1E] rounded-xl p-3 text-center">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Skills</div>
                  <div className="text-white font-bold text-lg">{job.skillScore}%</div>
                </div>
                <div className="bg-[#1E1E1E] rounded-xl p-3 text-center">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Experience</div>
                  <div className="text-white font-bold text-lg">{job.experienceScore}%</div>
                </div>
                <div className="bg-[#1E1E1E] rounded-xl p-3 text-center">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Education</div>
                  <div className="text-white font-bold text-lg">{job.educationScore}%</div>
                </div>
              </div>

              <div className="mb-6 space-y-4 flex-grow">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Matching Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {job.matchingSkills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                        <CheckCircle size={12} /> {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {job.missingSkills && job.missingSkills.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Missing Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {job.missingSkills.map(skill => (
                        <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                          <XCircle size={12} /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2A2A2A]">
                  <div className="flex items-center gap-2 mb-2 text-[#FF6A00] font-semibold text-sm">
                    <Brain size={16} /> AI Insight
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{job.explanation}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#2A2A2A]">
                <button onClick={() => handleApply(job.id)} className="flex-1 bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all flex justify-center items-center gap-2">
                  Apply Now <ArrowRight size={16} />
                </button>
                <div className="px-4 py-2.5 bg-[#1E1E1E] rounded-xl text-gray-300 font-medium text-sm flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-400" /> {job.salary}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CAIMatch;
