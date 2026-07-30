import React, { useState } from 'react';
import { FileSignature, Wand2, Download, Copy, Check, Sparkles, Building2, Briefcase } from 'lucide-react';

const CCoverLetter = () => {
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Developer');
  const [companyName, setCompanyName] = useState('Apex Systems Inc.');
  const [tone, setTone] = useState('Professional');
  const [keySkills, setKeySkills] = useState('React, Node.js, TypeScript, AWS, System Architecture');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coverLetter, setCoverLetter] = useState(`Dear Hiring Manager,

I am writing to express my enthusiastic interest in the Senior Full Stack Developer position at Apex Systems Inc. With over 4 years of hands-on experience in architecting scalable web applications using React, Node.js, and cloud infrastructure, I am confident in my ability to immediately contribute to your high-performing team.

At my previous role, I led the development of modern microservices that reduced latency by 35% and served over 100,000 active users. My core strengths include React, Node.js, TypeScript, AWS, System Architecture, and driving collaborative engineering standard practices.

I am particularly drawn to Apex Systems Inc.'s commitment to innovation and engineering excellence. I would welcome the opportunity to discuss how my technical expertise and passion for building enterprise-grade products align with your strategic goals.

Thank you for your time and consideration.

Sincerely,
[Your Name]`);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setCoverLetter(`Dear Hiring Manager at ${companyName || 'the team'},

I am thrilled to apply for the ${jobTitle || 'Developer'} role at ${companyName || 'your organization'}. Having closely followed your recent milestones, I am eager to bring my core strengths in ${keySkills} to your engineering initiatives.

Throughout my career, I have focused on building performant, resilient systems and delivering intuitive user experiences. Integrating ${keySkills.split(',')[0] || 'modern tech'} into core production workflows has consistently allowed me to solve complex business challenges cleanly and efficiently.

I am excited about the prospect of joining ${companyName} and would love to arrange a conversation to discuss how my background matches your current requirements.

Warm regards,
Candidate User`);
      setGenerating(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111] p-6 rounded-2xl border border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Cover Letter Generator</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Tailored AI</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Generate customized, high-converting cover letters in seconds</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-[#2A2A2A] hover:border-orange-500/50 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.4)' }}
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={14} className="text-orange-500" />
            Generator Inputs
          </h2>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Target Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none mt-1"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none mt-1"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Tone</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none mt-1"
            >
              <option value="Professional">Professional & Formal</option>
              <option value="Enthusiastic">Enthusiastic & High Energy</option>
              <option value="Executive">Executive & Leadership Focus</option>
              <option value="Creative">Creative & Modern</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Key Highlight Skills</label>
            <textarea
              rows={3}
              value={keySkills}
              onChange={e => setKeySkills(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none mt-1"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-xs text-white transition-all cursor-pointer mt-2"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 20px rgba(255,106,0,0.4)' }}
          >
            <Wand2 size={15} className={generating ? 'animate-spin' : ''} />
            <span>{generating ? 'Generating Letter...' : 'Generate AI Cover Letter'}</span>
          </button>
        </div>

        {/* Live Output */}
        <div className="lg:col-span-7 bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <FileSignature size={14} className="text-orange-500" />
            Generated Document
          </h2>
          <textarea
            rows={18}
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-gray-200 rounded-xl p-4 text-xs font-mono leading-relaxed focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default CCoverLetter;
