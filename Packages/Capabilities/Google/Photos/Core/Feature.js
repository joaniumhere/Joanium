import defineFeature from '../../../Core/DefineFeature.js';
import * as PhotosAPI from './API/PhotosAPI.js';
import { PHOTOS_TOOLS } from './Chat/Tools.js';
import { executePhotosChatTool } from './Chat/ChatExecutor.js';
import { withGoogle } from '../../Common.js';

export default defineFeature({
  id: 'photos',
  name: 'Google Photos',
  dependsOn: ['google-workspace'],
  connectors: {
    serviceExtensions: [
      {
        target: 'google',
        subServices: [
          {
            key: 'photos',
            icon: '🖼️',
            name: 'Google Photos',
            apiUrl: 'https://console.cloud.google.com/apis/library/photoslibrary.googleapis.com',
          },
        ],
        capabilities: [
          'Browse albums and media items in Google Photos',
          'Search photos by date range or content category',
        ],
      },
    ],
  },
  main: {
    methods: {
      async listAlbums(ctx, { maxResults = 20 } = {}) {
        return withGoogle(ctx, async (credentials) => ({
          ok: true,
          albums: await PhotosAPI.listAlbums(credentials, { maxResults }),
        }));
      },

      async getAlbum(ctx, { albumId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!albumId) return { ok: false, error: 'albumId is required' };
          return { ok: true, album: await PhotosAPI.getAlbum(credentials, albumId) };
        });
      },

      async listSharedAlbums(ctx, { maxResults = 20 } = {}) {
        return withGoogle(ctx, async (credentials) => ({
          ok: true,
          albums: await PhotosAPI.listSharedAlbums(credentials, { maxResults }),
        }));
      },

      async listMediaItems(ctx, { maxResults = 20 } = {}) {
        return withGoogle(ctx, async (credentials) => ({
          ok: true,
          items: await PhotosAPI.listMediaItems(credentials, { maxResults }),
        }));
      },

      async getMediaItem(ctx, { mediaItemId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!mediaItemId) return { ok: false, error: 'mediaItemId is required' };
          return { ok: true, item: await PhotosAPI.getMediaItem(credentials, mediaItemId) };
        });
      },

      async searchMediaItems(ctx, { albumId, pageSize = 20, filters = {} } = {}) {
        return withGoogle(ctx, async (credentials) => ({
          ok: true,
          items: await PhotosAPI.searchMediaItems(credentials, { albumId, pageSize, filters }),
        }));
      },

      async searchByDateRange(ctx, { startDate, endDate, maxResults = 20 }) {
        return withGoogle(ctx, async (credentials) => {
          if (!startDate || !endDate)
            return { ok: false, error: 'startDate and endDate are required' };
          return {
            ok: true,
            items: await PhotosAPI.searchByDateRange(credentials, startDate, endDate, maxResults),
          };
        });
      },

      async searchByContentCategory(ctx, { categories = [], maxResults = 20 }) {
        return withGoogle(ctx, async (credentials) => {
          if (!categories.length) return { ok: false, error: 'at least one category is required' };
          return {
            ok: true,
            items: await PhotosAPI.searchByContentCategory(credentials, categories, maxResults),
          };
        });
      },

      async getAlbumMediaItems(ctx, { albumId, maxResults = 20 }) {
        return withGoogle(ctx, async (credentials) => {
          if (!albumId) return { ok: false, error: 'albumId is required' };
          return {
            ok: true,
            items: await PhotosAPI.getAlbumMediaItems(credentials, albumId, maxResults),
          };
        });
      },

      async executeChatTool(ctx, { toolName, params }) {
        return executePhotosChatTool(ctx, toolName, params);
      },
    },
  },
  renderer: {
    chatTools: PHOTOS_TOOLS,
  },
});
