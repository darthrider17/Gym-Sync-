import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Plus, Trash2, ListMusic, Music, Link as LinkIcon, Youtube, Globe } from 'lucide-react';
import { detectPlatform, getPlatformIcon } from '../utils/helpers';
import { Platform } from '../types';

export const Queue: React.FC = () => {
  const { queue, addSong, removeSong, currentUser, playback } = useRoom();
  const [urlInput, setUrlInput] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      addSong(urlInput);
      setUrlInput('');
    }
  };

  const getIconForPlatform = (platform: Platform) => {
      switch(platform) {
          case Platform.YOUTUBE: return <Youtube size={16} />;
          default: return <Globe size={16} />;
      }
  };

  return (
    <div className="flex flex-col h-full bg-brand-800/50 backdrop-blur-sm rounded-lg border border-brand-500 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-brand-500 bg-brand-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <ListMusic className="text-brand-400" />
              <h2 className="font-bold text-lg">Shared Queue</h2>
          </div>
          <span className="text-xs bg-brand-500 px-2 py-1 rounded-full text-brand-100">
              {queue.length} Tracks
          </span>
      </div>

      {/* Add Song Input */}
      <div className="p-4 bg-brand-900/50">
        <form onSubmit={handleAdd} className="relative">
          <LinkIcon className="absolute left-3 top-3 text-gray-500" size={16} />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste YouTube or Music URL..."
            className="w-full bg-brand-800 border border-brand-500 rounded-lg py-2 pl-10 pr-12 focus:outline-none focus:border-brand-400 transition text-sm"
          />
          <button 
            type="submit"
            className="absolute right-1 top-1 bg-brand-500 hover:bg-brand-400 text-white p-1.5 rounded-md transition"
          >
            <Plus size={16} />
          </button>
        </form>
        <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span>Supported:</span>
            <span className="flex items-center gap-1 text-gray-400"><Youtube size={10} /> YouTube</span>
            <span className="flex items-center gap-1 text-gray-400">Spotify (Link)</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto p-2 scrollbar-hide space-y-2">
        {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 opacity-50">
                <Music size={32} className="mb-2" />
                <p>Queue is empty</p>
            </div>
        ) : (
            queue.map((song, index) => {
                const isPlaying = song.id === playback.currentSongId;
                return (
                    <div 
                        key={song.id}
                        className={`group flex items-center p-2 rounded-lg transition border ${
                            isPlaying 
                            ? 'bg-brand-500/20 border-brand-400' 
                            : 'bg-brand-800 hover:bg-brand-700 border-transparent'
                        }`}
                    >
                        {/* Index / Status */}
                        <div className="w-8 flex-shrink-0 text-center text-xs font-mono text-gray-500">
                            {isPlaying ? (
                                <div className="flex justify-center space-x-0.5">
                                    <div className="w-0.5 h-3 bg-brand-400 animate-pulse" />
                                    <div className="w-0.5 h-4 bg-brand-400 animate-pulse delay-75" />
                                    <div className="w-0.5 h-2 bg-brand-400 animate-pulse delay-150" />
                                </div>
                            ) : index + 1}
                        </div>

                        {/* Thumbnail */}
                        <img 
                            src={song.thumbnail} 
                            alt="thumb" 
                            className="w-10 h-10 rounded object-cover mx-2 bg-gray-900" 
                        />

                        {/* Details */}
                        <div className="flex-grow min-w-0">
                            <h4 className={`text-sm font-medium truncate ${isPlaying ? 'text-brand-400' : 'text-gray-200'}`}>
                                {song.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={`flex items-center gap-1 ${getPlatformIcon(song.platform)}`}>
                                   {getIconForPlatform(song.platform)} {song.platform}
                                </span>
                                <span>•</span>
                                <span>{song.addedBy}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        {(currentUser?.isHost || currentUser?.name === song.addedBy) && (
                            <button 
                                onClick={() => removeSong(song.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition"
                                title="Remove song"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
