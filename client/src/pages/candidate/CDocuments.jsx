import React, { useState } from 'react';
import { Folder, FileText, Upload, Download, Trash2, Eye, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';

const CDocuments = () => {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Resume_Senior_FullStack_2026.pdf', category: 'Resume', size: '1.2 MB', date: '2026-07-20', verified: true },
    { id: 2, name: 'AWS_Solutions_Architect_Certificate.pdf', category: 'Certificates', size: '850 KB', date: '2026-06-15', verified: true },
    { id: 3, name: 'Cover_Letter_ApexSystems.pdf', category: 'Cover Letters', size: '320 KB', date: '2026-07-22', verified: false }
  ]);

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setDocuments(prev => [
        {
          id: Date.now(),
          name: file.name,
          category: 'Resume',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          date: new Date().toISOString().split('T')[0],
          verified: true
        },
        ...prev
      ]);
      setUploading(false);
    }, 1000);
  };

  const handleDelete = (id) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111] p-6 rounded-2xl border border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Candidate Document Vault</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">AES-256 Encrypted</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Manage and upload verified resumes, cover letters, certificates, and ID documents</p>
        </div>

        <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all cursor-pointer" style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.4)' }}>
          <Upload size={14} className={uploading ? 'animate-spin' : ''} />
          <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.doc,.png,.jpg" />
        </label>
      </div>

      {/* Document Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { cat: 'Resumes', count: documents.filter(d => d.category === 'Resume').length },
          { cat: 'Certificates', count: documents.filter(d => d.category === 'Certificates').length },
          { cat: 'Cover Letters', count: documents.filter(d => d.category === 'Cover Letters').length },
          { cat: 'Identity Docs', count: 0 }
        ].map(c => (
          <div key={c.cat} className="bg-[#161616] p-4 rounded-xl border border-[#2A2A2A] flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-semibold">{c.cat}</div>
              <div className="text-lg font-bold text-white mt-0.5">{c.count} Files</div>
            </div>
            <Folder size={20} className="text-orange-500 opacity-60" />
          </div>
        ))}
      </div>

      {/* Document List */}
      <div className="bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <FileText size={14} className="text-orange-500" /> Uploaded Documents ({documents.length})
        </h2>

        <div className="divide-y divide-[#2A2A2A]">
          {documents.map(doc => (
            <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/2 px-3 rounded-xl transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{doc.name}</span>
                    {doc.verified && <ShieldCheck size={14} className="text-green-400" title="Verified Document" />}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {doc.category} • {doc.size} • Uploaded {doc.date}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg bg-white/5 border border-[#2A2A2A] text-gray-400 hover:text-white transition-colors cursor-pointer" title="Preview">
                  <Eye size={14} />
                </button>
                <button className="p-2 rounded-lg bg-white/5 border border-[#2A2A2A] text-gray-400 hover:text-white transition-colors cursor-pointer" title="Download">
                  <Download size={14} />
                </button>
                <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CDocuments;
