import React, { useState } from 'react';
import { Search, Brain, Users, MapPin, Calendar, Star, Check, Filter, Activity, Tag, BookOpen, Zap } from 'lucide-react';
import api from '../utils/api';

const SmartSearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [extractedFilters, setExtractedFilters] = useState(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const suggestions = [
    'Show React developers with AWS experience.',
    'Find freshers with Machine Learning projects.',
    'Top Node.js developers in Pune.',
    'Senior engineers with 5+ years experience.',
  ];

  const handleSearch = async (queryText) => {
    const searchText = queryText || query;
    if (!searchText.trim()) return;
    if (queryText) setQuery(queryText);
    setLoading(true); setError(''); setCandidates([]); setExtractedFilters(null); setSearched(true);
    try {
      const res = await api.get('/candidates', { params: { query: searchText } });
      setCandidates(res.data.data);
      setExtractedFilters(res.data.filters);
    } catch (err) {
      setError(err.response?.data?.error || 'Smart Search failed. Verify the FastAPI AI service is online.');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI Smart Search</h1>
        <p className="text-sm text-gray-500 mt-0.5">Execute natural language queries. The AI extracts skills, locations, and experience to query the talent pool.</p>
      </div>

      {/* Search Panel */}
      <div className="rounded-2xl p-6 space-y-5" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
        <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex gap-3">
          <div className="flex-1 relative">
            <Brain size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6A00]" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Senior React developers with 3+ years and AWS certification..."
              className="w-full bg-[#1E1E1E] border border-[#2A2A2A] pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF6A00] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.3)' }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Search size={16} />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Suggestions */}
        <div>
          <div className="text-[11px] text-gray-600 font-semibold uppercase tracking-wider mb-2">Example Queries</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => handleSearch(s)}
                className="text-xs text-gray-500 hover:text-[#FF6A00] px-3 py-1.5 rounded-xl border border-[#2A2A2A] hover:border-[#FF6A00]/40 transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Extracted Filters */}
        {extractedFilters && (
          <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,106,0,0.05)', border: '1px solid rgba(255,106,0,0.15)' }}>
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#FF6A00' }}>
              <Zap size={13} /> AI Extracted Filters
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              {extractedFilters.skills?.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                  <Tag size={10} className="text-[#FF6A00]" /> Skills: {extractedFilters.skills.join(', ')}
                </span>
              )}
              {extractedFilters.location && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                  <MapPin size={10} className="text-[#FF6A00]" /> {extractedFilters.location}
                </span>
              )}
              {extractedFilters.experience !== undefined && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                  <Calendar size={10} className="text-[#FF6A00]" /> {extractedFilters.experience}+ years
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}>
          <Activity size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-sm font-semibold text-white">{candidates.length} Candidates Found</div>
            {candidates.length > 0 && <div className="text-[11px] text-gray-600">Ranked by AI relevance score</div>}
          </div>

          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
              <BookOpen size={36} className="text-gray-700 mb-3" />
              <h4 className="font-semibold text-white mb-1">No Matching Candidates</h4>
              <p className="text-sm text-gray-600">Try a different query or refine your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((c, i) => (
                <div key={c._id} className="p-4 rounded-2xl space-y-3 transition-all hover:border-[#FF6A00]/30"
                  style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)' }}>
                      {c.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                      <div className="text-[11px] text-gray-600 truncate">{c.email}</div>
                    </div>
                    {i < 3 && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(255,106,0,0.12)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.25)' }}>
                        #{i + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{c.experience}y · {c.location || 'Remote'}</span>
                    <span className="font-mono font-semibold" style={{ color: c.atsScore >= 80 ? '#00C853' : c.atsScore >= 60 ? '#FFC107' : '#FF3B30' }}>
                      ATS {c.atsScore}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 4).map((s, j) => (
                      <span key={j} className="text-[10px] text-gray-500 bg-white/5 border border-[#2A2A2A] px-2 py-0.5 rounded">{s}</span>
                    ))}
                    {c.skills.length > 4 && <span className="text-[10px] text-gray-600">+{c.skills.length - 4}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
