import * as SpotifyAPI from '../API/SpotifyAPI.js';
import { requireSpotifyCredentials } from '../Shared/Common.js';

export const spotifyDataSourceCollectors = {
  async spotify_top_tracks(ctx) {
    const { getFreshCreds } = await import('../../SpotifyWorkspace.js');
    const creds = requireSpotifyCredentials(ctx);
    const freshCreds = await getFreshCreds(creds);
    const tracks = await SpotifyAPI.getTopTracks(freshCreds, 10);
    if (!tracks.length) return 'EMPTY: No Spotify top tracks found.';
    return `Spotify Top Tracks — Last 4 weeks:\n\n${tracks
      .map((t) => `${t.rank}. ${t.name} — ${t.artist} (${t.album})`)
      .join('\n')}`;
  },
};

export const spotifyOutputHandlers = {};
