import React, { useState } from 'react';
import { UploadCloud, Brain, AlertTriangle, CheckCircle2, FileText, ArrowRight, Shield, Zap } from 'lucide-react';
import api from '../utils/api';

const ScoreRing = ({ score }) => {
  const color = score >= 80 ? '#00C853' : score >= 60 ? '#FFC107' : '#FF3B30';
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold font-mono"
        style={{
          border: `2px solid ${color}`,
          color,
          background: `${color}10`,
          boxShadow: `0 0 16px ${color}30`,
        }}
      >
        {score}
      </div>
      <span className="text-[10px] text-gray-600 mt-1">ATS Score</span>
    </div>
  );
};

const ResumeIntelligence = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => { setFile(e.target.files[0]); setError(''); };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a resume file first.'); return; }
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true); setError(''); setParsedData(null);
    try {
      const res = await api.post('/candidates/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setParsedData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse resume. Ensure backend and FastAPI AI service are running.');
    } finally { setUploading(false); }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI Resume Intelligence</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload PDF/DOCX resumes to extract skills, compute ATS scores, and surface actionable insights.</p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Upload Column */}
        <div className="lg:col-span-2 rounded-2xl p-6 space-y-5" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <h3 className="text-sm font-semibold text-white">Upload Resume</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Drop zone */}
            <div
              className="relative rounded-xl p-8 text-center cursor-pointer transition-all"
              style={{
                border: `2px dashed ${file ? '#FF6A00' : '#2A2A2A'}`,
                background: file ? 'rgba(255,106,0,0.04)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <input
                type="file"
                required
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud size={36} className={`mx-auto mb-3 ${file ? 'text-[#FF6A00]' : 'text-gray-600'}`} />
              <div className={`text-sm font-semibold ${file ? 'text-white' : 'text-gray-600'}`}>
                {file ? file.name : 'Drop PDF, DOCX, or TXT'}
              </div>
              <div className="text-[11px] text-gray-600 mt-1">Max 10MB · Click or drag to browse</div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}>
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: uploading ? 'none' : '0 0 16px rgba(255,106,0,0.3)' }}
            >
              <Brain size={16} className={uploading ? 'animate-pulse' : ''} />
              {uploading ? 'Analyzing Resume...' : 'Analyze CV with AI'}
            </button>
          </form>

          {/* Info card */}
          <div className="p-4 rounded-xl space-y-2 text-xs text-gray-600" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center gap-2 text-gray-400 font-semibold">
              <Shield size={13} className="text-[#FF6A00]" /> What happens under the hood?
            </div>
            <p className="leading-relaxed">
              Resumes are parsed via our FastAPI Python service using PDF text extraction. AI identifies contacts, computes ATS ranking, flags skill shortages, and highlights structural weaknesses.
            </p>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-3 rounded-2xl p-6 min-h-[400px] flex flex-col" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          {!parsedData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                <FileText size={24} className="text-gray-600" />
              </div>
              <h4 className="font-semibold text-white mb-1">Awaiting Analysis</h4>
              <p className="text-sm text-gray-600 max-w-xs">Upload a CV to see contact info, skills, ATS score, strengths, weaknesses, and optimization tips here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-[#1F1F1F]">
                <div>
                  <h3 className="text-lg font-bold text-white">{parsedData.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{parsedData.email} · {parsedData.phone || 'No phone'}</p>
                </div>
                <ScoreRing score={parsedData.atsScore} />
              </div>

              {/* Summary */}
              <div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Summary</div>
                <p className="text-sm text-gray-400 leading-relaxed p-3 rounded-xl" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                  {parsedData.summary || 'No summary available.'}
                </p>
              </div>

              {/* Skills */}
              <div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills Extracted ({parsedData.skills.length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.skills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(255,106,0,0.08)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.2)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education & Experience */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#1F1F1F]">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Education</div>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {parsedData.education.map((e, i) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-[#FF6A00] mt-1">▸</span>{e}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Experience</div>
                  <div className="text-2xl font-bold font-mono text-white">{parsedData.experience}</div>
                  <div className="text-xs text-gray-600">years detected</div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#00C853' }}>Strengths</div>
                  <ul className="space-y-1.5 text-xs text-gray-400">
                    {parsedData.strengths?.map((s, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <CheckCircle2 size={12} className="text-[#00C853] flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,59,48,0.05)', border: '1px solid rgba(255,59,48,0.15)' }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#FF3B30' }}>Improve</div>
                  <ul className="space-y-1.5 text-xs text-gray-400">
                    {parsedData.weaknesses?.map((w, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <AlertTriangle size={12} className="text-[#FF3B30] flex-shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,193,7,0.05)', border: '1px solid rgba(255,193,7,0.15)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#FFC107' }}>ATS Optimization</div>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  {parsedData.suggestions?.map((s, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <ArrowRight size={12} className="text-[#FFC107] flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResumeIntelligence;
