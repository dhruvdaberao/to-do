
import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

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
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[100] transform transition-transform duration-300 flex flex-col border-l-4 border-slate-900 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="p-4 bg-yellow-300 border-b-4 border-slate-900 flex justify-between items-center">
        <h3 className="font-marker text-2xl text-slate-900">Room Chat</h3>
        <button onClick={onClose}><X size={24} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-grid-pattern space-y-3">
        {messages.length === 0 && <p className="text-center text-slate-400 font-hand text-lg mt-10">Start the conversation!</p>}
        {messages.map((msg, i) => {
            const isMe = msg.user === currentUser;
            return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-slate-500 ml-1">{msg.user}</span>
                    <div className={`
                        p-3 rounded-xl max-w-[85%] font-hand font-bold text-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.2)]
                        ${isMe ? 'bg-sky-200 rounded-tr-none' : 'bg-white rounded-tl-none'}
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
        <div className="flex gap-2">
            <input 
                value={text} onChange={e => setText(e.target.value)}
                placeholder="Type here..."
                className="flex-1 border-2 border-slate-900 rounded-lg px-3 py-2 font-hand font-bold"
            />
            <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-700">
                <Send size={20} />
            </button>
        </div>
      </form>

    </div>
  );
};

export default ChatDrawer;
