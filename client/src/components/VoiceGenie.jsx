import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw, Volume2, VolumeX, Mic, MicOff, CheckCircle2, Radio, Zap, Cpu, Compass, FileText, UserCheck, Briefcase, ChevronRight, MessageSquare, ShieldCheck, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';
import { sttService } from '../services/voice/SpeechRecognition';
import { ttsService } from '../services/voice/TextToSpeech';

const CANDIDATE_ACTIONS = [
  { label: 'Find React Jobs', icon: Briefcase, prompt: 'Find React and Node.js software jobs in Pune and Remote', desc: 'Browse matching requisitions' },
  { label: 'Resume Analysis', icon: FileText, prompt: 'Analyze my resume and show my ATS readiness score', desc: 'Check ATS score & skills' },
  { label: 'Interview Prep', icon: Compass, prompt: 'Give me top technical interview preparation questions for full stack roles', desc: 'Practice tech assessments' },
  { label: 'Application Status', icon: UserCheck, prompt: 'Show my applications and interview status', desc: 'Track pending invitations' }
];

const RECRUITER_ACTIONS = [
  { label: 'Find Candidates', icon: UserCheck, prompt: 'Find candidates with React, Node.js and MongoDB skills', desc: 'Filter talent pipeline' },
  { label: 'Rank Candidates', icon: Zap, prompt: 'Rank candidate pool for my active job requisitions', desc: 'AI fit scoring & match %' },
  { label: 'Create Job Req', icon: Briefcase, prompt: 'Create a job description for Senior Full Stack Engineer', desc: 'Generate job descriptions' },
  { label: 'Schedule Interview', icon: Compass, prompt: 'Show pending interview invitations and candidates', desc: 'Manage candidate invites' }
];

const VoiceGenie = () => {
  const [role, setRole] = useState('candidate');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState('');
  const [unsupportedBrowser, setUnsupportedBrowser] = useState(false);

  const messagesEndRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const isProcessingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, liveTranscript]);

  const loadConversation = async () => {
    try {
      const res = await api.get('/ai/conversation');
      if (res.data && res.data.conversation && res.data.conversation.messages) {
        const loadedMsgs = res.data.conversation.messages.map((m, index) => ({
          id: index,
          sender: m.role === 'assistant' ? 'ai' : 'user',
          text: m.content,
          timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(loadedMsgs);
      }
    } catch (err) {
      console.warn('Failed to load conversation history:', err.message);
    }
  };

  const handleNewChat = async () => {
    try {
      await api.delete('/ai/conversation');
      setMessages([]);
      setError('');
    } catch (err) {
      console.error('Failed to clear conversation:', err);
      setError('Failed to clear conversation memory.');
    }
  };

  useEffect(() => {
    const savedRole = (localStorage.getItem('role') || 'candidate').trim().toLowerCase();
    const effectiveRole = savedRole.includes('candidate') ? 'candidate' : 'recruiter';
    setRole(effectiveRole);

    if (!sttService.isSupported) {
      setUnsupportedBrowser(true);
    }

    loadConversation();

    return () => {
      sttService.stopListening();
      ttsService.stop();
    };
  }, []);

  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputMessage;
    if (!textToSend || !textToSend.trim() || isLoading || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const userText = textToSend.trim();
    if (!customText) setInputMessage('');
    setLiveTranscript('');
    setError('');

    console.log('MIC STARTED -> USER SPEECH:', userText);

    const userMsgObj = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);

    try {
      // POST to http://localhost:5000/api/ai/chat
      console.log('SENDING TO GEMINI:', userText);
      const res = await api.post('/ai/chat', { message: userText });
      
      const replyText = res.data?.reply || res.data?.message || 'VoiceGenie completed evaluation.';
      const toolUsed = res.data?.toolUsed || null;

      console.log('GEMINI RESPONSE:', replyText.slice(0, 100));

      const aiMsgObj = {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText,
        toolUsed: toolUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsgObj]);

      // Speak response back using Text-to-Speech
      if (!isMuted) {
        ttsService.speak(replyText, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }

    } catch (err) {
      console.error('[VoiceGenie Component] Chat API Error:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to connect to VoiceGenie backend service.';
      setError(errMsg);

      const errorMsgObj = {
        id: Date.now() + 1,
        sender: 'ai',
        isError: true,
        text: `⚠️ **Connection Error:** ${errMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, errorMsgObj]);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleToggleListening = () => {
    if (!sttService.isSupported) {
      setError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      sttService.stopListening();
      setIsListening(false);
      const spokenText = currentTranscriptRef.current.trim();
      if (spokenText && !isProcessingRef.current) {
        handleSendMessage(spokenText);
      }
      return;
    }

    ttsService.stop();
    setIsSpeaking(false);
    setIsListening(true);
    setLiveTranscript('');
    currentTranscriptRef.current = '';
    setError('');

    console.log('MIC STARTED');

    sttService.startListening({
      onStart: () => {
        setIsListening(true);
      },
      onResult: ({ transcript: currentText, isFinal }) => {
        currentTranscriptRef.current = currentText;
        setLiveTranscript(currentText);

        if (isFinal && currentText.trim() && !isProcessingRef.current) {
          console.log('USER SPEECH:', currentText);
          sttService.stopListening();
          setIsListening(false);
          handleSendMessage(currentText);
        }
      },
      onEnd: () => {
        setIsListening(false);
        const spokenText = currentTranscriptRef.current.trim();
        if (spokenText && !isProcessingRef.current) {
          console.log('USER SPEECH:', spokenText);
          handleSendMessage(spokenText);
        }
      },
      onError: (errCode) => {
        setIsListening(false);
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          setError('Microphone access is blocked. Please allow microphone permission in your browser address bar.');
        } else if (errCode === 'no-speech') {
          setError('No speech detected. Please try clicking the microphone and speaking clearly.');
        } else if (errCode === 'network') {
          setError('Network error during speech recognition.');
        }
      }
    });
  };

  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    ttsService.setMuted(newMuteState);
    if (newMuteState) {
      setIsSpeaking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = role === 'recruiter' ? RECRUITER_ACTIONS : CANDIDATE_ACTIONS;

  const getAIStateBadge = () => {
    if (isListening) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.25)]">
          <Radio className="w-3.5 h-3.5 text-red-400 animate-spin" />
          <span>Listening to your voice...</span>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Thinking & Querying MCP Tools...</span>
        </div>
      );
    }
    if (isSpeaking) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          <span>Voice Synthesis Active</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-white/10 text-neutral-300 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>VoiceGenie AI Agent • Ready</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto rounded-3xl border border-white/10 bg-[#0B0C10]/95 backdrop-blur-3xl text-white shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden font-sans">
      {/* Header Navbar Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#16181D] via-[#0B0C10] to-[#16181D] backdrop-blur-2xl flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6B00] via-[#FF8800] to-[#FFB700] flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.45)] border border-white/20">
              <Cpu className="w-6 h-6 text-white animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0B0C10]" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                VoiceGenie AI
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FFA000] text-black uppercase tracking-wider shadow-sm">
                  {role === 'recruiter' ? 'Recruiter Hub' : 'Candidate Hub'}
                </span>
              </h2>
            </div>
            <div className="mt-1">{getAIStateBadge()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mute Toggle Button */}
          <button
            onClick={handleToggleMute}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isMuted
                ? 'text-red-400 bg-red-500/15 border border-red-500/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
            title={isMuted ? 'Unmute Audio Output' : 'Mute Audio Output'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 hover:bg-[#FF6B00]/20 transition-all cursor-pointer"
            title="Start New Chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Unsupported Browser Alert */}
      {unsupportedBrowser && (
        <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 animate-fade-in flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Speech Recognition is not supported in this browser. Please use Chrome or Edge for voice input.</span>
        </div>
      )}

      {/* Error Notification Bar */}
      {error && (
        <div className="px-6 py-2.5 bg-red-500/15 border-b border-red-500/30 text-red-300 text-xs flex items-center justify-between animate-fade-in flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-300 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#0B0C10] via-[#101216] to-[#0B0C10]">
        
        {/* Production AI Hero Empty State (When Chat History is Empty) */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-fade-in max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF6B00] via-[#FF8800] to-[#FFB700] flex items-center justify-center shadow-[0_0_40px_rgba(255,107,0,0.5)] border border-white/20 mb-5">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Hi, I am VoiceGenie AI Recruitment Assistant
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-lg leading-relaxed">
              I am connected to your database via <strong className="text-orange-400 font-semibold">Model Context Protocol (MCP) Tools</strong> and powered by Google Gemini LLM. Speak or type a command to get started.
            </p>

            {/* Feature Hero Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6 text-left">
              {quickActions.map(({ label, icon: Icon, prompt, desc }) => (
                <button
                  key={label}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading || isListening}
                  className="group p-4 rounded-2xl bg-[#16181D]/90 border border-white/10 hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(255,107,0,0.2)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-[#FF6B00] transition-colors" />
                  </div>
                  <div className="font-bold text-xs text-white group-hover:text-[#FF6B00] transition-colors">{label}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream Bubble Output */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 max-w-[88%] sm:max-w-[82%] animate-fade-in ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {/* Avatar Container */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-[#FF6B00] to-[#FF8800] text-white shadow-orange-600/30 border border-white/20'
                  : msg.isError
                  ? 'bg-red-900/50 border border-red-700 text-red-300'
                  : 'bg-[#16181D] text-[#FF6B00] border border-white/10 shadow-[0_0_15px_rgba(255,107,0,0.15)]'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
            </div>

            {/* Message Card */}
            <div className="flex flex-col gap-1">
              <div
                className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#FF6B00] via-[#FF7700] to-[#FF8800] text-white rounded-tr-xs shadow-lg shadow-orange-600/20 border border-white/10'
                    : msg.isError
                    ? 'bg-red-950/60 border border-red-800/60 text-red-200 rounded-tl-xs backdrop-blur-md'
                    : 'bg-[#16181D]/95 border border-white/10 text-neutral-100 rounded-tl-xs shadow-xl backdrop-blur-xl'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* MCP Tool Execution Tag */}
                {msg.toolUsed && (
                  <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-[#FF6B00] font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>MCP Tool Executed: <strong className="text-white font-bold">{msg.toolUsed}</strong></span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] text-neutral-500 px-1 font-medium ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Live Speech Recognition Waveform Indicator */}
        {isListening && (
          <div className="flex gap-3.5 max-w-[85%] ml-auto flex-row-reverse items-center animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.6)]">
              <Mic className="w-4.5 h-4.5" />
            </div>
            <div className="p-4 rounded-2xl rounded-tr-xs bg-red-500/10 border border-red-500/30 text-red-200 text-xs sm:text-sm italic shadow-lg animate-pulse backdrop-blur-md flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:0s]" />
                <span className="w-1.5 h-6 bg-amber-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-3 bg-red-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
              <span>{liveTranscript || "Listening to your voice..."}</span>
            </div>
          </div>
        )}

        {/* Shimmer Thinking Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 max-w-[85%] mr-auto items-center animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-[#16181D] border border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00] shadow-md">
              <Bot className="w-4.5 h-4.5 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-xs bg-[#16181D]/90 border border-white/10 text-neutral-300 text-xs sm:text-sm flex items-center gap-3 backdrop-blur-md">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-xs text-neutral-400 font-medium">VoiceGenie is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips Footer Toolbar */}
      {messages.length > 0 && (
        <div className="px-6 py-2.5 border-t border-white/10 bg-[#0B0C10]/90 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          {quickActions.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading || isListening}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs bg-[#16181D] border border-white/10 text-neutral-300 hover:text-white hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/10 transition-all flex-shrink-0 cursor-pointer disabled:opacity-40 font-medium"
            >
              <Icon className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Toolbar with Microphone Button */}
      <div className="p-4 border-t border-white/10 bg-[#16181D]/95 backdrop-blur-2xl flex-shrink-0">
        <div className="flex items-center gap-3 bg-[#0B0C10] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#FF6B00]/60 transition-colors shadow-inner">
          {/* Microphone Button */}
          <button
            onClick={handleToggleListening}
            disabled={isLoading}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 cursor-pointer ${
              isListening
                ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse'
                : 'bg-[#16181D] text-neutral-400 hover:text-white hover:bg-neutral-800'
            } disabled:opacity-50`}
            title={isListening ? 'Stop Listening' : 'Speak to VoiceGenie'}
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening... Speak into your microphone" : "Ask VoiceGenie about jobs, candidates, or applications..."}
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none resize-none max-h-24 disabled:opacity-50 font-sans"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading || isListening}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] via-[#FF7700] to-[#FF8800] text-white font-medium hover:opacity-95 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 shadow-md shadow-orange-600/30"
            title="Send Message"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceGenie;
