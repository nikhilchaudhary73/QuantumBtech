import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Send, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupport } from '../hooks/useSupport';

const HelpSupport: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const { messages, sendMessage: sendSupportMessage } = useSupport();

  const [messageText, setMessageText] = useState('');
  
  // Real-time filtered messages based on logged in user
  const userIdentifier = user?.email || user?.phoneNumber || 'unknown';
  const userMessages = messages.filter(m => m.userEmail === userIdentifier);

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messageText.trim()) return;

    const newMsg = {
      userName: user.name || userIdentifier,
      userEmail: userIdentifier,
      message: messageText.trim(),
      timestamp: Date.now()
    };

    const res = await sendSupportMessage(newMsg);
    
    if (res.success) {
      setMessageText('');
      setSuccessMsg('Your message has been sent to our support team!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      alert("Failed to send message: " + res.message);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center md:text-left mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex justify-center md:justify-start items-center gap-3">
          <HelpCircle className="text-indigo-500" size={32} />
          Help & Support
        </h1>
        <p className="text-slate-500 mt-2">Need assistance? Send us a message and we'll get back to you soon.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="md:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Send a Message</h2>
          
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">How can we help you?</label>
              <textarea 
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner"
                placeholder="Describe your issue or ask a question..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={!messageText.trim()}
              className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-xl font-bold shadow-md transition-all mt-2"
            >
              <Send size={18} /> Send Message
            </button>
          </form>
        </div>

        {/* Message History */}
        <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Previous Messages</h2>
          
          <div className="space-y-6">
            {userMessages.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                 <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                 <p>You haven't sent any support messages yet.</p>
              </div>
            ) : (
              userMessages.map(msg => (
                <div key={msg.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">You wrote:</div>
                      <div className="text-xs text-slate-400 font-mono">{new Date(msg.timestamp).toLocaleString()}</div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  
                  {msg.reply ? (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-900/30">
                       <div className="font-bold text-indigo-700 dark:text-indigo-400 text-sm mb-1 flex items-center gap-1">
                          <CheckCircle size={14} /> Admin Reply:
                       </div>
                       <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.reply}</p>
                    </div>
                  ) : (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-500 bg-white dark:bg-slate-900">
                      <Clock size={14} /> Awaiting reply from support...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
