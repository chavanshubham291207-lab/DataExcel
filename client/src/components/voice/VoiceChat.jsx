import React, { useRef, useEffect } from 'react';
import { User, Cpu, Copy, Check, Volume2, Sparkles, Send } from 'lucide-react';

const InlineParser = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-black/50 text-orange-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-orange-500/20">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-bold text-orange-400 mt-2 mb-1">{<InlineParser text={line.replace('### ', '')} />}</h3>;
        }
        if (line.startsWith('#### ')) {
          return <h4 key={i} className="text-xs font-semibold text-orange-300 mt-1.5 mb-1">{<InlineParser text={line.replace('#### ', '')} />}</h4>;
        }
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2 my-0.5 text-xs text-gray-300 leading-relaxed">
              <span className="text-orange-400 font-bold mt-0.5">•</span>
              <span><InlineParser text={line.trim().replace(/^[-*]\s+/, '')} /></span>
            </div>
          );
        }
        const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 ml-2 my-0.5 text-xs text-gray-300 leading-relaxed">
              <span className="text-orange-400 font-bold text-[11px] mt-0.5">{numMatch[1]}.</span>
              <span><InlineParser text={numMatch[2]} /></span>
            </div>
          );
        }
        if (line.trim()) {
          return <p key={i} className="text-xs text-gray-300 leading-relaxed my-0.5"><InlineParser text={line} /></p>;
        }
        return null;
      })}
    </div>
  );
};

const VoiceChat = ({ messages, onReplaySpeech, onSendMessage, inputMessage, setInputMessage, isLoading }) => {
  const chatEndRef = useRef(null);
  const [copiedIdx, setCopiedIdx] = React.useState(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group animate-fade-in`}
          >
            {msg.sender === 'ai' && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FF6A00, #EE0979)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Cpu size={16} className="text-white" />
              </div>
            )}

            <div className="relative max-w-[85%] sm:max-w-[75%]">
              <div
                className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'text-white rounded-tr-xs shadow-lg'
                    : 'text-gray-200 rounded-tl-xs backdrop-blur-md'
                }`}
                style={{
                  background: msg.sender === 'user'
                    ? 'linear-gradient(135deg, #FF6A00, #FF8C00)'
                    : 'rgba(24, 24, 27, 0.85)',
                  border: msg.sender === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}
              >
                <MarkdownRenderer text={msg.text} />
              </div>

              {/* Action buttons for AI responses */}
              {msg.sender === 'ai' && (
                <div className="flex items-center gap-2 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(msg.text, idx)}
                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-white/10"
                  >
                    {copiedIdx === idx ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => onReplaySpeech(msg.text)}
                    className="text-[10px] text-gray-400 hover:text-orange-400 flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-white/10"
                  >
                    <Volume2 size={10} /> Read Aloud
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center ml-3 flex-shrink-0 mt-0.5 bg-white/10 border border-white/15">
                <User size={16} className="text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 justify-start animate-fade-in">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FF6A00, #EE0979)' }}
            >
              <Cpu size={16} className="text-white animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-zinc-900/90 border border-white/10 flex items-center gap-2">
              <span className="text-xs text-orange-400 font-medium">VoiceGenie is reasoning</span>
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); onSendMessage(); }}
        className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type or click the microphone to speak with VoiceGenie..."
          className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-30 cursor-pointer transition-all shadow-md"
          style={{ background: 'linear-gradient(135deg, #FF6A00, #FF8C00)' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

export default VoiceChat;
