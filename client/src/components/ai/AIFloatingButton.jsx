import React, { useState } from 'react';
import { Cpu, Sparkles } from 'lucide-react';
import AIAssistantModal from './AIAssistantModal';

const AIFloatingButton = ({ jobId = null }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 select-none">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-14 h-14 rounded-2xl flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF6A00, #EE0979)',
              boxShadow: '0 0 30px rgba(255,106,0,0.6), 0 4px 20px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Cpu size={24} className="text-white animate-pulse" />

            {/* Glowing badge */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black" />
            </span>

            {/* Hover tooltip */}
            <span className="absolute bottom-full mb-3 right-0 bg-black/90 border border-white/15 text-white text-xs px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl font-medium tracking-wide flex items-center gap-1.5">
              <Sparkles size={12} className="text-orange-400" />
              AI Recruitment Agent
            </span>
          </button>
        )}
      </div>

      <AIAssistantModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        jobId={jobId}
      />
    </>
  );
};

export default AIFloatingButton;
