import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Link as LinkIcon, Edit3, Camera, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';

const CProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/candidate-auth/profile');
        if (res.data && res.data.name) {
          // Normalize flat vs nested format
          const formatted = res.data.personal ? res.data : {
            personal: { name: res.data.name, email: res.data.email, phone: res.data.phone, location: `${res.data.city || 'Bangalore'}, ${res.data.country || 'India'}`, headline: res.data.headline || 'Full Stack Developer', summary: res.data.bio || '' },
            experience: res.data.experience || [],
            education: res.data.education || [],
            skills: res.data.skills || [],
            social: { linkedin: res.data.linkedin, github: res.data.github, portfolio: res.data.portfolio },
            preferences: { expectedCtc: res.data.expectedCTC, location: Array.isArray(res.data.preferredLocation) ? res.data.preferredLocation.join(', ') : res.data.preferredLocation, noticePeriod: res.data.noticePeriod }
          };
          setProfile(formatted);
          setEditForm(formatted);
          return;
        }
      } catch(e) {
        console.warn("Profile API failed, using mock data");
      }
      
      const mockProfile = {
        personal: {
          name: 'Arjun Mehta',
          email: 'arjun.mehta@gmail.com',
          phone: '+91 98765 43210',
          location: 'Bangalore, Karnataka, India',
          headline: 'Full Stack Developer | React · Node.js · AWS | 5 Years Experience',
          summary: 'Passionate full stack developer with 5+ years of experience building scalable web applications for fintech and e-commerce. I love solving complex problems and turning ideas into elegant products. Open source contributor and tech blogger.'
        },
        experience: [
          { id: 1, title: 'Senior Software Engineer', company: 'Razorpay', duration: '2022 - Present', description: 'Leading the payments infrastructure team. Built a real-time transaction monitoring dashboard serving 10M+ transactions/day. Reduced API latency by 40%.' },
          { id: 2, title: 'Software Engineer', company: 'Flipkart', duration: '2020 - 2022', description: 'Developed seller portal features used by 500K+ merchants. Implemented A/B testing framework that improved conversion rates by 18%.' },
          { id: 3, title: 'Junior Developer', company: 'TechMahindra', duration: '2019 - 2020', description: 'Worked on enterprise web applications for banking clients.' }
        ],
        education: [
          { id: 1, degree: 'B.Tech Computer Science', institution: 'BITS Pilani', year: '2015 - 2019' }
        ],
        skills: ['React', 'Node.js', 'TypeScript', 'Python', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Redis', 'GraphQL', 'Next.js', 'Tailwind CSS', 'System Design'],
        social: { linkedin: 'linkedin.com/in/arjunmehta', github: 'github.com/arjunmehta', portfolio: 'arjunmehta.dev' },
        preferences: { expectedCtc: '₹35 LPA', location: 'Bangalore, Mumbai, Remote', noticePeriod: '30 Days' }
      };
      setProfile(mockProfile);
      setEditForm(mockProfile);
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/candidate-auth/profile', editForm);
      setProfile(editForm);
      setIsEditModalOpen(false);
      showToast('Profile updated successfully!');
      localStorage.setItem('candidateUser', JSON.stringify({ name: editForm.personal.name, role: editForm.personal.headline }));
    } catch (err) {
      showToast('Error saving profile', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6 bg-[#090909] min-h-screen">
        <div className="animate-pulse bg-[#161616] h-64 rounded-2xl"></div>
        <div className="animate-pulse bg-[#161616] h-48 rounded-2xl"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 bg-[#090909] min-h-screen text-white relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg ${toast.type === 'success' ? 'bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981]' : 'bg-red-500/20 border border-red-500/50 text-red-400'}`}>
          <CheckCircle2 className="w-5 h-5" /> {toast.msg}
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           <button onClick={() => setIsEditModalOpen(true)} className="bg-white/5 hover:bg-white/10 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-colors">
              <Edit3 className="w-4 h-4" /> Edit Profile
           </button>
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 mt-8 md:mt-0">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-[#2A2A2A] border-4 border-[#1E1E1E] flex items-center justify-center overflow-hidden">
               <User className="w-12 h-12 text-gray-500" />
            </div>
            <button className="absolute bottom-0 right-0 bg-[#FF6A00] p-2 rounded-full border-2 border-[#161616] shadow-lg hover:bg-orange-500 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold">{profile.personal.name}</h1>
            <p className="text-[#FF6A00] font-medium text-lg">{profile.personal.headline}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400 mt-2">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.personal.location}</span>
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {profile.personal.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {profile.personal.phone}</span>
            </div>
            <p className="text-gray-300 mt-4 max-w-3xl leading-relaxed">{profile.personal.summary}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Experience */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#FF6A00]"/> Experience</h2>
            </div>
            <div className="space-y-6">
              {profile.experience.map((exp, i) => (
                <div key={i} className="border-l-2 border-[#2A2A2A] pl-4 relative">
                  <div className="absolute w-3 h-3 bg-[#FF6A00] rounded-full -left-[7px] top-1.5 shadow-[0_0_10px_rgba(255,106,0,0.5)]"></div>
                  <h3 className="font-bold text-lg">{exp.title}</h3>
                  <p className="text-[#FF6A00] text-sm font-medium">{exp.company}</p>
                  <p className="text-gray-500 text-xs mt-1 mb-2">{exp.duration}</p>
                  <p className="text-gray-300 text-sm">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-6"><GraduationCap className="w-5 h-5 text-[#3B82F6]"/> Education</h2>
            <div className="space-y-4">
              {profile.education.map((edu, i) => (
                <div key={i} className="bg-[#1E1E1E] p-4 rounded-xl border border-[#2A2A2A]">
                  <h3 className="font-bold">{edu.degree}</h3>
                  <p className="text-gray-400 text-sm">{edu.institution} • {edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Skills */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4"><Code className="w-5 h-5 text-[#10B981]"/> Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg text-sm text-gray-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4"><LinkIcon className="w-5 h-5 text-[#8B5CF6]"/> Links</h2>
            <div className="space-y-3">
              {Object.entries(profile.social).map(([platform, link]) => (
                <a key={platform} href={`https://${link}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-[#FF6A00]/50 transition-colors text-sm text-gray-300">
                  <span className="capitalize w-20 font-medium text-gray-400">{platform}</span>
                  <span className="truncate">{link}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Job Preferences</h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Expected CTC</span>
                <span className="text-gray-200">{profile.preferences.expectedCtc}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Preferred Location</span>
                <span className="text-gray-200">{profile.preferences.location}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Notice Period</span>
                <span className="text-gray-200">{profile.preferences.noticePeriod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center sticky top-0 bg-[#161616] z-10">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Full Name</label>
                  <input type="text" value={editForm.personal.name} onChange={e => setEditForm({...editForm, personal: {...editForm.personal, name: e.target.value}})} className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 focus:border-[#FF6A00] focus:outline-none" required />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Headline</label>
                  <input type="text" value={editForm.personal.headline} onChange={e => setEditForm({...editForm, personal: {...editForm.personal, headline: e.target.value}})} className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 focus:border-[#FF6A00] focus:outline-none" />
                </div>
              </div>
              <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Summary</label>
                  <textarea value={editForm.personal.summary} onChange={e => setEditForm({...editForm, personal: {...editForm.personal, summary: e.target.value}})} className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 focus:border-[#FF6A00] focus:outline-none min-h-[100px]"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-[#2A2A2A]">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm">Cancel</button>
                <button type="submit" className="bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-6 py-2.5 font-semibold text-sm transition-all" style={{ boxShadow: '0 0 20px rgba(255,106,0,0.3)' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CProfile;
