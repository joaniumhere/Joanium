import * as SpotifyAPI from '../API/SpotifyAPI.js';
import { getSpotifyCredentials, notConnected } from '../Shared/Common.js';

export async function executeSpotifyChatTool(ctx, toolName, params) {
  const creds = getSpotifyCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'spotify_now_playing') {
      const { getFreshCreds } = await import('../../SpotifyWorkspace.js');
      const freshCreds = await getFreshCreds(creds);
      const nowPlaying = await SpotifyAPI.getCurrentlyPlaying(freshCreds);
      return { ok: true, nowPlaying };
    }
    if (toolName === 'spotify_top_tracks') {
      const { getFreshCreds } = await import('../../SpotifyWorkspace.js');
      const freshCreds = await getFreshCreds(creds);
      const tracks = await SpotifyAPI.getTopTracks(freshCreds, 10);
      return { ok: true, tracks };
    }
    if (toolName === 'spotify_list_playlists') {
      const { getFreshCreds } = await import('../../SpotifyWorkspace.js');
      const freshCreds = await getFreshCreds(creds);
      const playlists = await SpotifyAPI.listPlaylists(freshCreds, 20);
      return { ok: true, playlists };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
