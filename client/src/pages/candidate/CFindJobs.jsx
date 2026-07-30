import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Filter, DollarSign, Clock, Bookmark, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CFindJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  const [filters, setFilters] = useState({ search: '', location: '', jobType: '' });
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.jobType) params.append('jobType', filters.jobType);
      
      try {
        const res = await api.get(`/candidate/jobs?${params.toString()}`);
        let jobList = res.data;
        if (!Array.isArray(jobList) || jobList.length === 0) {
          jobList = mockData.jobs;
        }
        if (filters.search) {
          jobList = jobList.filter(j => j.title.toLowerCase().includes(filters.search.toLowerCase()) || j.company.toLowerCase().includes(filters.search.toLowerCase()));
        }
        setJobs(jobList);
      } catch(e) {
        console.warn("Jobs API failed, using mock data");
        let jobList = mockData.jobs;
        if (filters.search) {
          jobList = jobList.filter(j => j.title.toLowerCase().includes(filters.search.toLowerCase()) || j.company.toLowerCase().includes(filters.search.toLowerCase()));
        }
        setJobs(jobList);
      }
    } catch (err) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApply = async (jobId) => {
    try {
      await api.post(`/candidate/jobs/${jobId}/apply`);
      showToast('Successfully applied to job!');
      if(selectedJob) setSelectedJob(null);
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to apply to job.', 'error');
      if(selectedJob) setSelectedJob(null);
    }
  };

  const handleSave = async (jobId) => {
    try {
      await api.post(`/candidate/jobs/${jobId}/save`);
      showToast('Job saved to your list!');
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to save job.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 bg-[#090909] min-h-screen text-white relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg ${toast.type === 'success' ? 'bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981]' : 'bg-red-500/20 border border-red-500/50 text-red-400'}`}>
          <CheckCircle2 className="w-5 h-5" /> {toast.msg}
        </div>
      )}

      {/* Header & Search */}
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-6">Find Your Next Opportunity</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Job title, keywords, or company" 
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl pl-12 pr-4 py-3 focus:border-[#FF6A00] focus:outline-none transition-colors"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="md:w-64 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Location" 
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl pl-12 pr-4 py-3 focus:border-[#FF6A00] focus:outline-none transition-colors"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
          <select 
            className="md:w-48 bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:border-[#FF6A00] focus:outline-none appearance-none cursor-pointer"
            value={filters.jobType}
            onChange={(e) => setFilters({...filters, jobType: e.target.value})}
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-gray-400 text-sm px-2">
          <span>Showing {jobs.length} jobs</span>
          <button className="flex items-center gap-2 hover:text-white transition-colors"><Filter className="w-4 h-4"/> Sort by: Relevant</button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-[#161616] h-36 rounded-2xl border border-[#2A2A2A]"></div>)}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div key={job._id} className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#FF6A00]/50 transition-colors group cursor-pointer" onClick={() => setSelectedJob(job)}>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-[#FF6A00] transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-2 mb-4">
                      <span className="flex items-center gap-1 text-gray-300 font-medium"><Briefcase className="w-4 h-4 text-[#FF6A00]" /> {job.company}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.posted}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.skills?.map(skill => (
                         <span key={skill} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1E1E1E] text-gray-300 border border-[#2A2A2A]">{skill}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleSave(job._id)} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl transition-colors">
                      <Bookmark className="w-5 h-5 text-gray-300" />
                    </button>
                    <button onClick={() => handleApply(job._id)} className="flex-1 md:flex-none bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-6 py-2.5 font-semibold text-sm transition-all" style={{ boxShadow: '0 0 15px rgba(255,106,0,0.2)' }}>
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-12 text-center">
            <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No jobs found</h3>
            <p className="text-gray-400">Try adjusting your search or filters to find more opportunities.</p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
                <p className="text-[#FF6A00] font-medium mt-1">{selectedJob.company}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-white p-2">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
               <div className="flex flex-wrap gap-4 text-sm text-gray-300 bg-[#1E1E1E] p-4 rounded-xl border border-[#2A2A2A]">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /> {selectedJob.location}</span>
                  <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-500" /> {selectedJob.salary}</span>
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-500" /> {selectedJob.type}</span>
               </div>
               
               <div>
                 <h3 className="text-lg font-bold mb-3">Job Description</h3>
                 <p className="text-gray-300 leading-relaxed">{selectedJob.description}</p>
               </div>

               <div>
                 <h3 className="text-lg font-bold mb-3">Required Skills</h3>
                 <div className="flex flex-wrap gap-2">
                    {selectedJob.skills?.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg text-sm">{skill}</span>
                    ))}
                 </div>
               </div>
            </div>

            <div className="p-6 border-t border-[#2A2A2A] bg-[#161616] rounded-b-2xl flex justify-end gap-4 mt-auto">
               <button onClick={() => handleSave(selectedJob._id)} className="bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl px-6 py-2.5 font-semibold transition-colors flex items-center gap-2">
                 <Bookmark className="w-4 h-4" /> Save Job
               </button>
               <button onClick={() => handleApply(selectedJob._id)} className="bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-8 py-2.5 font-bold transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)]">
                 Apply Now
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CFindJobs;
