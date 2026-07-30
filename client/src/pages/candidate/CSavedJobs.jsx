import React, { useState, useEffect } from 'react';
import { Bookmark, MapPin, DollarSign, Building, Trash2, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/candidate/saved-jobs');
      let data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        setSavedJobs(data.map((j, idx) => ({
          id: j._id || j.id || idx + 1,
          jobTitle: j.title || j.jobTitle,
          company: j.company,
          location: j.location,
          salary: j.minSalary ? `₹${(j.minSalary/100000).toFixed(0)}L - ₹${(j.maxSalary/100000).toFixed(0)}L` : (j.salary || '₹25L - ₹40L'),
          postedDate: j.postedDate ? new Date(j.postedDate).toLocaleDateString() : 'Recent',
          tags: j.skills || ['React', 'TypeScript']
        })));
      } else {
        setSavedJobs(mockData.savedJobs.map((j, idx) => ({
          id: j._id || idx + 1,
          jobTitle: j.title,
          company: j.company,
          location: j.location,
          salary: `₹${(j.minSalary/100000).toFixed(0)}L - ₹${(j.maxSalary/100000).toFixed(0)}L`,
          postedDate: new Date(j.postedDate).toLocaleDateString(),
          tags: j.skills
        })));
      }
    } catch (err) {
      console.warn('Fallback savedJobs to mockData');
      setSavedJobs(mockData.savedJobs.map((j, idx) => ({
        id: j._id || idx + 1,
        jobTitle: j.title,
        company: j.company,
        location: j.location,
        salary: `₹${(j.minSalary/100000).toFixed(0)}L - ₹${(j.maxSalary/100000).toFixed(0)}L`,
        postedDate: new Date(j.postedDate).toLocaleDateString(),
        tags: j.skills
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

  const handleRemove = async (jobId) => {
    try {
      await api.post(`/candidate/save-job/${jobId}`);
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      showToast('Job removed from saved list');
    } catch (err) {
      showToast('Failed to remove job', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <div className="h-8 w-48 bg-white/5 animate-pulse rounded-xl mb-6"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>)}
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
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <Bookmark className="text-purple-500" size={28} />
        </div>
        <div>
          <h1 className="text-white font-bold text-2xl">Saved Jobs</h1>
          <p className="text-gray-400 text-sm">Jobs you have bookmarked for later</p>
        </div>
      </div>

      {savedJobs.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border border-[#2A2A2A] bg-[#161616]">
          <Bookmark className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Saved Jobs</h3>
          <p className="text-gray-400">You haven't saved any jobs yet. Start browsing to find your next opportunity.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedJobs.map(job => (
            <div key={job.id} className="rounded-2xl p-5 border border-[#2A2A2A] bg-[#161616] flex flex-col hover:border-gray-500 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#1E1E1E] rounded-xl">
                  <Building size={20} className="text-gray-300" />
                </div>
                <button 
                  onClick={() => handleRemove(job.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-2"
                  title="Remove from saved"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-white font-bold text-lg mb-1">{job.jobTitle}</h3>
              <p className="text-gray-400 text-sm mb-4">{job.company}</p>

              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin size={16} className="text-gray-500" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <DollarSign size={16} className="text-gray-500" /> {job.salary}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {job.tags && job.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1E1E1E] text-gray-300 border border-[#2A2A2A]">
                    {tag}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => handleApply(job.id)}
                className="w-full bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all flex justify-center items-center gap-2"
              >
                Quick Apply <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CSavedJobs;
