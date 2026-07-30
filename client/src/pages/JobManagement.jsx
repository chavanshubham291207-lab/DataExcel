import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Briefcase, MapPin, Calendar, DollarSign, Plus,
  Trash2, Copy, Pencil, Check, MinusCircle, PlusCircle, X
} from 'lucide-react';
import api from '../utils/api';

const StatusBadge = ({ status }) => {
  const map = {
    Published: { bg: 'rgba(0,200,83,0.12)', color: '#00C853', border: 'rgba(0,200,83,0.25)' },
    Draft: { bg: 'rgba(255,255,255,0.05)', color: '#888', border: 'rgba(255,255,255,0.08)' },
    Closed: { bg: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: 'rgba(255,59,48,0.25)' },
    Archived: { bg: 'rgba(255,193,7,0.12)', color: '#FFC107', border: 'rgba(255,193,7,0.25)' },
  };
  const s = map[status] || map.Draft;
  return (
    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

const inputCls = "w-full bg-[#1E1E1E] border border-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00] transition-colors";
const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

const JobManagement = () => {
  const routerLocation = useLocation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [activeJob, setActiveJob] = useState(null);

  const [formData, setFormData] = useState({
    title: '', company: '', department: '', location: '',
    salaryRange: '', employmentType: 'Full-time', experience: '',
    requiredSkills: '', education: '', description: '',
    responsibilities: [''], benefits: [''], deadline: '', status: 'Draft'
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs');
      setJobs(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchJobs();
    const params = new URLSearchParams(routerLocation.search);
    if (params.get('create') === 'true') openCreateModal();
  }, [routerLocation]);

  const openCreateModal = () => {
    setModalType('create');
    setFormData({
      title: '', company: JSON.parse(localStorage.getItem('recruiter') || '{}').companyName || '',
      department: '', location: '', salaryRange: '', employmentType: 'Full-time',
      experience: '', requiredSkills: '', education: '', description: '',
      responsibilities: [''], benefits: [''], deadline: '', status: 'Draft'
    });
    setShowModal(true);
  };

  const openEditModal = (job) => {
    setModalType('edit'); setActiveJob(job);
    setFormData({ ...job, requiredSkills: job.requiredSkills.join(', '), deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '' });
    setShowModal(true);
  };

  const handleArrayChange = (i, val, f) => { const l = [...formData[f]]; l[i] = val; setFormData({ ...formData, [f]: l }); };
  const addArrayItem = (f) => setFormData({ ...formData, [f]: [...formData[f], ''] });
  const removeArrayItem = (i, f) => { const l = [...formData[f]]; l.splice(i, 1); setFormData({ ...formData, [f]: l }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s), responsibilities: formData.responsibilities.filter(r => r.trim()), benefits: formData.benefits.filter(b => b.trim()) };
    try {
      if (modalType === 'create') await api.post('/jobs', payload);
      else await api.put(`/jobs/${activeJob._id}`, payload);
      setShowModal(false); fetchJobs();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job? All applications will be removed.')) return;
    try { await api.delete(`/jobs/${id}`); fetchJobs(); } catch (err) { alert(err.message); }
  };
  const handleDuplicate = async (id) => {
    try { await api.post(`/jobs/${id}/duplicate`); fetchJobs(); } catch (err) { alert(err.message); }
  };
  const updateStatus = async (id, status) => {
    try { await api.patch(`/jobs/${id}/status`, { status }); fetchJobs(); } catch (err) { alert(err.message); }
  };

  const selectCls = `${inputCls}`;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Job Postings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage active listings, configure drafts, and track applicant volumes.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}>
          <Plus size={16} /> New Requisition
        </button>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1E1E1E' }} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ border: '2px dashed #2A2A2A' }}>
          <Briefcase size={36} className="text-gray-700 mb-3" />
          <h4 className="font-semibold text-white mb-1">No Job Listings</h4>
          <p className="text-sm text-gray-600">Click "New Requisition" to post your first job.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job._id} className="rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-5 transition-all hover:border-[#FF6A00]/20"
              style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
              {/* Left */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-base text-white">{job.title}</h3>
                  <StatusBadge status={job.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} />{job.employmentType}</span>
                  {job.salaryRange && <span className="flex items-center gap-1"><DollarSign size={12} />{job.salaryRange}</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} />Expires: {new Date(job.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {job.requiredSkills.map((s, i) => (
                    <span key={i} className="text-[10px] text-gray-500 bg-white/5 border border-[#2A2A2A] px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>

              {/* Middle */}
              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#2A2A2A] pt-3 md:pt-0 md:pl-5 flex-shrink-0">
                <div>
                  <div className="text-[10px] text-gray-600 font-semibold uppercase">Applicants</div>
                  <div className="text-xl font-bold font-mono" style={{ color: '#FF6A00' }}>{job.applicantCount || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 font-semibold uppercase">Experience</div>
                  <div className="text-xs font-bold text-white">{job.experience}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                {job.status === 'Draft' && (
                  <button onClick={() => updateStatus(job._id, 'Published')} title="Publish"
                    className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(0,200,83,0.1)', color: '#00C853', border: '1px solid rgba(0,200,83,0.2)' }}>
                    <Check size={15} />
                  </button>
                )}
                {job.status === 'Published' && (
                  <button onClick={() => updateStatus(job._id, 'Closed')} title="Close"
                    className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(255,193,7,0.1)', color: '#FFC107', border: '1px solid rgba(255,193,7,0.2)' }}>
                    <MinusCircle size={15} />
                  </button>
                )}
                <button onClick={() => openEditModal(job)} title="Edit"
                  className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors text-gray-400 hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A' }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDuplicate(job._id)} title="Duplicate"
                  className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors text-gray-400 hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A' }}>
                  <Copy size={15} />
                </button>
                <button onClick={() => handleDelete(job._id)} title="Delete"
                  className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.15)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl flex flex-col overflow-hidden" style={{ background: '#161616', border: '1px solid #2A2A2A', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', maxHeight: '90vh' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F] flex-shrink-0" style={{ background: '#111111' }}>
              <div>
                <h3 className="font-bold text-base text-white">{modalType === 'create' ? 'Create Requisition' : 'Edit Requisition'}</h3>
                <p className="text-xs text-gray-600 mt-0.5">Fill in fields to generate a structured job specification.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { l: 'Job Title', k: 'title', ph: 'Senior React Developer', req: true },
                  { l: 'Department', k: 'department', ph: 'Product Engineering', req: true },
                ].map(f => (
                  <div key={f.k}><label className={labelCls}>{f.l}</label>
                    <input type="text" required={f.req} value={formData[f.k]} onChange={e => setFormData({ ...formData, [f.k]: e.target.value })} placeholder={f.ph} className={inputCls} /></div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelCls}>Location</label>
                  <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Pune / Remote" className={inputCls} /></div>
                <div><label className={labelCls}>Employment Type</label>
                  <select value={formData.employmentType} onChange={e => setFormData({ ...formData, employmentType: e.target.value })} className={selectCls} style={{ colorScheme: 'dark' }}>
                    {['Full-time','Part-time','Contract','Internship','Remote'].map(o => <option key={o}>{o}</option>)}
                  </select></div>
                <div><label className={labelCls}>Salary Range</label>
                  <input type="text" value={formData.salaryRange} onChange={e => setFormData({ ...formData, salaryRange: e.target.value })} placeholder="₹12L - ₹18L" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelCls}>Experience</label>
                  <input type="text" required value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="3-5 years" className={inputCls} /></div>
                <div><label className={labelCls}>Education</label>
                  <input type="text" value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} placeholder="B.Tech / MCA" className={inputCls} /></div>
                <div><label className={labelCls}>Deadline</label>
                  <input type="date" required value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className={inputCls} style={{ colorScheme: 'dark' }} /></div>
              </div>
              <div><label className={labelCls}>Required Skills (comma separated)</label>
                <input type="text" required value={formData.requiredSkills} onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })} placeholder="React, TypeScript, Redux, Tailwind" className={inputCls} /></div>
              <div><label className={labelCls}>Job Description</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Summarize core expectations..." className={`${inputCls} resize-none`} /></div>

              {/* Dynamic Responsibilities */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Key Responsibilities</label>
                  <button type="button" onClick={() => addArrayItem('responsibilities')} className="flex items-center gap-1 text-xs text-[#FF6A00] hover:text-[#FF8C00] font-semibold cursor-pointer"><PlusCircle size={13} /> Add</button>
                </div>
                {formData.responsibilities.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={r} onChange={e => handleArrayChange(i, e.target.value, 'responsibilities')} placeholder={`Responsibility #${i + 1}`} className={inputCls} />
                    {formData.responsibilities.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem(i, 'responsibilities')} className="p-2.5 rounded-xl cursor-pointer" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Benefits */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Benefits</label>
                  <button type="button" onClick={() => addArrayItem('benefits')} className="flex items-center gap-1 text-xs text-[#FF6A00] hover:text-[#FF8C00] font-semibold cursor-pointer"><PlusCircle size={13} /> Add</button>
                </div>
                {formData.benefits.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={b} onChange={e => handleArrayChange(i, e.target.value, 'benefits')} placeholder={`Benefit #${i + 1}`} className={inputCls} />
                    {formData.benefits.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem(i, 'benefits')} className="p-2.5 rounded-xl cursor-pointer" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>

              <div className="w-1/3"><label className={labelCls}>Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={selectCls} style={{ colorScheme: 'dark' }}>
                  {['Draft','Published','Closed','Archived'].map(o => <option key={o}>{o}</option>)}
                </select></div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#1F1F1F] flex-shrink-0" style={{ background: '#111111' }}>
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm text-gray-400 border border-[#2A2A2A] hover:bg-white/5 cursor-pointer transition-colors">Cancel</button>
              <button type="submit" onClick={handleSubmit} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all"
                style={{ background: '#FF6A00', boxShadow: '0 0 12px rgba(255,106,0,0.3)' }}>
                {modalType === 'create' ? 'Create Posting' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;
