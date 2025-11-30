
import React, { useState } from 'react';
import { Lock, Heart, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Password check: "14 21"
    if (password.trim() === '14 21') {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500); // Shake animation reset
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        
        {/* Card */}
        <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-xl overflow-hidden transform rotate-1">
            
            {/* Header */}
            <div className="bg-rose-400 p-6 border-b-4 border-slate-900 flex flex-col items-center justify-center text-center">
                <div className="bg-white p-3 rounded-full border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.2)] mb-3">
                    <Lock size={32} className="text-slate-900" strokeWidth={2.5} />
                </div>
                <h1 className="font-marker text-4xl text-white drop-shadow-md">Top Secret</h1>
                <p className="font-hand text-rose-100 font-bold text-lg mt-1">For us only</p>
            </div>

            {/* Form */}
            <div className="p-8 bg-white">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter code..."
                            className={`
                                w-full bg-slate-50 border-4 border-slate-900 rounded-lg px-4 py-3 
                                font-marker text-2xl text-center text-slate-800 tracking-widest
                                focus:outline-none focus:bg-yellow-50 transition-all
                                ${error ? 'animate-shake border-rose-500 text-rose-500' : ''}
                            `}
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit"
                        className="group relative bg-slate-900 text-white py-3 rounded-lg font-hand font-bold text-xl hover:bg-slate-800 transition-all active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(253,224,71,1)]"
                    >
                        <span className="flex items-center justify-center gap-2">
                            Enter <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </form>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-slate-100 border-t-4 border-slate-900 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 font-hand text-sm">
                    <span>Locked with love</span>
                    <Heart size={12} fill="currentColor" />
                </div>
            </div>

        </div>

      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
