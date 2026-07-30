import React from 'react';
import { Mic, MicOff, Square, Sparkles, Volume2, Cpu } from 'lucide-react';
import VoiceWave from './VoiceWave';

const VoiceControls = ({ voiceState, onStartListen, onStopListen, onStopSpeech, transcript }) => {
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 space-y-6 select-none">
      {/* VoiceGenie Animated Avatar Core */}
      <div className="relative flex items-center justify-center">
        {/* Outer Glow Ring */}
        <div
          className={`absolute w-44 h-44 rounded-full transition-all duration-700 blur-2xl ${
            isListening
              ? 'bg-orange-500/40 scale-125 animate-pulse'
              : isSpeaking
                ? 'bg-pink-500/40 scale-125 animate-pulse'
                : isThinking
                  ? 'bg-purple-500/40 scale-110 animate-ping'
                  : 'bg-orange-500/15'
          }`}
        />

        {/* Outer Pulse Circles */}
        {isListening && (
          <>
            <span className="absolute w-40 h-40 rounded-full border-2 border-orange-500/60 animate-ping" />
            <span className="absolute w-48 h-48 rounded-full border border-orange-500/30 animate-pulse" />
          </>
        )}

        {/* Central Core Orb */}
        <div
          className="relative w-36 h-36 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-500 border border-white/20"
          style={{
            background: isListening
              ? 'radial-gradient(circle, #FF6A00 0%, #EE0979 100%)'
              : isSpeaking
                ? 'radial-gradient(circle, #EC4899 0%, #8B5CF6 100%)'
                : isThinking
                  ? 'radial-gradient(circle, #A855F7 0%, #3B82F6 100%)'
                  : 'radial-gradient(circle, #1F1F23 0%, #09090B 100%)',
            boxShadow: '0 0 40px rgba(255,106,0,0.3), inset 0 0 20px rgba(255,255,255,0.2)'
          }}
        >
          <Cpu size={38} className={`transition-all duration-300 ${isThinking || isListening || isSpeaking ? 'animate-bounce text-white' : 'text-orange-400'}`} />
          <span className="text-[11px] font-bold tracking-widest uppercase mt-2 text-white/90">
            VoiceGenie
          </span>
        </div>
      </div>

      {/* Dynamic Waveform Visualizer */}
      <div className="w-full max-w-xs">
        <VoiceWave state={voiceState} />
      </div>

      {/* Real-time Listening Transcript */}
      {isListening && (
        <div className="text-center px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 max-w-md animate-fade-in">
          <p className="text-xs text-orange-300 font-medium italic">
            "{transcript || 'Listening to your command...'}"
          </p>
        </div>
      )}

      {/* Main Microphone Button Controls */}
      <div className="flex items-center gap-4">
        {isSpeaking ? (
          <button
            onClick={onStopSpeech}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          >
            <Square size={16} /> Stop Speaking
          </button>
        ) : isListening ? (
          <button
            onClick={onStopListen}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 animate-pulse"
          >
            <MicOff size={18} /> Listening... Click to Send
          </button>
        ) : (
          <button
            onClick={onStartListen}
            disabled={isThinking}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-white text-sm font-bold transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FF6A00, #EE0979)',
              boxShadow: '0 0 30px rgba(255,106,0,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Mic size={20} className="group-hover:rotate-12 transition-transform" />
            <span>Speak to VoiceGenie</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceControls;
