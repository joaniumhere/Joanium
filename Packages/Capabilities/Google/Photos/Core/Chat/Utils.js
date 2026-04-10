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

export function formatMediaItem(item, index) {
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

export function formatAlbum(album, index) {
  const lines = [
    `${index}. **${album.title ?? '(Untitled)'}**`,
    `   ID: \`${album.id}\``,
    album.mediaItemsCount ? `   Items: ${album.mediaItemsCount}` : '',
    album.productUrl ? `   Link: ${album.productUrl}` : '',
    album.coverPhotoMediaItemId ? `   Cover photo ID: \`${album.coverPhotoMediaItemId}\`` : '',
  ];
  return lines.filter(Boolean).join('\n');
}
