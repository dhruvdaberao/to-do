
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  onSend: (text: string) => void;
  currentUser: string;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, messages, onSend, currentUser }) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
        onSend(text);
        setText('');
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-[95] lg:hidden" onClick={onClose}></div>}
      
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-[100] transform transition-transform duration-300 flex flex-col border-l-0 sm:border-l-4 border-slate-900 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        {/* Header */}
        <div className="p-4 bg-yellow-400 border-b-4 border-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
              <h3 className="font-marker text-3xl text-slate-900">Room Chat</h3>
              <span className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full font-bold">{messages.length}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full"><X size={32} strokeWidth={2.5} /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-grid-pattern space-y-4">
          {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                  <MessageCircle size={48} strokeWidth={1.5} />
                  <p className="font-hand text-xl mt-2 font-bold">No messages yet!</p>
              </div>
          )}
          {messages.map((msg, i) => {
              const isMe = msg.user === currentUser;
              return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1 mb-1 px-1">
                          {!isMe && <User size={12} className="text-slate-400" />}
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{msg.user}</span>
                      </div>
                      <div className={`
                          relative px-4 py-3 max-w-[85%] font-hand font-bold text-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.15)]
                          ${isMe ? 'bg-sky-200 rounded-2xl rounded-tr-sm' : 'bg-white rounded-2xl rounded-tl-sm'}
                      `}>
                          {msg.text}
                      </div>
                  </div>
              )
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t-4 border-slate-900 bg-white">
          <div className="relative">
              <input 
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder="Say something..."
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-3 pr-12 font-hand font-bold text-lg focus:outline-none focus:bg-yellow-50 transition-colors"
              />
              <button 
                type="submit" 
                disabled={!text.trim()}
                className="absolute right-2 top-2 bottom-2 bg-slate-900 text-yellow-400 p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
              >
                  <Send size={20} />
              </button>
          </div>
        </form>

      </div>
    </>
  );
};
import { MessageCircle } from 'lucide-react';

export default ChatDrawer;
