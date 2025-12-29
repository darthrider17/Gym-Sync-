import { SyncMessage } from '../types';

/**
 * SyncService
 * 
 * In a real production environment, this would be replaced by a WebSocket connection
 * (e.g., Socket.io, Firebase Realtime Database) to communicate across different networks.
 * 
 * For this demo, we use the BroadcastChannel API which allows communication between
 * different tabs/windows within the same browser (Same Origin).
 */

class SyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((message: SyncMessage) => void)[] = [];

  constructor() {}

  public joinRoom(roomCode: string) {
    if (this.channel) {
      this.channel.close();
    }
    this.channel = new BroadcastChannel(`syncbeat_room_${roomCode}`);
    this.channel.onmessage = (event) => {
      this.notifyListeners(event.data as SyncMessage);
    };
  }

  public leaveRoom() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }

  public sendMessage(message: SyncMessage) {
    if (this.channel) {
      this.channel.postMessage(message);
    } else {
      console.warn("Attempted to send message but not connected to a room.");
    }
  }

  public onMessage(callback: (message: SyncMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(message: SyncMessage) {
    this.listeners.forEach(listener => listener(message));
  }
}

export const syncService = new SyncService();
