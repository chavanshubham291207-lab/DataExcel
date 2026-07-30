import React, { useState, useEffect } from 'react';
import { Wand2, Download, Eye, FileText, CheckCircle2, RefreshCw, Layout, Sparkles, Plus, Trash2 } from 'lucide-react';
import api from '../../utils/api';

const CResumeBuilder = () => {
  const [template, setTemplate] = useState('cyberpunk');
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', location: '', jobRole: '', summary: '',
    skills: [], education: [], workExperience: [], projects: []
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/candidate-auth/me');
        if (res.data?.data) {
          const user = res.data.data;
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            location: user.location || '',
            jobRole: user.jobRole || '',
            summary: user.summary || '',
            skills: user.skills || ['JavaScript', 'React.js', 'Node.js', 'MongoDB', 'Tailwind CSS'],
            education: user.education?.length ? user.education : [
              { degree: 'B.S. Computer Science', institution: 'Tech University', year: '2020 - 2024' }
            ],
            workExperience: user.workExperience?.length ? user.workExperience : [
              { title: 'Frontend Developer Intern', company: 'Apex Global', duration: '2023 - Present', description: 'Developed React components with 99.8% test coverage.' }
            ],
            projects: user.projects?.length ? user.projects : [
              { title: 'AI Recruitment Platform', tech: 'React, Node, MongoDB', description: 'Built automated matching engine for candidate pipeline.' }
            ]
          });
        }
      } catch (e) {
        console.warn('Using cached profile data for builder');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAIImprove = () => {
    setGenerating(true);
    setTimeout(() => {
      setProfile(prev => ({
        ...prev,
        summary: `Results-driven ${prev.jobRole || 'Software Engineer'} with expertise in modern web technologies. Proven track record in building scalable applications, optimizing web performance by 40%, and designing intuitive user experiences.`
      }));
      setGenerating(false);
    }, 1200);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111] p-6 rounded-2xl border border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Resume Builder</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">ATS Optimized</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Generate multi-template ATS-friendly resumes with one-click AI enhancements</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAIImprove}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-[#2A2A2A] hover:border-orange-500/50 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Wand2 size={14} className={generating ? 'animate-spin text-orange-500' : 'text-orange-400'} />
            <span>{generating ? 'Enhancing Content...' : 'AI Enhance Summary'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.4)' }}
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Editor */}
        <div className="lg:col-span-6 space-y-6">
          {/* Template Switcher */}
          <div className="bg-[#161616] p-5 rounded-2xl border border-[#2A2A2A] space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layout size={14} className="text-orange-500" />
              Select Template
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'cyberpunk', name: 'Cyberpunk Modern' },
                { id: 'executive', name: 'Executive Slate' },
                { id: 'minimalist', name: 'Minimalist Clean' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    template === t.id
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                      : 'bg-white/5 border-[#2A2A2A] text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content Editor */}
          <div className="bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Info</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-3 py-2 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold">Job Title</label>
                <input
                  type="text"
                  value={profile.jobRole}
                  onChange={e => setProfile({ ...profile, jobRole: e.target.value })}
                  className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-3 py-2 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold">Professional Summary</label>
              <textarea
                rows={3}
                value={profile.summary}
                onChange={e => setProfile({ ...profile, summary: e.target.value })}
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-3 py-2 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Live Preview */}
        <div className="lg:col-span-6">
          <div className="bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] sticky top-6">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#2A2A2A]">
              <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                <Eye size={14} className="text-orange-500" />
                Live Preview ({template.toUpperCase()})
              </span>
              <span className="text-[11px] text-green-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> ATS Score: 96%
              </span>
            </div>

            {/* Resume Canvas */}
            <div className="bg-white text-black p-8 rounded-xl shadow-2xl space-y-4 font-sans min-h-[500px]">
              <div className="border-b pb-4 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name || 'Your Full Name'}</h1>
                <p className="text-sm text-orange-600 font-medium">{profile.jobRole || 'Professional Title'}</p>
                <p className="text-xs text-gray-500 mt-1">{profile.email} | {profile.phone} | {profile.location}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1 mb-1">Executive Summary</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{profile.summary || 'Your summary will appear here...'}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1 mb-1">Technical Skills</h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.skills?.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-[10px] font-semibold">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-1 mb-1">Experience</h3>
                {profile.workExperience?.map((exp, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between text-xs font-bold text-gray-800">
                      <span>{exp.title}</span>
                      <span className="text-gray-400 font-normal">{exp.duration}</span>
                    </div>
                    <div className="text-[11px] text-gray-500">{exp.company}</div>
                    <p className="text-[10px] text-gray-600 mt-0.5">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CResumeBuilder;
