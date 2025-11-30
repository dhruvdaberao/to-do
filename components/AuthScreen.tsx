
import React, { useState } from 'react';
import { ArrowRight, User, Lock, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticate: (user: { username: string }) => void;
  apiUrl: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticate, apiUrl }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegister ? 'REGISTER' : 'LOGIN',
          payload: { username, password }
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        onAuthenticate({ username });
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-xl overflow-hidden transform rotate-1">
        
        {/* Header */}
        <div className="bg-yellow-400 p-6 border-b-4 border-slate-900 text-center">
            <h1 className="font-marker text-4xl text-slate-900 drop-shadow-sm mb-2">
              {isRegister ? 'Join the Fun!' : 'Welcome Back!'}
            </h1>
            <p className="font-hand text-slate-800 font-bold">
              {isRegister ? 'Create your identity' : 'Login to continue'}
            </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4">
            {error && (
              <div className="bg-rose-100 text-rose-600 p-3 rounded-lg font-hand font-bold text-center border-2 border-rose-200">
                {error}
              </div>
            )}

            <div className="relative">
                <User className="absolute top-3.5 left-3 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    required
                />
            </div>

            <div className="relative">
                <Lock className="absolute top-3.5 left-3 text-slate-400" size={20} />
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    required
                />
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="mt-2 bg-slate-900 text-white py-3 rounded-lg font-hand font-bold text-xl hover:bg-slate-800 active:translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
               {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')} 
               {!loading && <ArrowRight size={20} />}
            </button>
        </form>

        {/* Footer Toggle */}
        <div className="bg-slate-100 p-4 text-center border-t-4 border-slate-900">
            <button 
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-slate-500 font-bold hover:text-slate-900 underline decoration-wavy decoration-rose-400 underline-offset-4"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default AuthScreen;
