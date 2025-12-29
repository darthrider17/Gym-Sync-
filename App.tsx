import React from 'react';
import { useRoom } from './context/RoomContext';
import { Lobby } from './components/Lobby';
import { Player } from './components/Player';
import { Queue } from './components/Queue';
import { LogOut, Users, Wifi } from 'lucide-react';

const App: React.FC = () => {
  const { roomCode, currentUser, leaveRoom, users } = useRoom();

  if (!roomCode || !currentUser) {
    return <Lobby />;
  }

  return (
    <div className="h-screen flex flex-col bg-brand-900 text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-brand-800 border-b border-brand-500 flex items-center justify-between px-6 shadow-md z-20">
        <div className="flex items-center gap-4">
          <div className="text-brand-400 bg-brand-900 p-1.5 rounded-lg border border-brand-500">
             {/* Small Iron Note Logo */}
             <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M9 18V5l12-2v13" />
               <rect x="5" y="15" width="8" height="5" rx="1" fill="currentColor" stroke="none" />
               <rect x="17" y="13" width="8" height="5" rx="1" fill="currentColor" stroke="none" />
             </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">Gym Muse</h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                <span className="text-brand-400 font-mono">
                   #{roomCode}
                </span>
                <span className="flex items-center gap-1">
                   <Wifi size={10} className="text-brand-400" />
                   {currentUser.isHost ? 'HOST' : 'LISTENER'}
                </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           {/* Connected Users */}
           <div className="flex items-center gap-2 bg-brand-900 px-3 py-1.5 rounded-full border border-brand-500">
               <Users size={14} className="text-gray-400" />
               <span className="text-sm font-bold text-gray-200">{users.length}</span>
           </div>
           
           <button 
             onClick={leaveRoom}
             className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg transition"
             title="Leave Room"
           >
             <LogOut size={20} />
           </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left: Player (Takes up 2 cols on large screens) */}
        <div className="lg:col-span-2 h-[400px] lg:h-auto flex flex-col shadow-2xl shadow-black/50 rounded-2xl border border-brand-500">
          <Player />
        </div>

        {/* Right: Queue */}
        <div className="h-full min-h-0">
          <Queue />
        </div>
      
      </main>
    </div>
  );
};

export default App;