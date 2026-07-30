import React, { useState } from 'react';
import { Bot, Play, Award, Mic, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, Sparkles, Send } from 'lucide-react';

const CMockInterview = () => {
  const [interviewType, setInterviewType] = useState('Technical');
  const [activeSession, setActiveSession] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const questions = {
    Technical: [
      'Explain how the Virtual DOM works in React and how reconciliation optimizes render performance.',
      'How do you design a database schema to support real-time high-throughput message processing?',
      'What are the trade-offs between REST APIs and GraphQL for enterprise mobile applications?'
    ],
    Behavioral: [
      'Describe a situation where you had a critical disagreement with a senior engineer and how you resolved it.',
      'Tell me about a complex project deadline you missed and what steps you took afterward.'
    ],
    HR: [
      'Why do you want to join our engineering team over other tech companies?',
      'Where do you see your technical trajectory progressing over the next 3 years?'
    ]
  };

  const currentQuestions = questions[interviewType] || questions.Technical;

  const handleStart = () => {
    setActiveSession(true);
    setQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    setTimeout(() => {
      setFeedback({
        confidenceScore: 88,
        communicationScore: 92,
        technicalDepthScore: 85,
        summary: 'Excellent explanation of core concepts with clear architectural vocabulary. Included key terms like reconciliation, key props, and diffing algorithm.',
        improvements: 'Consider adding a brief real-world code sample or performance metric from past experience.'
      });
      setEvaluating(false);
    }, 1200);
  };

  const handleNext = () => {
    if (questionIndex < currentQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setUserAnswer('');
      setFeedback(null);
    } else {
      setActiveSession(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111] p-6 rounded-2xl border border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Mock Interview Simulator</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Voice & Text Ready</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Practice Technical, Behavioral, and HR interviews with instant AI scoring</p>
        </div>
        {!activeSession ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.4)' }}
          >
            <Play size={14} />
            <span>Start Practice Round</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveSession(false)}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-all cursor-pointer"
          >
            End Interview
          </button>
        )}
      </div>

      {!activeSession ? (
        /* Setup Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { type: 'Technical', desc: 'System design, React, Node.js, Data structures', score: '88% Avg' },
            { type: 'Behavioral', desc: 'Conflict resolution, leadership, communication', score: '91% Avg' },
            { type: 'HR', desc: 'Culture fit, career goals, compensation expectations', score: '94% Avg' }
          ].map((item) => (
            <div
              key={item.type}
              onClick={() => setInterviewType(item.type)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                interviewType === item.type
                  ? 'bg-orange-500/10 border-orange-500'
                  : 'bg-[#161616] border-[#2A2A2A] hover:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <Bot size={24} className={interviewType === item.type ? 'text-orange-500' : 'text-gray-500'} />
                <span className="text-[11px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">{item.score}</span>
              </div>
              <h3 className="text-base font-bold text-white">{item.type} Round</h3>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        /* Interactive Session */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question & Answer */}
          <div className="lg:col-span-7 bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] space-y-5">
            <div className="flex justify-between items-center text-xs text-gray-400 border-b border-[#2A2A2A] pb-3">
              <span className="font-semibold text-orange-400 uppercase tracking-wider">{interviewType} Interview</span>
              <span>Question {questionIndex + 1} of {currentQuestions.length}</span>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-[#2A2A2A]">
              <h2 className="text-sm font-semibold text-white leading-relaxed">{currentQuestions[questionIndex]}</h2>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Your Answer</label>
              <textarea
                rows={6}
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Type your response here or use voice input..."
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl p-4 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-[#2A2A2A] text-gray-400 text-xs hover:text-white transition-all cursor-pointer"
              >
                <Mic size={14} className="text-orange-500" />
                <span>Voice Input</span>
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={evaluating || !userAnswer.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)', boxShadow: '0 0 16px rgba(255,106,0,0.4)' }}
              >
                <Send size={14} className={evaluating ? 'animate-spin' : ''} />
                <span>{evaluating ? 'Evaluating...' : 'Submit Answer'}</span>
              </button>
            </div>
          </div>

          {/* AI Score Feedback Panel */}
          <div className="lg:col-span-5 bg-[#161616] p-6 rounded-2xl border border-[#2A2A2A] space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Award size={14} className="text-orange-500" />
              AI Feedback & Score
            </h2>

            {feedback ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#111] p-3 rounded-xl border border-[#2A2A2A] text-center">
                    <div className="text-lg font-bold text-orange-500">{feedback.confidenceScore}%</div>
                    <div className="text-[10px] text-gray-500 uppercase">Confidence</div>
                  </div>
                  <div className="bg-[#111] p-3 rounded-xl border border-[#2A2A2A] text-center">
                    <div className="text-lg font-bold text-green-400">{feedback.communicationScore}%</div>
                    <div className="text-[10px] text-gray-500 uppercase">Fluency</div>
                  </div>
                  <div className="bg-[#111] p-3 rounded-xl border border-[#2A2A2A] text-center">
                    <div className="text-lg font-bold text-blue-400">{feedback.technicalDepthScore}%</div>
                    <div className="text-[10px] text-gray-500 uppercase">Tech Depth</div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-[#2A2A2A] space-y-2 text-xs">
                  <div className="font-semibold text-green-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Key Highlights
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed">{feedback.summary}</p>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-[#2A2A2A] space-y-2 text-xs">
                  <div className="font-semibold text-orange-400 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Areas to Enhance
                  </div>
                  <p className="text-gray-300 text-[11px] leading-relaxed">{feedback.improvements}</p>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-[#2A2A2A] text-white text-xs font-semibold hover:border-orange-500/50 transition-all cursor-pointer"
                >
                  {questionIndex < currentQuestions.length - 1 ? 'Next Question' : 'Complete Practice'}
                </button>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2A2A2A] rounded-xl text-gray-600 space-y-2">
                <Bot size={32} className="text-gray-600 animate-bounce" />
                <p className="text-xs">Submit an answer to receive real-time AI scoring and feedback.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CMockInterview;
