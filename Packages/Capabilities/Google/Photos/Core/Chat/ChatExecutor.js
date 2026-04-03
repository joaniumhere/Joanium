import * as PhotosAPI from '../API/PhotosAPI.js';
import { requireGoogleCredentials } from '../../../Common.js';

function formatBytes(bytes) {
  const n = Number(bytes ?? 0);
  if (n >= 1_073_741_824) return `${(n / 1_073_741_824).toFixed(2)} GB`;
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1_024) return `${(n / 1_024).toFixed(0)} KB`;
  return `${n} B`;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatMediaItem(item, index) {
  const meta = item.mediaMetadata ?? {};
  const photo = meta.photo ?? {};
  const video = meta.video ?? {};
  const isVideo = Boolean(meta.video);

  const lines = [
    `${index}. **${item.filename ?? '(unnamed)'}** [${isVideo ? 'Video' : 'Photo'}]`,
    `   ID: \`${item.id}\``,
    meta.creationTime ? `   Taken: ${formatDate(meta.creationTime)}` : '',
    meta.width && meta.height ? `   Dimensions: ${meta.width} × ${meta.height}` : '',
    photo.cameraMake ? `   Camera: ${photo.cameraMake} ${photo.cameraModel ?? ''}`.trim() : '',
    isVideo && video.fps ? `   FPS: ${video.fps}` : '',
    item.description ? `   Description: ${item.description.slice(0, 80)}` : '',
    item.productUrl ? `   Link: ${item.productUrl}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function formatAlbum(album, index) {
  const lines = [
    `${index}. **${album.title ?? '(Untitled)'}**`,
    `   ID: \`${album.id}\``,
    album.mediaItemsCount ? `   Items: ${album.mediaItemsCount}` : '',
    album.productUrl ? `   Link: ${album.productUrl}` : '',
    album.coverPhotoMediaItemId ? `   Cover photo ID: \`${album.coverPhotoMediaItemId}\`` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

export async function executePhotosChatTool(ctx, toolName, params = {}) {
  const credentials = requireGoogleCredentials(ctx);

  switch (toolName) {
    case 'photos_list_albums': {
      const albums = await PhotosAPI.listAlbums(credentials, {
        maxResults: params.max_results ?? 20,
      });
      if (!albums.length) return 'No albums found in your Google Photos library.';
      return `Your albums (${albums.length}):\n\n${albums.map((a, i) => formatAlbum(a, i + 1)).join('\n\n')}`;
    }

    case 'photos_get_album': {
      const { album_id } = params;
      if (!album_id?.trim()) throw new Error('Missing required param: album_id');
      const album = await PhotosAPI.getAlbum(credentials, album_id.trim());
      return formatAlbum(album, '');
    }

    case 'photos_list_shared_albums': {
      const albums = await PhotosAPI.listSharedAlbums(credentials, {
        maxResults: params.max_results ?? 20,
      });
      if (!albums.length) return 'No shared albums found.';
      return `Shared albums (${albums.length}):\n\n${albums.map((a, i) => formatAlbum(a, i + 1)).join('\n\n')}`;
    }

    case 'photos_list_media': {
      const items = await PhotosAPI.listMediaItems(credentials, {
        maxResults: params.max_results ?? 20,
      });
      if (!items.length) return 'No media items found in your Google Photos library.';
      return `Recent media items (${items.length}):\n\n${items.map((item, i) => formatMediaItem(item, i + 1)).join('\n\n')}`;
    }

    case 'photos_get_media_item': {
      const { media_item_id } = params;
      if (!media_item_id?.trim()) throw new Error('Missing required param: media_item_id');
      const item = await PhotosAPI.getMediaItem(credentials, media_item_id.trim());
      return formatMediaItem(item, '');
    }

    case 'photos_get_album_media': {
      const { album_id, max_results = 20 } = params;
      if (!album_id?.trim()) throw new Error('Missing required param: album_id');
      const items = await PhotosAPI.getAlbumMediaItems(credentials, album_id.trim(), max_results);
      if (!items.length) return `No media found in album \`${album_id}\`.`;
      return `Album media (${items.length}):\n\n${items.map((item, i) => formatMediaItem(item, i + 1)).join('\n\n')}`;
    }

    case 'photos_search_by_date': {
      const { start_date, end_date, max_results = 20 } = params;
      if (!start_date?.trim()) throw new Error('Missing required param: start_date');
      if (!end_date?.trim()) throw new Error('Missing required param: end_date');
      const items = await PhotosAPI.searchByDateRange(
        credentials,
        start_date.trim(),
        end_date.trim(),
        max_results,
      );
      if (!items.length) return `No photos found between ${start_date} and ${end_date}.`;
      return `Photos from ${start_date} to ${end_date} (${items.length}):\n\n${items.map((item, i) => formatMediaItem(item, i + 1)).join('\n\n')}`;
    }

    case 'photos_search_by_category': {
      const { categories, max_results = 20 } = params;
      if (!categories?.trim()) throw new Error('Missing required param: categories');
      const cats = categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const items = await PhotosAPI.searchByContentCategory(credentials, cats, max_results);
      if (!items.length) return `No photos found matching categories: ${cats.join(', ')}.`;
      return `Photos matching [${cats.join(', ')}] (${items.length}):\n\n${items.map((item, i) => formatMediaItem(item, i + 1)).join('\n\n')}`;
    }

    default:
      throw new Error(`Unknown Photos tool: ${toolName}`);
  }
}
