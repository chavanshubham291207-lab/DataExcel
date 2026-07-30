import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import VoiceGenieHeader from '../components/voice/VoiceGenieHeader';
import VoiceGenieSidebar from '../components/voice/VoiceGenieSidebar';
import VoiceControls from '../components/voice/VoiceControls';
import VoiceChat from '../components/voice/VoiceChat';
import { speechService } from '../services/voice/SpeechService';
import { sttService } from '../services/voice/SpeechRecognition';
import api from '../utils/api';

const VoiceGenie = () => {
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking' | 'completed'
  const [isMuted, setIsMuted] = useState(false);
  const [role, setRole] = useState('candidate');
  const [messages, setMessages] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const hasGreetedRef = useRef(false);
  const currentTranscriptRef = useRef('');
  const isProcessingRef = useRef(false);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/ai/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/ai/conversation?conversationId=${conversationId}`);
      if (res.data && res.data.conversation && res.data.conversation.messages) {
        const loadedMsgs = res.data.conversation.messages.map(m => ({
          sender: m.role === 'assistant' ? 'ai' : 'user',
          text: m.content
        }));
        setMessages(loadedMsgs);
        setActiveConversationId(conversationId);
      }
    } catch (err) {
      console.warn('Failed to load conversation:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await api.delete(`/ai/conversation?conversationId=${conversationId}`);
      fetchConversations();
      if (activeConversationId === conversationId) {
        setMessages([]);
        setActiveConversationId(null);
      }
    } catch (err) {
      console.warn('Failed to delete conversation:', err.message);
    }
  };

  const handleRenameConversation = async (conversationId, newTitle) => {
    try {
      await api.patch(`/ai/conversations/${conversationId}/rename`, { title: newTitle });
      fetchConversations();
    } catch (err) {
      console.warn('Failed to rename conversation:', err.message);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.post('/ai/conversations/new');
      setActiveConversationId(res.data.conversation.conversationId);
      setMessages([]);
      setErrorMessage('');
      fetchConversations();
    } catch (err) {
      console.error('Failed to create new chat:', err);
      setErrorMessage('Failed to create new chat.');
    }
  };

  useEffect(() => {
    const savedRole = (localStorage.getItem('role') || 'candidate').trim().toLowerCase();
    setRole(savedRole);

    fetchConversations();

    return () => {
      speechService.stopAll();
    };
  }, []);

  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    speechService.setMuted(newMuteState);
  };

  const handleStartListening = () => {
    if (isLoading || voiceState === 'listening' || isProcessingRef.current) return;

    speechService.stopAll();
    setVoiceState('listening');
    setTranscript('');
    setErrorMessage('');
    currentTranscriptRef.current = '';

    sttService.startListening({
      onStart: () => {
        setVoiceState('listening');
        console.log('MIC STARTED');
      },
      onResult: ({ transcript: currentText, isFinal }) => {
        currentTranscriptRef.current = currentText;
        setTranscript(currentText);

        if (isFinal && currentText.trim() && !isProcessingRef.current) {
          console.log('USER SPEECH:', currentText);
          sttService.stopListening();
          processUserQuery(currentText);
        }
      },
      onWakeWord: (detectedText) => {
        const cleanQuery = detectedText
          .replace(/hey voicegenie/gi, '')
          .replace(/hey genie/gi, '')
          .trim();

        if (cleanQuery && !isProcessingRef.current) {
          console.log('USER SPEECH:', cleanQuery);
          sttService.stopListening();
          processUserQuery(cleanQuery);
        }
      },
      onEnd: () => {
        const spokenText = currentTranscriptRef.current.trim();
        if (spokenText && !isProcessingRef.current) {
          console.log('USER SPEECH:', spokenText);
          processUserQuery(spokenText);
        } else if (!isProcessingRef.current) {
          setVoiceState('idle');
        }
      },
      onError: (errCode) => {
        console.warn('[VoiceGenie] Speech recognition error handler:', errCode);
        setVoiceState('idle');

        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          const alertMsg = 'Microphone access is blocked in your browser. Please click the camera/mic icon in your address bar and grant permission.';
          setErrorMessage(alertMsg);
          setMessages(prev => [...prev, { sender: 'ai', text: `⚠️ **Microphone Access Error:** ${alertMsg}` }]);
        } else if (errCode === 'no-speech') {
          const alertMsg = 'No speech detected. Please try clicking the microphone and speaking clearly.';
          setErrorMessage(alertMsg);
        } else if (errCode === 'network') {
          setErrorMessage('Network error during speech recognition.');
        } else if (errCode === 'speech-not-supported') {
          setMessages(prev => [...prev, { sender: 'ai', text: '⚠️ Web Speech API is not supported in this browser. Please use Chrome or Edge.' }]);
        }
      }
    });
  };

  const handleStopListening = () => {
    sttService.stopListening();
    const spokenText = currentTranscriptRef.current.trim();
    if (spokenText && !isProcessingRef.current) {
      processUserQuery(spokenText);
    } else {
      setVoiceState('idle');
    }
  };

  const processUserQuery = async (queryText) => {
    if (!queryText || !queryText.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const userText = queryText.trim();
    currentTranscriptRef.current = '';

    console.log('[VoiceGenie] Processing user query:', userText);

    // 1. Display user's spoken message in chat transcript immediately
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setVoiceState('thinking');
    setIsLoading(true);
    setTranscript('');
    setErrorMessage('');

    try {
      let currentConvId = activeConversationId;
      if (!currentConvId) {
        const resNew = await api.post('/ai/conversations/new');
        currentConvId = resNew.data.conversation.conversationId;
        setActiveConversationId(currentConvId);
      }

      // 2. Send recognized text to backend AI endpoint
      const res = await api.post('/ai/chat', { 
        message: userText, 
        conversationId: currentConvId 
      });
      
      const replyText = res.data?.reply || 'VoiceGenie received your request and completed database evaluation.';

      console.log('[VoiceGenie] AI response received:', replyText.slice(0, 80));

      // 3. Display AI response in chat transcript
      setMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
      
      if (messages.length === 0) {
        fetchConversations();
      }

      // 4. Convert AI response back to speech using SpeechSynthesis API
      speechService.speakResponse(replyText, {
        onStart: () => setVoiceState('speaking'),
        onEnd: () => {
          setVoiceState('completed');
          isProcessingRef.current = false;
        },
        onError: () => {
          setVoiceState('completed');
          isProcessingRef.current = false;
        }
      });

    } catch (err) {
      console.error('[VoiceGenie] AI Backend API Error:', err);
      const errorDetail = err.response?.data?.error || err.response?.data?.message || 'Server connectivity issue';
      const errReply = `⚠️ **API Error:** I encountered an issue processing your request (${errorDetail}). Please verify server status.`;
      
      setMessages(prev => [...prev, { sender: 'ai', text: errReply }]);
      setVoiceState('idle');
      isProcessingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const msg = inputMessage;
    setInputMessage('');
    processUserQuery(msg);
  };

  const handleReplaySpeech = (text) => {
    speechService.speakResponse(text, {
      onStart: () => setVoiceState('speaking'),
      onEnd: () => setVoiceState('completed')
    });
  };

  const handleSelectCommand = (cmdText) => {
    processUserQuery(cmdText);
  };

  const handleStopSpeech = () => {
    speechService.stopAll();
    setVoiceState('idle');
    isProcessingRef.current = false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090909] text-white font-sans overflow-hidden">
      {/* Header Bar */}
      <VoiceGenieHeader
        voiceState={voiceState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        role={role}
        onNewChat={handleNewChat}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Sidebar Cheatsheet */}
        <VoiceGenieSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />

        {/* Center/Right Content Area */}
        <main className="flex-1 flex flex-col p-6 overflow-hidden gap-6 relative">
          {/* Error Banner Notification if microphone blocked or error occurs */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between animate-fade-in">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="text-red-400 font-bold ml-4">✕</button>
            </div>
          )}

          {/* Top Voice Core Controls & Waveform */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex-shrink-0">
            <VoiceControls
              voiceState={voiceState}
              onStartListen={handleStartListening}
              onStopListen={handleStopListening}
              onStopSpeech={handleStopSpeech}
              transcript={transcript}
            />
          </div>

          {/* Bottom Chat History Stream */}
          <div className="flex-1 flex min-h-0 relative">
            {messages.length === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none pb-20">
                <div className="text-center space-y-4 mb-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Mic size={32} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">How can I help you today?</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-2xl w-full px-8 pointer-events-auto">
                  {[
                    "Find React Developers", "Interview Tips",
                    "Analyze a Resume", "Show Job Openings"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => processUserQuery(suggestion)}
                      className="p-4 rounded-xl bg-[#161616] border border-white/10 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all text-sm text-gray-300 text-left cursor-pointer shadow-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <VoiceChat
              messages={messages}
              onReplaySpeech={handleReplaySpeech}
              onSendMessage={handleSendMessage}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VoiceGenie;
