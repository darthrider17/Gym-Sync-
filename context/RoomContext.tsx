import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { RoomState, User, Song, PlaybackState, SyncMessage, Platform } from '../types';
import { syncService } from '../services/syncService';
import { generateId, parseSongFromUrl } from '../utils/helpers';

interface RoomContextType {
  roomCode: string | null;
  currentUser: User | null;
  users: User[];
  queue: Song[];
  playback: PlaybackState;
  createRoom: (userName: string) => void;
  joinRoom: (roomCode: string, userName: string) => void;
  leaveRoom: () => void;
  addSong: (url: string) => void;
  removeSong: (songId: string) => void;
  updatePlayback: (isPlaying: boolean, timestamp: number, songId: string | null) => void;
  nextSong: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Initial State
const initialPlayback: PlaybackState = {
  isPlaying: false,
  currentSongId: null,
  timestamp: 0,
  lastUpdated: Date.now(),
};

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [playback, setPlayback] = useState<PlaybackState>(initialPlayback);
  
  // Ref to hold state for event listeners to avoid closure staleness
  const stateRef = useRef({ users, queue, playback, currentUser, roomCode });
  
  useEffect(() => {
    stateRef.current = { users, queue, playback, currentUser, roomCode };
  }, [users, queue, playback, currentUser, roomCode]);

  // Handle incoming messages
  useEffect(() => {
    const unsubscribe = syncService.onMessage((msg: SyncMessage) => {
      const { type, payload, senderId } = msg;

      switch (type) {
        case 'JOIN':
          // If we are host, send back the current state to sync the new user
          if (stateRef.current.currentUser?.isHost) {
             const newUser = payload as User;
             // Add user if not exists
             setUsers(prev => {
                const exists = prev.find(u => u.id === newUser.id);
                if (exists) return prev;
                return [...prev, newUser];
             });
             // Broadcast current full state to the new joiner
             syncService.sendMessage({
               type: 'UPDATE_QUEUE',
               payload: { queue: stateRef.current.queue, users: [...stateRef.current.users, newUser] },
               senderId: stateRef.current.currentUser.id
             });
             // Also sync playback immediately
             syncService.sendMessage({
               type: 'SYNC_PLAYBACK',
               payload: stateRef.current.playback,
               senderId: stateRef.current.currentUser.id
             });
          }
          break;

        case 'UPDATE_QUEUE':
          if (payload.queue) setQueue(payload.queue);
          if (payload.users) setUsers(payload.users);
          break;

        case 'SYNC_PLAYBACK':
          // Only listeners update their local state from the network
          if (!stateRef.current.currentUser?.isHost) {
            setPlayback(payload);
          }
          break;
        
        case 'REQUEST_SYNC':
             if (stateRef.current.currentUser?.isHost) {
                 syncService.sendMessage({
                   type: 'UPDATE_QUEUE',
                   payload: { queue: stateRef.current.queue, users: stateRef.current.users },
                   senderId: stateRef.current.currentUser.id
                 });
                 syncService.sendMessage({
                   type: 'SYNC_PLAYBACK',
                   payload: stateRef.current.playback,
                   senderId: stateRef.current.currentUser.id
                 });
             }
             break;
      }
    });

    return () => unsubscribe();
  }, []);

  const createRoom = (userName: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const user: User = { id: generateId(), name: userName, isHost: true };
    
    setRoomCode(code);
    setCurrentUser(user);
    setUsers([user]);
    syncService.joinRoom(code);
  };

  const joinRoom = (code: string, userName: string) => {
    const user: User = { id: generateId(), name: userName, isHost: false };
    
    setRoomCode(code);
    setCurrentUser(user);
    setUsers([user]); // Will be updated by host
    syncService.joinRoom(code);
    
    // Announce join
    setTimeout(() => {
        syncService.sendMessage({
        type: 'JOIN',
        payload: user,
        senderId: user.id
        });
        
        // Request initial state in case we missed the immediate response or are rejoining
        syncService.sendMessage({
            type: 'REQUEST_SYNC',
            payload: {},
            senderId: user.id
        });
    }, 500);
  };

  const leaveRoom = () => {
    setRoomCode(null);
    setCurrentUser(null);
    setUsers([]);
    setQueue([]);
    setPlayback(initialPlayback);
    syncService.leaveRoom();
  };

  const addSong = (url: string) => {
    if (!currentUser) return;
    const song = parseSongFromUrl(url, currentUser.name);
    
    // Optimistic update
    const newQueue = [...queue, song];
    setQueue(newQueue);
    
    // If it's the first song, set it as current but paused
    if (newQueue.length === 1 && !playback.currentSongId && currentUser.isHost) {
        const newPlayback = { ...playback, currentSongId: song.id };
        setPlayback(newPlayback);
        syncService.sendMessage({ type: 'SYNC_PLAYBACK', payload: newPlayback, senderId: currentUser.id });
    }

    syncService.sendMessage({
      type: 'UPDATE_QUEUE',
      payload: { queue: newQueue },
      senderId: currentUser.id
    });
  };

  const removeSong = (songId: string) => {
    if (!currentUser) return;
    const newQueue = queue.filter(s => s.id !== songId);
    setQueue(newQueue);
    syncService.sendMessage({
      type: 'UPDATE_QUEUE',
      payload: { queue: newQueue },
      senderId: currentUser.id
    });
  };

  const updatePlayback = (isPlaying: boolean, timestamp: number, songId: string | null) => {
    if (!currentUser?.isHost) return;

    const newPlayback: PlaybackState = {
      isPlaying,
      timestamp,
      currentSongId: songId,
      lastUpdated: Date.now()
    };
    
    setPlayback(newPlayback);
    syncService.sendMessage({
      type: 'SYNC_PLAYBACK',
      payload: newPlayback,
      senderId: currentUser.id
    });
  };

  const nextSong = () => {
      if (!currentUser?.isHost) return;
      
      const currentIndex = queue.findIndex(s => s.id === playback.currentSongId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < queue.length) {
          updatePlayback(true, 0, queue[nextIndex].id);
      } else {
          // End of queue
          updatePlayback(false, 0, null);
      }
  };

  return (
    <RoomContext.Provider value={{
      roomCode,
      currentUser,
      users,
      queue,
      playback,
      createRoom,
      joinRoom,
      leaveRoom,
      addSong,
      removeSong,
      updatePlayback,
      nextSong
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
