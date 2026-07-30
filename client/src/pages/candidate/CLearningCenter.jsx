import React from 'react';
import { GraduationCap, PlayCircle, Award, BookOpen, ExternalLink, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

const CLearningCenter = () => {
  const courses = [
    { title: 'Advanced React 19 & Next.js App Router Masterclass', provider: 'Meta Learning Lab', level: 'Advanced', duration: '14 hrs', matchBoost: '+18% Job Match' },
    { title: 'Enterprise System Architecture & Microservices', provider: 'AWS Academy', level: 'Expert', duration: '22 hrs', matchBoost: '+25% Job Match' },
    { title: 'TypeScript for Production Node.js Services', provider: 'Frontend Masters', level: 'Intermediate', duration: '8 hrs', matchBoost: '+12% Job Match' },
    { title: 'Docker, Kubernetes & CI/CD Pipelines for Developers', provider: 'Cloud Native Foundation', level: 'Intermediate', duration: '16 hrs', matchBoost: '+15% Job Match' }
  ];

  const roadmaps = [
    { name: 'Full-Stack Lead Architect 2026', steps: 6, completed: 4 },
    { name: 'AI Engineering & LLM Application Specialist', steps: 8, completed: 2 }
  ];

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111] p-6 rounded-2xl border border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Learning Center & Upskilling</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">AI Skill Gap Recommendations</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Accelerate your career trajectory with curated courses aligned with top recruiter demands</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-[#2A2A2A] px-4 py-2 rounded-xl text-xs font-semibold text-gray-300">
          <Award size={16} className="text-orange-500" />
          <span>3 Verified Certifications</span>
        </div>
      </div>

      {/* Recommended Courses Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <GraduationCap size={15} className="text-orange-500" /> AI Skill Gap Courses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c, i) => (
            <div key={i} className="bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] hover:border-orange-500/30 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">{c.matchBoost}</span>
                  <span className="text-[11px] text-gray-500">{c.duration}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-3 leading-snug">{c.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{c.provider} • {c.level}</p>
              </div>

              <div className="flex items-center justify-between border-t border-[#2A2A2A] pt-4">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <PlayCircle size={14} className="text-orange-500" /> Video & Interactive Labs
                </span>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-[#2A2A2A] text-xs font-semibold text-white hover:border-orange-500/50 transition-all cursor-pointer">
                  <span>Start Learning</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmaps Section */}
      <div className="bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={15} className="text-orange-500" /> Active Career Roadmaps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmaps.map((r, idx) => (
            <div key={idx} className="bg-[#111] p-5 rounded-xl border border-[#2A2A2A] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">{r.name}</span>
                <span className="text-orange-400 font-mono">{r.completed}/{r.steps} Completed</span>
              </div>
              <div className="w-full bg-[#1E1E1E] rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: `${(r.completed / r.steps) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CLearningCenter;
