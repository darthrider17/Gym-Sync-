export enum Platform {
  YOUTUBE = 'YOUTUBE',
  SPOTIFY = 'SPOTIFY',
  SOUNDCLOUD = 'SOUNDCLOUD',
  OTHER = 'OTHER',
}

export interface Song {
  id: string;
  url: string;
  title: string;
  platform: Platform;
  thumbnail?: string;
  addedBy: string; // User Name
  duration?: number;
}

export interface User {
  id: string;
  name: string;
  isHost: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSongId: string | null;
  timestamp: number; // Current playback time in seconds
  lastUpdated: number; // System time when timestamp was updated
}

export interface RoomState {
  code: string | null;
  users: User[];
  queue: Song[];
  playback: PlaybackState;
}

export interface SyncMessage {
  type: 'JOIN' | 'LEAVE' | 'UPDATE_QUEUE' | 'SYNC_PLAYBACK' | 'REQUEST_SYNC';
  payload: any;
  senderId: string;
}
