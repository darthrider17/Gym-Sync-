import { Platform, Song } from '../types';

export const generateId = () => Math.random().toString(36).substring(2, 9);
export const generateRoomCode = () => Math.floor(1000 + Math.random() * 9000).toString();

export const detectPlatform = (url: string): Platform => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return Platform.YOUTUBE;
  if (url.includes('spotify.com')) return Platform.SPOTIFY;
  if (url.includes('soundcloud.com')) return Platform.SOUNDCLOUD;
  return Platform.OTHER;
};

export const parseSongFromUrl = (url: string, addedBy: string): Song => {
  const platform = detectPlatform(url);
  let title = 'Unknown Track';
  let thumbnail = 'https://picsum.photos/200';
  let id = generateId();

  // Simple mock parsing logic
  if (platform === Platform.YOUTUBE) {
    title = `YouTube Video (${url.slice(-11)})`;
    try {
      const urlObj = new URL(url);
      const v = urlObj.searchParams.get('v');
      if (v) {
        thumbnail = `https://img.youtube.com/vi/${v}/0.jpg`;
        title = `YouTube Track ${v}`;
      } else if (url.includes('youtu.be')) {
         const v = url.split('/').pop();
         if(v) {
            thumbnail = `https://img.youtube.com/vi/${v}/0.jpg`;
            title = `YouTube Track ${v}`;
         }
      }
    } catch (e) {
      console.warn("Invalid URL", e);
    }
  } else if (platform === Platform.SPOTIFY) {
    title = 'Spotify Track';
    thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
  } else {
    title = 'External Link';
  }

  return {
    id,
    url,
    title,
    platform,
    thumbnail,
    addedBy,
    duration: 0,
  };
};

export const getPlatformIcon = (platform: Platform) => {
  switch (platform) {
    case Platform.YOUTUBE: return 'text-red-500';
    case Platform.SPOTIFY: return 'text-green-500';
    case Platform.SOUNDCLOUD: return 'text-orange-500';
    default: return 'text-gray-400';
  }
};
