import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, BarChart2, Star, TrendingUp, X } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid PDF or DOCX file.');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file to analyze.');
      return;
    }

    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/candidate-auth/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const result = response.data?.analysis || {
        overallScore: mockData.resumeAnalysis.overallScore,
        breakdown: {
          formatting: mockData.resumeAnalysis.sections.formatting,
          skillKeywords: mockData.resumeAnalysis.sections.keywords,
          impactMetrics: mockData.resumeAnalysis.sections.impact,
          sectionCompleteness: mockData.resumeAnalysis.sections.completeness
        },
        extractedSkills: mockData.resumeAnalysis.extractedSkills,
        missingSkills: mockData.resumeAnalysis.missingSkills,
        atsTips: mockData.resumeAnalysis.atsTips
      };
      setAnalysisResult(result);
    } catch (err) {
      console.warn('Using mock resume analysis');
      setAnalysisResult({
        overallScore: mockData.resumeAnalysis.overallScore,
        breakdown: {
          formatting: mockData.resumeAnalysis.sections.formatting,
          skillKeywords: mockData.resumeAnalysis.sections.keywords,
          impactMetrics: mockData.resumeAnalysis.sections.impact,
          sectionCompleteness: mockData.resumeAnalysis.sections.completeness
        },
        extractedSkills: mockData.resumeAnalysis.extractedSkills,
        missingSkills: mockData.resumeAnalysis.missingSkills,
        atsTips: mockData.resumeAnalysis.atsTips
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#10B981]';
    if (score >= 60) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Resume Analyzer</h1>
          <p className="text-gray-400 text-sm mt-1">Optimize your resume for ATS and get actionable feedback.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
            <X size={16} />
          </button>
        </div>
      )}

      {!analysisResult ? (
        <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-8 max-w-2xl mx-auto">
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all ${
              isDragging ? 'border-[#FF6A00] bg-[#FF6A00]/5' : 'border-[#2A2A2A] bg-[#1E1E1E]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud size={48} className={`mb-4 ${isDragging ? 'text-[#FF6A00]' : 'text-gray-500'}`} />
            <h3 className="text-white font-bold text-lg mb-2">Upload your Resume</h3>
            <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
              Drag and drop your PDF or DOCX file here, or click to browse files. Max file size: 5MB.
            </p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
            />
            
            <div className="flex gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              >
                Browse Files
              </button>
            </div>
          </div>

          {file && (
            <div className="mt-6 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-[#FF6A00]/10 p-2 rounded-lg">
                  <FileText size={24} className="text-[#FF6A00]" />
                </div>
                <div className="truncate">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!file || isUploading}
              className={`bg-[#FF6A00] hover:bg-orange-500 text-white rounded-xl px-6 py-2.5 font-semibold text-sm transition-all flex items-center gap-2 ${
                (!file || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={file && !isUploading ? { boxShadow: '0 0 20px rgba(255,106,0,0.3)' } : {}}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart2 size={18} />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col items-center">
              <h2 className="text-white font-bold text-lg mb-6 w-full text-left">Overall Score</h2>
              
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="transparent" 
                    stroke="#2A2A2A" 
                    strokeWidth="10" 
                  />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="transparent" 
                    stroke={analysisResult.overallScore >= 80 ? '#10B981' : analysisResult.overallScore >= 60 ? '#F59E0B' : '#EF4444'} 
                    strokeWidth="10" 
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - analysisResult.overallScore / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                    {analysisResult.overallScore}
                  </span>
                  <span className="text-gray-400 text-xs mt-1">out of 100</span>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm text-center mt-6">
                {analysisResult.overallScore >= 80 ? "Great job! Your resume is highly optimized." : 
                 analysisResult.overallScore >= 60 ? "Good start, but there's room for improvement." : 
                 "Needs significant improvements to pass ATS filters."}
              </p>
              
              <button 
                onClick={() => { setAnalysisResult(null); setFile(null); }}
                className="mt-6 w-full bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              >
                Analyze Another Resume
              </button>
            </div>
            
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-[#FF6A00]" />
                Extracted Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysisResult.extractedSkills?.map((skill, idx) => (
                  <span key={idx} className="bg-[#1E1E1E] border border-[#2A2A2A] text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
                {(!analysisResult.extractedSkills || analysisResult.extractedSkills.length === 0) && (
                  <p className="text-gray-500 text-sm">No skills identified.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Details & Tips */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-6">Score Breakdown</h2>
              
              <div className="space-y-6">
                {[
                  { label: 'Formatting & Readability', score: analysisResult.breakdown?.formatting || 0 },
                  { label: 'Skill Keywords', score: analysisResult.breakdown?.skillKeywords || 0 },
                  { label: 'Impact & Metrics', score: analysisResult.breakdown?.impactMetrics || 0 },
                  { label: 'Section Completeness', score: analysisResult.breakdown?.sectionCompleteness || 0 }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">{item.label}</span>
                      <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#1E1E1E] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.score >= 80 ? 'bg-[#10B981]' : item.score >= 60 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                        }`} 
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Star size={18} className="text-[#F59E0B]" />
                  Missing Key Skills
                </h2>
                <p className="text-xs text-gray-500 mb-4">Common skills in your field that are missing from your resume.</p>
                <div className="space-y-2">
                  {analysisResult.missingSkills?.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></div>
                      {skill}
                    </div>
                  ))}
                  {(!analysisResult.missingSkills || analysisResult.missingSkills.length === 0) && (
                    <p className="text-gray-500 text-sm">No missing core skills identified.</p>
                  )}
                </div>
              </div>
              
              <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#10B981]" />
                  ATS Optimization Tips
                </h2>
                <ul className="space-y-3">
                  {analysisResult.atsTips?.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle size={16} className="text-[#10B981] mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                  {(!analysisResult.atsTips || analysisResult.atsTips.length === 0) && (
                    <p className="text-gray-500 text-sm">Your resume is perfectly optimized!</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CResumeAnalyzer;
