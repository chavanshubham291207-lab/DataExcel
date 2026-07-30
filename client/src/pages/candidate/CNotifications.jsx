import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCircle2, MessageSquare, Briefcase, FileText, Info } from 'lucide-react';
import api from '../../utils/api';
import mockData from '../../mockData';

const CNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/candidate/notifications');
      let data = response.data?.notifications || response.data;
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data.map(n => ({
          _id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.isRead || n.read || false,
          createdAt: n.createdAt
        })));
      } else {
        setNotifications(mockData.candidateNotifications.map(n => ({
          _id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.isRead,
          createdAt: n.createdAt
        })));
      }
      setError('');
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications(mockData.candidateNotifications.map(n => ({
        _id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.isRead,
        createdAt: n.createdAt
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    
    try {
      await api.patch(`/candidate/notifications/${id}/read`);
    } catch (err) {
      console.error('Error marking as read:', err);
      // Revert on failure
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: false } : n));
      setError('Failed to mark notification as read.');
    }
  };

  const markAllAsRead = async () => {
    if (notifications.every(n => n.read)) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    try {
      await api.post('/candidate/notifications/read-all');
      showToast('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      fetchNotifications(); // Refresh from server on fail
      setError('Failed to mark all as read.');
    }
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || (filter === 'unread' && !n.read));
  const unreadCount = notifications.filter(n => !n.read).length;

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch(type) {
      case 'interview': return <MessageSquare size={18} className="text-[#FF6A00]" />;
      case 'application': return <Briefcase size={18} className="text-[#3B82F6]" />;
      case 'document': return <FileText size={18} className="text-[#8B5CF6]" />;
      default: return <Info size={18} className="text-[#10B981]" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 bg-[#161616] border border-[#2A2A2A] shadow-xl text-white px-4 py-3 rounded-xl flex items-center gap-3 z-50 animate-fade-in">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-[#FF6A00] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Stay updated on your applications and interviews.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-[#161616] p-1 rounded-xl border border-[#2A2A2A]">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' ? 'bg-[#1E1E1E] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'unread' ? 'bg-[#1E1E1E] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Unread
            </button>
          </div>
          
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`text-sm flex items-center gap-1.5 transition-colors ${
              unreadCount > 0 ? 'text-[#FF6A00] hover:text-orange-400' : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-[#2A2A2A]">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1E1E1E] animate-pulse shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1E1E1E] rounded w-1/4 animate-pulse"></div>
                  <div className="h-3 bg-[#1E1E1E] rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#1E1E1E] rounded-full flex items-center justify-center mb-4">
              <Bell size={24} className="text-gray-500" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">All caught up!</h3>
            <p className="text-gray-400 text-sm">
              {filter === 'unread' ? "You don't have any unread notifications." : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A2A]">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-5 flex gap-4 transition-colors hover:bg-[#1A1A1A] ${!notification.read ? 'bg-[#1E1E1E]/30' : ''}`}
                onClick={() => !notification.read && markAsRead(notification._id)}
              >
                <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center shrink-0 border border-[#2A2A2A]">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm ${!notification.read ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm ${!notification.read ? 'text-gray-300' : 'text-gray-500'}`}>
                    {notification.message}
                  </p>
                </div>
                
                <div className="w-2 flex justify-center mt-1.5 shrink-0">
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-[#FF6A00] shadow-[0_0_8px_rgba(255,106,0,0.6)]"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CNotifications;
