export const YOUTUBE_TOOLS = [
  {
    name: 'youtube_get_my_channel',
    description:
      "Get the authenticated user's own YouTube channel info — name, subscribers, view count, video count.",
    category: 'youtube',
    parameters: {},
  },
  {
    name: 'youtube_search_videos',
    description: 'Search YouTube for videos matching a query.',
    category: 'youtube',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query string.' },
      max_results: {
        type: 'number',
        required: false,
        description: 'Max results to return (default: 10, max: 50).',
      },
      order: {
        type: 'string',
        required: false,
        description: 'Sort order: relevance (default), date, viewCount, rating.',
      },
    },
  },
  {
    name: 'youtube_get_video',
    description:
      'Get full details for a YouTube video by its ID — title, description, stats, duration.',
    category: 'youtube',
    parameters: {
      video_id: {
        type: 'string',
        required: true,
        description: 'YouTube video ID (e.g. dQw4w9WgXcQ).',
      },
    },
  },
  {
    name: 'youtube_list_playlists',
    description: "List the authenticated user's YouTube playlists.",
    category: 'youtube',
    parameters: {
      max_results: {
        type: 'number',
        required: false,
        description: 'Max playlists to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_get_playlist_items',
    description: 'List videos inside a YouTube playlist by playlist ID.',
    category: 'youtube',
    parameters: {
      playlist_id: { type: 'string', required: true, description: 'YouTube playlist ID.' },
      max_results: {
        type: 'number',
        required: false,
        description: 'Max items to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_list_subscriptions',
    description: 'List the channels the authenticated user is subscribed to.',
    category: 'youtube',
    parameters: {
      max_results: {
        type: 'number',
        required: false,
        description: 'Max subscriptions to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_get_liked_videos',
    description: 'Get videos the authenticated user has liked.',
    category: 'youtube',
    parameters: {
      max_results: {
        type: 'number',
        required: false,
        description: 'Max liked videos to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_get_video_comments',
    description: 'Get top-level comments on a YouTube video.',
    category: 'youtube',
    parameters: {
      video_id: { type: 'string', required: true, description: 'YouTube video ID.' },
      max_results: {
        type: 'number',
        required: false,
        description: 'Max comments to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_rate_video',
    description: 'Like, dislike, or remove rating from a YouTube video.',
    category: 'youtube',
    parameters: {
      video_id: { type: 'string', required: true, description: 'YouTube video ID.' },
      rating: {
        type: 'string',
        required: true,
        description: 'Rating to apply: like, dislike, or none (to remove).',
      },
    },
  },
  {
    name: 'youtube_list_my_videos',
    description: "List videos uploaded by the authenticated user's channel.",
    category: 'youtube',
    parameters: {
      max_results: {
        type: 'number',
        required: false,
        description: 'Max videos to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_get_channel_by_id',
    description: 'Get details for any YouTube channel by its channel ID.',
    category: 'youtube',
    parameters: {
      channel_id: { type: 'string', required: true, description: 'YouTube channel ID.' },
    },
  },
  {
    name: 'youtube_get_channel_videos',
    description: 'List recent videos uploaded by a specific channel.',
    category: 'youtube',
    parameters: {
      channel_id: { type: 'string', required: true, description: 'YouTube channel ID.' },
      max_results: {
        type: 'number',
        required: false,
        description: 'Max videos to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_create_playlist',
    description: "Create a new YouTube playlist on the authenticated user's channel.",
    category: 'youtube',
    parameters: {
      title: { type: 'string', required: true, description: 'Playlist title.' },
      description: { type: 'string', required: false, description: 'Playlist description.' },
      privacy_status: {
        type: 'string',
        required: false,
        description: 'Privacy: public, unlisted, or private (default).',
      },
    },
  },
  {
    name: 'youtube_update_playlist',
    description: 'Update the title, description, or privacy of an existing playlist.',
    category: 'youtube',
    parameters: {
      playlist_id: { type: 'string', required: true, description: 'Playlist ID to update.' },
      title: { type: 'string', required: false, description: 'New title.' },
      description: { type: 'string', required: false, description: 'New description.' },
      privacy_status: {
        type: 'string',
        required: false,
        description: 'New privacy: public, unlisted, or private.',
      },
    },
  },
  {
    name: 'youtube_delete_playlist',
    description: 'Delete a playlist by its ID.',
    category: 'youtube',
    parameters: {
      playlist_id: { type: 'string', required: true, description: 'Playlist ID to delete.' },
    },
  },
  {
    name: 'youtube_add_video_to_playlist',
    description: 'Add a video to a playlist.',
    category: 'youtube',
    parameters: {
      playlist_id: { type: 'string', required: true, description: 'Target playlist ID.' },
      video_id: { type: 'string', required: true, description: 'Video ID to add.' },
    },
  },
  {
    name: 'youtube_remove_playlist_item',
    description: 'Remove a video from a playlist using its playlist item ID (not the video ID).',
    category: 'youtube',
    parameters: {
      playlist_item_id: {
        type: 'string',
        required: true,
        description: 'Playlist item ID (from get_playlist_items).',
      },
    },
  },
  {
    name: 'youtube_subscribe_to_channel',
    description: 'Subscribe the authenticated user to a YouTube channel.',
    category: 'youtube',
    parameters: {
      channel_id: { type: 'string', required: true, description: 'Channel ID to subscribe to.' },
    },
  },
  {
    name: 'youtube_unsubscribe_from_channel',
    description: 'Remove a subscription by its subscription ID.',
    category: 'youtube',
    parameters: {
      subscription_id: {
        type: 'string',
        required: true,
        description: 'Subscription ID (from list_subscriptions or check_subscription).',
      },
    },
  },
  {
    name: 'youtube_check_subscription',
    description: 'Check whether the authenticated user is subscribed to a specific channel.',
    category: 'youtube',
    parameters: {
      channel_id: { type: 'string', required: true, description: 'Channel ID to check.' },
    },
  },
  {
    name: 'youtube_post_comment',
    description: 'Post a new top-level comment on a YouTube video.',
    category: 'youtube',
    parameters: {
      video_id: { type: 'string', required: true, description: 'Video ID to comment on.' },
      text: { type: 'string', required: true, description: 'Comment text.' },
    },
  },
  {
    name: 'youtube_reply_to_comment',
    description: 'Reply to an existing top-level comment thread.',
    category: 'youtube',
    parameters: {
      parent_id: { type: 'string', required: true, description: 'Comment thread ID to reply to.' },
      text: { type: 'string', required: true, description: 'Reply text.' },
    },
  },
  {
    name: 'youtube_delete_comment',
    description: 'Delete one of your own comments by comment ID.',
    category: 'youtube',
    parameters: {
      comment_id: { type: 'string', required: true, description: 'Comment ID to delete.' },
    },
  },
  {
    name: 'youtube_get_comment_replies',
    description: 'Fetch replies under a specific comment thread.',
    category: 'youtube',
    parameters: {
      parent_id: { type: 'string', required: true, description: 'Comment thread ID.' },
      max_results: {
        type: 'number',
        required: false,
        description: 'Max replies to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_get_video_rating',
    description: "Get the authenticated user's own rating (like/dislike/none) on a specific video.",
    category: 'youtube',
    parameters: {
      video_id: { type: 'string', required: true, description: 'Video ID to check.' },
    },
  },
  {
    name: 'youtube_get_trending_videos',
    description: 'Fetch currently trending / most popular videos on YouTube.',
    category: 'youtube',
    parameters: {
      region_code: {
        type: 'string',
        required: false,
        description: 'ISO 3166-1 alpha-2 country code (default: US).',
      },
      category_id: {
        type: 'string',
        required: false,
        description: 'Video category ID to filter by (default: 0 = all).',
      },
      max_results: {
        type: 'number',
        required: false,
        description: 'Max videos to return (default: 20).',
      },
    },
  },
  {
    name: 'youtube_search_channels',
    description: 'Search YouTube for channels matching a query.',
    category: 'youtube',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query.' },
      max_results: { type: 'number', required: false, description: 'Max results (default: 10).' },
    },
  },
  {
    name: 'youtube_search_playlists',
    description: 'Search YouTube for playlists matching a query.',
    category: 'youtube',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query.' },
      max_results: { type: 'number', required: false, description: 'Max results (default: 10).' },
    },
  },
  {
    name: 'youtube_get_video_categories',
    description: 'List all assignable YouTube video categories for a region.',
    category: 'youtube',
    parameters: {
      region_code: {
        type: 'string',
        required: false,
        description: 'ISO 3166-1 alpha-2 country code (default: US).',
      },
    },
  },
  {
    name: 'youtube_report_video',
    description: 'Report a video for policy violations.',
    category: 'youtube',
    parameters: {
      video_id: { type: 'string', required: true, description: 'Video ID to report.' },
      reason_id: {
        type: 'string',
        required: true,
        description: 'Abuse report reason ID (from YouTube API abuse report reasons).',
      },
      secondary_reason_id: {
        type: 'string',
        required: false,
        description: 'Optional secondary reason ID.',
      },
      comments: {
        type: 'string',
        required: false,
        description: 'Optional additional comments for the report.',
      },
    },
  },
];
