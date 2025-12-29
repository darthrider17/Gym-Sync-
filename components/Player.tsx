import React, { useEffect, useRef, useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Platform } from '../types';
import { Play, Pause, SkipForward, AlertCircle, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const SYNC_THRESHOLD = 2.0; // Seconds allowed drift before forcing seek
const SYNC_INTERVAL = 1000; // MS to check sync

export const Player: React.FC = () => {
  const { playback, queue, updatePlayback, currentUser, nextSong } = useRoom();
  const currentSong = queue.find(s => s.id === playback.currentSongId);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  // === YouTube API Initialization ===
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);

  // === Player Instance Management ===
  useEffect(() => {
    if (playerReady && currentSong?.platform === Platform.YOUTUBE && containerRef.current) {
        // Destroy old player if exists to prevent duplicates or errors
        if (playerRef.current) {
            try {
                playerRef.current.destroy();
            } catch(e) { /* ignore */ }
        }

        const videoId = extractVideoID(currentSong.url);
        
        playerRef.current = new window.YT.Player(containerRef.current, {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'controls': currentUser?.isHost ? 1 : 0, // Hide controls for listeners
                'disablekb': currentUser?.isHost ? 0 : 1,
                'rel': 0,
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
            }
        });
    }
  }, [playerReady, currentSong?.id]);


  // === Helper: Extract YT ID ===
  const extractVideoID = (url: string) => {
    let videoId = '';
    try {
        if(url.includes('youtu.be')) {
            videoId = url.split('/').pop() || '';
        } else {
            videoId = new URL(url).searchParams.get('v') || '';
        }
    } catch(e) { console.error(e); }
    return videoId;
  };

  // === Event Handlers ===
  const onPlayerReady = (event: any) => {
    // If we loaded a song mid-stream (late join), seek to correct time
    if (playback.isPlaying) {
        event.target.playVideo();
        // Calculate current estimated time
        const timePassed = (Date.now() - playback.lastUpdated) / 1000;
        const targetTime = playback.timestamp + timePassed;
        event.target.seekTo(targetTime, true);
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (!currentUser?.isHost) return; // Only Host updates state based on player events

    const playerState = event.data;
    const currentTime = event.target.getCurrentTime();

    if (playerState === window.YT.PlayerState.PLAYING) {
       updatePlayback(true, currentTime, currentSong?.id || null);
    } else if (playerState === window.YT.PlayerState.PAUSED) {
       updatePlayback(false, currentTime, currentSong?.id || null);
    } else if (playerState === window.YT.PlayerState.ENDED) {
       nextSong();
    }
  };

  // === Host Periodic Sync Broadcast ===
  useEffect(() => {
    if (!currentUser?.isHost || !playerRef.current || !playback.isPlaying) return;

    const interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const time = playerRef.current.getCurrentTime();
            // We update the context, which broadcasts to listeners
            // Note: In a real app, we might want to debounce this or only send via socket directly to avoid React render cycles
            // For this demo, we trust React 18 auto-batching
            updatePlayback(true, time, currentSong?.id || null);
        }
    }, 2000); // Broadcast every 2 seconds

    return () => clearInterval(interval);
  }, [currentUser?.isHost, playback.isPlaying, currentSong?.id]);


  // === Listener Sync Logic ===
  useEffect(() => {
    if (currentUser?.isHost) return; // Host is the source of truth
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;

    const playerState = playerRef.current.getPlayerState();
    
    // 1. Sync Play/Pause
    if (playback.isPlaying && playerState !== window.YT.PlayerState.PLAYING && playerState !== window.YT.PlayerState.BUFFERING) {
        playerRef.current.playVideo();
    } else if (!playback.isPlaying && playerState === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
    }

    // 2. Sync Time (Drift Correction)
    // Calculate where the song SHOULD be right now
    const timeSinceUpdate = (Date.now() - playback.lastUpdated) / 1000;
    const targetTime = playback.timestamp + (playback.isPlaying ? timeSinceUpdate : 0);
    const currentTime = playerRef.current.getCurrentTime();

    if (Math.abs(currentTime - targetTime) > SYNC_THRESHOLD) {
        console.log(`Drift detected: ${currentTime} vs ${targetTime}. Seeking...`);
        playerRef.current.seekTo(targetTime, true);
    }

  }, [playback, currentUser?.isHost]);
  
  // === UI Progress Update (Local Visuals) ===
  useEffect(() => {
      const interval = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
              setLocalProgress(playerRef.current.getCurrentTime());
          }
      }, 500);
      return () => clearInterval(interval);
  }, []);


  // === Render ===
  if (!currentSong) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-brand-800 rounded-xl p-8 text-center border border-brand-500">
        <div className="w-20 h-20 bg-brand-500/30 rounded-full flex items-center justify-center mb-4 border border-brand-500">
            <Play className="w-8 h-8 text-white opacity-30 ml-1" />
        </div>
        <h3 className="text-xl font-bold text-gray-200">No Song Playing</h3>
        <p className="text-gray-500 mt-2 text-sm uppercase tracking-wide">Add a song to start the workout</p>
      </div>
    );
  }

  const isYouTube = currentSong.platform === Platform.YOUTUBE;

  return (
    <div className="flex flex-col h-full bg-black rounded-xl overflow-hidden relative shadow-2xl border border-brand-500">
      
      {/* Player Area */}
      <div className="flex-grow relative bg-black flex items-center justify-center">
        {isYouTube ? (
             <div ref={containerRef} className="w-full h-full" />
        ) : (
             <div className="text-center p-8">
                 <img src={currentSong.thumbnail} alt="Album Art" className="w-32 h-32 mx-auto rounded-lg mb-4 opacity-75 shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                 <h3 className="text-xl font-bold">{currentSong.title}</h3>
                 <div className="mt-4 flex flex-col items-center gap-2 p-4 bg-brand-800 rounded-lg border border-red-500/30">
                     <div className="flex items-center text-yellow-500 gap-2">
                         <AlertCircle size={20} />
                         <span className="font-semibold">Sync Limited</span>
                     </div>
                     <p className="text-sm text-gray-400 max-w-xs">
                         This platform ({currentSong.platform}) does not support embedded synchronization.
                     </p>
                     <a 
                        href={currentSong.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-2 bg-brand-400 hover:bg-brand-400/80 text-black px-4 py-2 rounded text-sm font-bold transition"
                     >
                         <ExternalLink size={16} /> Open in New Tab
                     </a>
                 </div>
             </div>
        )}
        
        {/* Playback Overlay for Listeners (To prevent interaction) */}
        {!currentUser?.isHost && isYouTube && (
            <div className="absolute inset-0 bg-transparent z-10" />
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-brand-800 border-t border-brand-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 w-1/3 truncate">
              <img src={currentSong.thumbnail} className="w-12 h-12 rounded bg-gray-700 object-cover border border-brand-500" alt="thumb" />
              <div className="overflow-hidden">
                  <h4 className="font-bold text-white truncate">{currentSong.title}</h4>
                  <p className="text-xs text-brand-400 font-medium">Added by {currentSong.addedBy}</p>
              </div>
          </div>

          <div className="flex flex-col items-center w-1/3">
             <div className="flex items-center gap-4 mb-2">
                 {currentUser?.isHost ? (
                     <>
                        <button 
                            onClick={() => {
                                if (playerRef.current && isYouTube) {
                                    playback.isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
                                }
                                updatePlayback(!playback.isPlaying, localProgress, currentSong.id);
                            }}
                            className="w-12 h-12 rounded-full bg-brand-400 text-black flex items-center justify-center hover:scale-105 transition shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                        >
                            {playback.isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                        </button>
                        <button 
                            onClick={nextSong}
                            className="text-gray-400 hover:text-white transition"
                        >
                            <SkipForward size={24} />
                        </button>
                     </>
                 ) : (
                     <div className="flex items-center gap-2 text-brand-400 animate-pulse">
                         <span className="text-xs font-black uppercase tracking-widest">Syncing</span>
                     </div>
                 )}
             </div>
             {/* Simple Progress Bar Visual */}
             <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                 {/* This is just visual in this demo, real duration requires API fetch */}
                 <div className="h-full bg-brand-400 w-1/2 opacity-80 shadow-[0_0_5px_#ccff00]" /> 
             </div>
          </div>

          <div className="w-1/3 flex justify-end">
              {/* Volume or other controls could go here */}
              <div className="text-xs text-gray-500 font-mono border border-brand-500 px-2 py-1 rounded">
                  Room: {useRoom().roomCode}
              </div>
          </div>
      </div>
    </div>
  );
};