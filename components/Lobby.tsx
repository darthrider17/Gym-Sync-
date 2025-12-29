import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Users, Radio } from 'lucide-react';

export const Lobby: React.FC = () => {
  const { createRoom, joinRoom } = useRoom();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'JOIN' | 'CREATE'>('JOIN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (mode === 'CREATE') {
      createRoom(name);
    } else {
      if (!code.trim()) return;
      joinRoom(code, name);
    }
  };

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-brand-800 p-8 rounded-2xl shadow-2xl border border-brand-500 relative overflow-hidden">
        
        {/* Background Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-400 rounded-full blur-[100px] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-10"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-900 border border-brand-500 rounded-full mb-4 shadow-lg shadow-black/50">
            {/* Custom Logo: Iron Note (Music Note with Weight Plates) */}
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               {/* Beams */}
               <path d="M9 18V5l12-2v13" />
               {/* Weight Plates as Note Heads */}
               <rect x="5" y="15" width="8" height="5" rx="1" fill="currentColor" stroke="none" />
               <rect x="17" y="13" width="8" height="5" rx="1" fill="currentColor" stroke="none" />
               {/* Barbell Connector hint */}
               <path d="M5 17.5h8" stroke="brand-900" strokeWidth="1" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">Gym Muse</h1>
          <p className="text-gray-400 text-sm tracking-wide uppercase">The Midnight Session</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-brand-900 p-1.5 rounded-xl mb-6 relative z-10 border border-brand-500/50">
          <button
            onClick={() => setMode('JOIN')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              mode === 'JOIN' ? 'bg-brand-400 text-brand-900 shadow-lg' : 'text-gray-500 hover:text-white'
            }`}
          >
            Join
          </button>
          <button
            onClick={() => setMode('CREATE')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              mode === 'CREATE' ? 'bg-brand-400 text-brand-900 shadow-lg' : 'text-gray-500 hover:text-white'
            }`}
          >
            Create
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="group">
            <label className="block text-[10px] font-bold text-brand-400 mb-1 ml-1 uppercase tracking-widest opacity-80 group-focus-within:opacity-100 transition">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-brand-900 border border-brand-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition"
              placeholder="Enter nickname"
              required
            />
          </div>

          {mode === 'JOIN' && (
            <div className="animate-fade-in group">
              <label className="block text-[10px] font-bold text-brand-400 mb-1 ml-1 uppercase tracking-widest opacity-80 group-focus-within:opacity-100 transition">Room Code</label>
              <input
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-brand-900 border border-brand-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition font-mono tracking-widest text-lg"
                placeholder="0000"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-brand-400 to-yellow-500 hover:to-brand-400 text-brand-900 font-bold text-lg py-3 rounded-xl shadow-lg shadow-brand-400/20 transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            {mode === 'CREATE' ? <Radio size={20} className="stroke-[2.5]" /> : <Users size={20} className="stroke-[2.5]" />}
            {mode === 'CREATE' ? 'Start Session' : 'Join Crew'}
          </button>
        </form>
        
        <p className="mt-8 text-[10px] text-center text-gray-600 font-mono uppercase tracking-widest">
           SyncBeat v2.0 • Midnight Gold Edition
        </p>
      </div>
    </div>
  );
};