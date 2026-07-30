import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, Clock, Check, CheckCheck, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const candidateUser = JSON.parse(localStorage.getItem('candidateUser') || '{}');
  const currentUserId = candidateUser?.id || candidateUser?._id;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      setError('');
      const res = await api.get('/messages/conversations');
      let convList = res.data?.conversations || res.data;
      if (Array.isArray(convList) && convList.length > 0) {
        setConversations(convList);
        if (convList[0] && !activeConvId) setActiveConvId(convList[0]._id || convList[0].id);
      } else {
        const mockConvs = mockData.conversations.map(c => ({
          _id: c._id,
          participants: [{ _id: 'me', name: 'Arjun Mehta' }, { _id: c.recruiterId, name: c.recruiterName, role: c.recruiterTitle, company: c.company }],
          lastMessage: c.lastMessage,
          updatedAt: c.lastMessageTime
        }));
        setConversations(mockConvs);
        if (!activeConvId) setActiveConvId(mockConvs[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load conversations, using mock data');
      const mockConvs = mockData.conversations.map(c => ({
        _id: c._id,
        participants: [{ _id: 'me', name: 'Arjun Mehta' }, { _id: c.recruiterId, name: c.recruiterName, role: c.recruiterTitle, company: c.company }],
        lastMessage: c.lastMessage,
        updatedAt: c.lastMessageTime
      }));
      setConversations(mockConvs);
      if (!activeConvId) setActiveConvId(mockConvs[0]._id);
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      setLoadingMessages(true);
      setError('');
      const res = await api.get(`/messages/${convId}`);
      let msgList = res.data?.messages || res.data;
      if (Array.isArray(msgList) && msgList.length > 0) {
        setMessages(msgList);
      } else {
        const foundConv = mockData.conversations.find(c => c._id === convId);
        setMessages(foundConv ? foundConv.messages : []);
      }
    } catch (err) {
      console.warn('Failed to load messages, using mock data');
      const foundConv = mockData.conversations.find(c => c._id === convId);
      setMessages(foundConv ? foundConv.messages : []);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;

    const activeConv = conversations.find(c => c._id === activeConvId || c.id === activeConvId);
    const receiverId = activeConv?.participants?.find(p => p._id !== currentUserId && p.id !== currentUserId)?._id || 
                       activeConv?.participants?.find(p => p !== currentUserId);

    try {
      setSending(true);
      const res = await api.post('/messages', {
        conversationId: activeConvId,
        receiverId,
        text: newMessage
      });
      const newMsg = res.data?.message || res.data;
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Update conversation list to bump recent
      setConversations(prev => {
        const updated = prev.map(c => 
          (c._id === activeConvId || c.id === activeConvId) 
            ? { ...c, lastMessage: newMsg.text, updatedAt: new Date().toISOString() }
            : c
        );
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const otherUser = c.participants?.find(p => (p._id || p.id || p) !== currentUserId);
    const name = typeof otherUser === 'object' ? otherUser?.name : 'Recruiter';
    return name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-white font-bold text-2xl">Messages</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-6 h-full overflow-hidden bg-[#161616] border border-[#2A2A2A] rounded-2xl">
        {/* Sidebar */}
        <div className="w-80 border-r border-[#2A2A2A] flex flex-col">
          <div className="p-5 border-b border-[#2A2A2A]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-[#FF6A00] focus:outline-none transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingConvs ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white/5 rounded-xl h-16 w-full mb-2" />
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 opacity-50" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeConvId === (conv._id || conv.id);
                const otherUser = conv.participants?.find(p => (p._id || p.id || p) !== currentUserId) || {};
                const name = typeof otherUser === 'object' ? (otherUser.name || 'Recruiter') : 'Recruiter';
                
                return (
                  <button
                    key={conv._id || conv.id}
                    onClick={() => setActiveConvId(conv._id || conv.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      isSelected ? 'bg-[#FF6A00]/10 border border-[#FF6A00]/20' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 border border-[#2A2A2A]">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-sm font-semibold text-white truncate">{name}</p>
                        <p className="text-[10px] text-gray-500 flex-shrink-0">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{conv.lastMessage || 'Start a conversation'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#090909]">
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-gray-600" />
              </div>
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-5 border-b border-[#2A2A2A] bg-[#161616] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center border border-[#2A2A2A]">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {conversations.find(c => (c._id || c.id) === activeConvId)?.participants?.find(p => (p._id || p.id || p) !== currentUserId)?.name || 'Recruiter'}
                  </h3>
                  <p className="text-xs text-[#FF6A00]">Active now</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF6A00]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">No messages yet. Say hi!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = (msg.senderId || msg.sender) === currentUserId;
                    return (
                      <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMe 
                              ? 'bg-[#FF6A00] text-white rounded-tr-none' 
                              : 'bg-[#1E1E1E] text-gray-200 border border-[#2A2A2A] rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <p className="text-[10px] text-gray-500">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                          {isMe && (
                            msg.read ? <CheckCheck className="w-3 h-3 text-[#FF6A00]" /> : <Check className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-5 border-t border-[#2A2A2A] bg-[#161616]">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-[#1E1E1E] border border-[#2A2A2A] text-white rounded-xl px-4 py-2.5 text-sm focus:border-[#FF6A00] focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#FF6A00] hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-[#FF6A00] text-white rounded-xl px-5 py-2.5 flex items-center justify-center transition-all"
                    style={{ boxShadow: newMessage.trim() ? '0 0 15px rgba(255,106,0,0.3)' : 'none' }}
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMessages;
