import React, { useState } from 'react';
import { Code2, Terminal, Play, CheckCircle2, Award, BookOpen, Cpu, Sparkles, Filter } from 'lucide-react';

const CCodingPractice = () => {
  const [selectedLang, setSelectedLang] = useState('JavaScript');
  const [activeProblem, setActiveProblem] = useState(0);
  const [code, setCode] = useState(`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`);
  const [running, setRunning] = useState(false);
  const [testOutput, setTestOutput] = useState(null);

  const problems = [
    { id: 1, title: 'Two Sum (Hash Map)', difficulty: 'Easy', category: 'DSA', points: 100 },
    { id: 2, title: 'Valid Parentheses (Stack)', difficulty: 'Easy', category: 'DSA', points: 120 },
    { id: 3, title: 'Longest Substring Without Repeating Chars', difficulty: 'Medium', category: 'DSA', points: 250 },
    { id: 4, title: 'SQL Joins & Aggregations Query', difficulty: 'Medium', category: 'SQL', points: 200 },
    { id: 5, title: 'Asynchronous Event Loop Simulation', difficulty: 'Hard', category: 'JavaScript', points: 400 }
  ];

  const handleRunCode = () => {
    setRunning(true);
    setTimeout(() => {
      setTestOutput({
        status: 'ACCEPTED',
        runtime: '42 ms',
        memory: '14.2 MB',
        passed: 4,
        total: 4,
        log: 'Test Case 1: [2,7,11,15], target=9 -> Output: [0,1] (Passed)\nTest Case 2: [3,2,4], target=6 -> Output: [1,2] (Passed)\nTest Case 3: [3,3], target=6 -> Output: [0,1] (Passed)'
      });
      setRunning(false);
    }, 1000);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111] p-6 rounded-2xl border border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Coding Practice & Challenge Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">DSA & Skill Assessments</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Solve interactive coding challenges, SQL queries, and MCQs to boost recruiter match ratings</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            className="bg-[#1E1E1E] border border-[#2A2A2A] text-white text-xs font-semibold rounded-xl px-3 py-2 focus:border-orange-500 focus:outline-none"
          >
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python 3</option>
            <option value="Java">Java 17</option>
            <option value="SQL">PostgreSQL SQL</option>
          </select>
          <button
            onClick={handleRunCode}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs text-white transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.4)' }}
          >
            <Play size={14} className={running ? 'animate-spin' : ''} />
            <span>{running ? 'Executing...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Problem List */}
        <div className="lg:col-span-4 bg-[#161616] p-5 rounded-2xl border border-[#2A2A2A] space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen size={14} className="text-orange-500" /> Problem List
            </span>
            <span className="text-orange-400 font-mono text-[11px]">Rank #142</span>
          </h2>

          <div className="space-y-2">
            {problems.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setActiveProblem(idx)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  activeProblem === idx
                    ? 'bg-orange-500/10 border-orange-500'
                    : 'bg-[#111] border-[#2A2A2A] hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white truncate max-w-[200px]">{p.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                    p.difficulty === 'Medium' ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'
                  }`}>{p.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                  <span>{p.category}</span>
                  <span className="text-orange-400/80 font-mono">+{p.points} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Code Editor & Console Output */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#161616] p-5 rounded-2xl border border-[#2A2A2A] space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-3">
              <span className="font-bold text-white flex items-center gap-2">
                <Code2 size={15} className="text-orange-500" />
                {problems[activeProblem].title}
              </span>
              <span className="text-gray-500 font-mono">{selectedLang}</span>
            </div>

            <textarea
              rows={12}
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-green-400 font-mono rounded-xl p-4 text-xs leading-relaxed focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Console Result Output */}
          <div className="bg-[#161616] p-5 rounded-2xl border border-[#2A2A2A] space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} className="text-orange-500" /> Test Runner Console
            </h3>

            {testOutput ? (
              <div className="bg-[#0D0D0D] p-4 rounded-xl border border-[#2A2A2A] font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> {testOutput.status}
                  </span>
                  <div className="text-gray-500 text-[10px] space-x-3">
                    <span>Runtime: {testOutput.runtime}</span>
                    <span>Memory: {testOutput.memory}</span>
                  </div>
                </div>
                <pre className="text-gray-400 text-[11px] whitespace-pre-wrap leading-relaxed border-t border-[#2A2A2A] pt-2 mt-2">{testOutput.log}</pre>
              </div>
            ) : (
              <div className="bg-[#0D0D0D] p-4 rounded-xl border border-[#2A2A2A] text-gray-600 font-mono text-xs text-center py-6">
                Click "Run Code" to execute test cases against your solution.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCodingPractice;
