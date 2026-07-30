import React from 'react';
import { TrendingUp, DollarSign, Award, Target, BookOpen, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const salaryData = [
  { role: 'Frontend', min: 6, avg: 14, max: 24 },
  { role: 'Backend', min: 8, avg: 16, max: 28 },
  { role: 'Full Stack', min: 10, avg: 18, max: 32 },
  { role: 'AI/ML', min: 12, avg: 22, max: 40 },
  { role: 'DevOps', min: 9, avg: 17, max: 30 },
];

const demandSkills = [
  { skill: 'React / Next.js', demand: 94 },
  { skill: 'Node.js / Express', demand: 89 },
  { skill: 'Python / AI Frameworks', demand: 96 },
  { skill: 'AWS / Cloud Architect', demand: 87 },
  { skill: 'TypeScript', demand: 91 },
];

const CCareerInsights = () => {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-orange-500" size={20} /> Career Insights & Market Trends
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">Real-time industry salary benchmarks and in-demand skills analysis</p>
      </div>

      {/* Top Banner */}
      <div className="rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
        <div className="space-y-1">
          <span className="text-[11px] text-gray-500 uppercase font-semibold">Your Market Benchmark</span>
          <div className="text-2xl font-bold text-orange-400">18 - 22 LPA</div>
          <p className="text-gray-500 text-[11px]">Based on Full Stack (5 yrs exp in Bengaluru)</p>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-gray-500 uppercase font-semibold">Top Hiring Tech</span>
          <div className="text-2xl font-bold text-emerald-400">React + AI</div>
          <p className="text-gray-500 text-[11px]">+34% increase in demand this quarter</p>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-gray-500 uppercase font-semibold">Peer Percentile</span>
          <div className="text-2xl font-bold text-blue-400">Top 15%</div>
          <p className="text-gray-500 text-[11px]">Matches top 15% profiles in your domain</p>
        </div>
      </div>

      {/* Salary Charts & Demand Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Chart */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Salary Ranges by Tech Role (LPA)</h3>
            <span className="text-[11px] text-orange-400 font-semibold">India Tech Market 2026</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData}>
                <XAxis dataKey="role" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="avg" fill="#FF6A00" radius={[6, 6, 0, 0]} name="Average CTC (LPA)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* In-Demand Skills */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Top In-Demand Skills Index</h3>
          <div className="space-y-4">
            {demandSkills.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-200 font-semibold">{item.skill}</span>
                  <span className="text-orange-400 font-bold">{item.demand}% Demand</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" style={{ width: `${item.demand}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Courses & Upskilling */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <BookOpen size={16} className="text-orange-400" /> Recommended Micro-Certifications for You
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-white/5 border border-[#2A2A2A] space-y-2">
            <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">High Impact</span>
            <h4 className="text-white font-semibold text-xs">AWS Certified Solutions Architect</h4>
            <p className="text-gray-400 text-[11px]">Boost your profile ATS score by +15 points</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-[#2A2A2A] space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Trending</span>
            <h4 className="text-white font-semibold text-xs">LangChain & LLM Application Engineering</h4>
            <p className="text-gray-400 text-[11px]">Qualify for senior AI Developer roles</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-[#2A2A2A] space-y-2">
            <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Recommended</span>
            <h4 className="text-white font-semibold text-xs">Docker & Kubernetes Masterclass</h4>
            <p className="text-gray-400 text-[11px]">Essential for modern backend positions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCareerInsights;
