import React, { useState } from 'react';
import { Plus, MessageSquare, Pencil, Trash2, Clock, Check, X } from 'lucide-react';

const groupConversations = (conversations) => {
  const groups = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const last7DaysStart = todayStart - 7 * 86400000;

  conversations.forEach(conv => {
    const d = new Date(conv.updatedAt || conv.createdAt).getTime();
    if (d >= todayStart) {
      groups['Today'].push(conv);
    } else if (d >= yesterdayStart) {
      groups['Yesterday'].push(conv);
    } else if (d >= last7DaysStart) {
      groups['Previous 7 Days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });

  return groups;
};

const VoiceGenieSidebar = ({
  conversations = [],
  activeConversationId = null,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const groups = groupConversations(conversations);

  const handleStartRename = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.conversationId);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (e) => {
    e.stopPropagation();
    if (editTitle.trim() && editingId) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (deletingId === id) {
      onDeleteConversation(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId(current => current === id ? null : current);
      }, 3000);
    }
  };

  return (
    <aside className="w-80 border-r border-white/10 bg-[#090909] flex flex-col hidden lg:flex select-none h-full">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition-all font-bold text-sm cursor-pointer"
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        {Object.entries(groups).map(([label, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={label}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                {label === 'Today' || label === 'Yesterday' ? <Clock size={12} /> : null}
                {label}
              </h3>
              <div className="space-y-1">
                {items.map(conv => {
                  const isActive = activeConversationId === conv.conversationId;
                  const isEditing = editingId === conv.conversationId;
                  const isDeleting = deletingId === conv.conversationId;

                  return (
                    <div
                      key={conv.conversationId}
                      onClick={() => !isEditing && onSelectConversation(conv.conversationId)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                        isActive ? 'bg-[#161616] border-l-2 border-l-orange-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <MessageSquare size={16} className={isActive ? "text-orange-400" : "text-gray-400"} />
                        
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(e);
                              if (e.key === 'Escape') handleCancelRename(e);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-black/50 border border-orange-500/50 rounded px-2 py-1 text-sm text-white outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className={`text-sm truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {conv.title?.length > 30 ? conv.title.substring(0, 30) + '...' : conv.title}
                          </span>
                        )}
                      </div>

                      {isActive && !isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={(e) => handleStartRename(e, conv)}
                            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10"
                            title="Rename"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, conv.conversationId)}
                            className={`p-1.5 rounded-md transition-colors ${
                              isDeleting 
                                ? 'text-white bg-red-500 hover:bg-red-600' 
                                : 'text-gray-400 hover:text-red-400 hover:bg-white/10'
                            }`}
                            title={isDeleting ? 'Click again to confirm' : 'Delete'}
                          >
                            {isDeleting ? <Check size={14} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      )}
                      
                      {isEditing && (
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={handleSaveRename} className="p-1 text-green-400 hover:bg-white/10 rounded">
                            <Check size={14} />
                          </button>
                          <button onClick={handleCancelRename} className="p-1 text-gray-400 hover:bg-white/10 rounded">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-white/10 text-xs text-gray-500 text-center">
        Powered by Gemini AI Engine
      </div>
    </aside>
  );
};

export default VoiceGenieSidebar;
