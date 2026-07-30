import React, { useState, useEffect } from 'react';
import { Users, Brain, Star, Check, Award, Briefcase, Zap, BookOpen, Activity, ArrowRight } from 'lucide-react';
import api from '../utils/api';

const CandidateComparison = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedCands, setSelectedCands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.data);
      if (res.data.data.length > 0) setSelectedJobId(res.data.data[0]._id);
    } catch (err) { console.error(err.message); }
  };

  const fetchCandidates = async () => {
    if (!selectedJobId) return;
    try {
      setLoading(true); setShowMatrix(false); setSelectedCands([]);
      const res = await api.get('/candidates', { params: { jobId: selectedJobId } });
      setCandidates(res.data.data.filter(c => c.matchScore > 0));
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { fetchCandidates(); }, [selectedJobId]);

  const toggleSelectCandidate = (cand) => {
    const isSelected = selectedCands.some(c => c._id === cand._id);
    if (isSelected) { setSelectedCands(selectedCands.filter(c => c._id !== cand._id)); }
    else {
      if (selectedCands.length >= 3) { alert('Maximum 3 candidates.'); return; }
      setSelectedCands([...selectedCands, cand]);
    }
  };

  const getBestCandidate = () => selectedCands.length === 0 ? null : [...selectedCands].sort((a, b) => b.matchScore - a.matchScore)[0];
  const bestCandidate = getBestCandidate();

  const matrixRows = [
    { label: 'AI Match Score', get: c => <span style={{ color: '#FF6A00' }} className="font-bold font-mono">{c.matchScore}%</span> },
    { label: 'ATS Score', get: c => <span className={`font-bold font-mono ${c.atsScore >= 80 ? 'text-[#00C853]' : c.atsScore >= 60 ? 'text-[#FFC107]' : 'text-[#FF3B30]'}`}>{c.atsScore}/100</span> },
    { label: 'Experience', get: c => <span className="text-white">{c.experience} Years</span> },
    { label: 'Degree', get: c => <span className="text-gray-400 text-xs">{c.education[0]?.split(' - ')[0] || 'N/A'}</span> },
    { label: 'Certifications', get: c => <span className="text-white font-mono">{c.certifications?.length || 0}</span> },
    { label: 'Communication', get: c => { const s = c.atsScore > 90 ? 9 : c.atsScore > 80 ? 8 : 7; return <span className="text-white font-mono">{s}/10</span>; } },
    { label: 'Skills', get: c => (
      <div className="flex flex-wrap gap-1 justify-center">
        {c.skills.slice(0, 3).map((s, i) => (
          <span key={i} className="text-[9px] text-gray-500 bg-white/5 border border-[#2A2A2A] px-1.5 py-0.5 rounded">{s}</span>
        ))}
      </div>
    )},
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Candidate Comparison</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select a position, pick up to 3 candidates, and run a comparison matrix.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-600 font-semibold uppercase tracking-wide">Position</label>
          <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
            className="bg-[#1E1E1E] border border-[#2A2A2A] px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6A00]"
            style={{ colorScheme: 'dark' }}>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* Left: pool */}
        <div className="lg:col-span-2 rounded-2xl p-5 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <div className="flex justify-between items-center">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Candidate Pool</div>
            <div className="text-[11px] text-gray-600">{selectedCands.length}/3 selected</div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#1E1E1E' }} />) :
              candidates.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-600">No candidates applied to this job yet.</div>
              ) : candidates.map(cand => {
                const isSelected = selectedCands.some(c => c._id === cand._id);
                return (
                  <div key={cand._id} onClick={() => toggleSelectCandidate(cand)}
                    className="p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    style={{
                      background: isSelected ? 'rgba(255,106,0,0.06)' : '#1E1E1E',
                      border: `1px solid ${isSelected ? 'rgba(255,106,0,0.3)' : '#2A2A2A'}`,
                    }}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: isSelected ? '#FF6A00' : 'transparent', border: `1px solid ${isSelected ? '#FF6A00' : '#444'}` }}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{cand.name}</div>
                        <div className="text-[10px] text-gray-600">{cand.experience}y exp · ATS: {cand.atsScore}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold font-mono flex-shrink-0" style={{ color: '#FF6A00' }}>{cand.matchScore}%</div>
                  </div>
                );
              })
            }
          </div>
          {selectedCands.length >= 2 && (
            <button onClick={() => setShowMatrix(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all"
              style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}>
              <Zap size={15} /> Compile Matrix
            </button>
          )}
        </div>

        {/* Right: matrix */}
        <div className="lg:col-span-3 rounded-2xl p-5 min-h-[400px] flex flex-col" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          {!showMatrix || selectedCands.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                <Users size={24} className="text-gray-600 animate-pulse" />
              </div>
              <h4 className="font-semibold text-white mb-1">Ready for Comparison</h4>
              <p className="text-sm text-gray-600 max-w-xs">Select at least 2 candidates from the pool, then click "Compile Matrix".</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Best candidate highlight */}
              {bestCandidate && (
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <div className="text-xs font-bold text-white">AI Recommendation</div>
                      <div className="text-[11px] text-gray-600">Based on skill match & experience</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: '#00C853' }}>{bestCandidate.name} ({bestCandidate.matchScore}%)</div>
                </div>
              )}

              {/* Matrix table */}
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2A2A2A' }}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ background: '#111111' }}>
                      <th className="px-4 py-3 text-[11px] text-gray-600 font-semibold uppercase tracking-wider">Metric</th>
                      {selectedCands.map(c => (
                        <th key={c._id} className="px-4 py-3 text-[11px] text-gray-400 font-semibold text-center border-l border-[#2A2A2A]">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((row, i) => (
                      <tr key={i} className="border-t border-[#1F1F1F] hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 text-gray-500 font-medium">{row.label}</td>
                        {selectedCands.map(c => (
                          <td key={c._id} className="px-4 py-3 text-center border-l border-[#1F1F1F]">{row.get(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CandidateComparison;
