import React from 'react';
import { X } from 'lucide-react';
import VoiceGenie from '../VoiceGenie';

/**
 * AIAssistantModal
 * Floating AI Assistant drawer overlay rendering the VoiceGenie voice component.
 */
const AIAssistantModal = ({ isOpen, onClose, jobId = null }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] sm:h-[720px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0c0c0e]">
        {/* Floating Close Overlay Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-neutral-900/80 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-lg"
          title="Close VoiceGenie"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Render VoiceGenie Core Assistant */}
        <VoiceGenie />
      </div>
    </div>
  );
};

export default AIAssistantModal;
