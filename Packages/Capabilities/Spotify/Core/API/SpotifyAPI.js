const BASE = 'https://api.spotify.com/v1';

function headers(creds) {
  return { Authorization: `Bearer ${creds.accessToken}`, 'Content-Type': 'application/json' };
}

async function spFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (res.status === 204) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message ?? `Spotify API error: ${res.status}`);
  }
  return res.json();
}

export async function getMe(creds) {
  return spFetch('/me', creds);
}

export async function getCurrentlyPlaying(creds) {
  const data = await spFetch('/me/player/currently-playing', creds);
  if (!data) return null;
  return {
    isPlaying: data.is_playing,
    track: data.item?.name ?? null,
    artist: data.item?.artists?.map((a) => a.name).join(', ') ?? null,
    album: data.item?.album?.name ?? null,
    progressMs: data.progress_ms,
    durationMs: data.item?.duration_ms ?? null,
    albumArt: data.item?.album?.images?.[0]?.url ?? null,
  };
}

export async function getTopTracks(creds, limit = 10, timeRange = 'short_term') {
  const data = await spFetch(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`, creds);
  return (data.items ?? []).map((t, i) => ({
    rank: i + 1,
    name: t.name,
    artist: t.artists?.map((a) => a.name).join(', ') ?? '',
    album: t.album?.name ?? '',
    popularity: t.popularity,
  }));
}

export async function listPlaylists(creds, limit = 20) {
  const data = await spFetch(`/me/playlists?limit=${limit}`, creds);
  return (data.items ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    tracks: p.tracks?.total ?? 0,
    public: p.public,
    description: p.description ?? '',
    owner: p.owner?.display_name ?? '',
  }));
}

export async function getTopArtists(creds, limit = 10) {
  const data = await spFetch(`/me/top/artists?limit=${limit}&time_range=short_term`, creds);
  return (data.items ?? []).map((a, i) => ({
    rank: i + 1,
    name: a.name,
    genres: a.genres?.slice(0, 3) ?? [],
    popularity: a.popularity,
    followers: a.followers?.total ?? 0,
  }));
}
