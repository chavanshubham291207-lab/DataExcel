import React from 'react';
import { Volume2, VolumeX, Sparkles, Mic, Cpu, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATE_BADGES = {
  idle: { label: 'VoiceGenie Ready', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  listening: { label: 'Listening...', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse' },
  thinking: { label: 'Thinking & Processing', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse' },
  speaking: { label: 'VoiceGenie Speaking', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30 animate-pulse' },
  completed: { label: 'Response Completed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
};

const VoiceGenieHeader = ({ voiceState, isMuted, onToggleMute, role, onNewChat }) => {
  const navigate = useNavigate();
  const currentBadge = STATE_BADGES[voiceState] || STATE_BADGES.idle;

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-black/40 sticky top-0 z-40 select-none">
      {/* Left Title & Status */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FF6A00, #EE0979)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Cpu size={20} className="text-white animate-pulse" />
          </div>

          <div>
            <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              VoiceGenie
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {role === 'recruiter' ? 'Recruiter AI' : 'Candidate Assistant'}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 font-medium">Your Voice-Enabled AI Recruitment Engine</div>
          </div>
        </div>
      </div>

      {/* Right Controls & Badges */}
      <div className="flex items-center gap-3">
        {/* Dynamic Voice State Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${currentBadge.color}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          {currentBadge.label}
        </div>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleMute}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-medium ${
            isMuted
              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
              : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title={isMuted ? 'Voice Muted' : 'Voice Audio Enabled'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice On'}</span>
        </button>

        {/* New Chat Button */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="px-3.5 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Start New Chat"
          >
            <span>New Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default VoiceGenieHeader;
