import React, { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, CheckCircle2, Users, Award, BarChart3, Activity } from 'lucide-react';
import api from '../utils/api';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setData(res.data.data);
    } catch (err) { console.error('Failed to load reports data:', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReportData(); }, []);

  const handleExport = async (type) => {
    try {
      const res = await api.get(`/reports/export?type=${type}`, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${type === 'jobs' ? 'Job_Performance' : 'Candidate_Intelligence'}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { alert('Export failed. Ensure the server is online.'); }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <div className="h-8 w-56 animate-pulse rounded-xl" style={{ background: '#1E1E1E' }} />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: '#1E1E1E' }} />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl" style={{ background: '#1E1E1E' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity size={32} className="text-gray-700 mx-auto mb-3" />
          <h4 className="font-semibold text-white mb-1">No Report Data</h4>
          <p className="text-sm text-gray-600">Post jobs and add candidates to see analytics.</p>
        </div>
      </div>
    );
  }

  const { jobPerformance, candidateSummary, skillDemand, recruiterKPI } = data;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Reports & Export</h1>
          <p className="text-sm text-gray-500 mt-0.5">Audit KPIs, compile conversion ratios, and export data sheets.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('candidates')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 12px rgba(255,106,0,0.3)' }}>
            <Download size={15} /> Export Candidates
          </button>
          <button onClick={() => handleExport('jobs')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A' }}>
            <Download size={15} /> Export Jobs
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Monitored Candidates', value: candidateSummary.totalCandidates, sub: 'profiles in database', icon: Users, color: '#007AFF' },
          { label: 'Average ATS Score', value: `${candidateSummary.averageAtsScore}/100`, sub: 'across candidate pool', icon: Award, color: '#FF6A00' },
          { label: 'Interviews Conducted', value: recruiterKPI.interviewsConducted, sub: 'by your team', icon: CheckCircle2, color: '#00C853' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="p-5 rounded-2xl stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${k.color}18`, border: `1px solid ${k.color}30` }}>
                  <Icon size={15} style={{ color: k.color }} />
                </div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{k.label}</div>
              </div>
              <div className="text-2xl font-bold font-mono text-white mb-0.5">{k.value}</div>
              <div className="text-[11px] text-gray-600">{k.sub}</div>
            </div>
          );
        })}
      </section>

      {/* Main table + Skills */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Job Performance Table */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white">Job Performance Metrics</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">Application counts and hire conversion ratios per posting</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1F1F1F]">
                  {['Job Title', 'Applicants', 'Hired', 'Conversion'].map(h => (
                    <th key={h} className="pb-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobPerformance.map((job, idx) => (
                  <tr key={idx} className="border-b border-[#1F1F1F]/50 hover:bg-white/2 transition-colors">
                    <td className="py-3 font-semibold text-white">{job.title}</td>
                    <td className="py-3 text-gray-400 text-center">{job.applicants}</td>
                    <td className="py-3 text-center font-bold" style={{ color: '#00C853' }}>{job.hired}</td>
                    <td className="py-3 text-center font-bold font-mono" style={{ color: '#FF6A00' }}>{job.conversionRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skill Demand */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          <div>
            <h3 className="text-sm font-semibold text-white">Hot Skill Demands</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">Most requested skills in job requisitions</p>
          </div>
          {skillDemand.length === 0 ? (
            <div className="text-sm text-gray-600">Post jobs with required skills to see this data.</div>
          ) : (
            <div className="space-y-3">
              {skillDemand.map((s, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-white">{s.skill}</span>
                    <span className="text-[10px] text-gray-600">{s.count} jobs</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#2A2A2A' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((s.count / 3) * 100, 100)}%`, background: '#FF6A00', boxShadow: '0 0 6px rgba(255,106,0,0.5)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;
