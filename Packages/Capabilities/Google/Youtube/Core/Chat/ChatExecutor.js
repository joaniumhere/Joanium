import * as YouTubeAPI from '../API/YouTubeAPI.js';
import { requireGoogleCredentials } from '../../../Common.js';

function formatVideo(item, index) {
  const sn = item.snippet ?? {};
  const stats = item.statistics ?? {};
  const details = item.contentDetails ?? {};
  const videoId = item.id?.videoId ?? item.id ?? item.contentDetails?.videoId ?? '';
  const lines = [
    `${index}. **${sn.title ?? '(No title)'}**`,
    `   Channel: ${sn.channelTitle ?? 'unknown'}`,
    videoId ? `   ID: \`${videoId}\`` : '',
    sn.publishedAt
      ? `   Published: ${new Date(sn.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
      : '',
  ];
  if (stats.viewCount) lines.push(`   Views: ${YouTubeAPI.formatCount(stats.viewCount)}`);
  if (stats.likeCount) lines.push(`   Likes: ${YouTubeAPI.formatCount(stats.likeCount)}`);
  if (details.duration) lines.push(`   Duration: ${YouTubeAPI.parseDuration(details.duration)}`);
  if (sn.description)
    lines.push(
      `   Description: ${sn.description.slice(0, 120)}${sn.description.length > 120 ? '...' : ''}`,
    );
  return lines.filter(Boolean).join('\n');
}

export async function executeYouTubeChatTool(ctx, toolName, params = {}) {
  const credentials = requireGoogleCredentials(ctx);

  switch (toolName) {
    case 'youtube_get_my_channel': {
      const channel = await YouTubeAPI.getMyChannel(credentials);
      if (!channel) return 'No YouTube channel found for this account.';
      const sn = channel.snippet ?? {};
      const stats = channel.statistics ?? {};
      return [
        `**${sn.title ?? 'Your Channel'}**`,
        sn.description
          ? `${sn.description.slice(0, 200)}${sn.description.length > 200 ? '...' : ''}`
          : '',
        '',
        `Channel ID: \`${channel.id}\``,
        `Subscribers: ${stats.hiddenSubscriberCount ? 'Hidden' : YouTubeAPI.formatCount(stats.subscriberCount)}`,
        `Total Views: ${YouTubeAPI.formatCount(stats.viewCount)}`,
        `Videos: ${YouTubeAPI.formatCount(stats.videoCount)}`,
        sn.country ? `Country: ${sn.country}` : '',
        sn.publishedAt
          ? `Created: ${new Date(sn.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'youtube_search_videos': {
      const { query, max_results = 10, order = 'relevance' } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');
      const items = await YouTubeAPI.searchVideos(credentials, query, {
        maxResults: max_results,
        order,
      });
      if (!items.length) return `No videos found for "${query}".`;
      const videoIds = items.map((item) => item.id?.videoId).filter(Boolean);
      const detailed = videoIds.length
        ? await YouTubeAPI.getMultipleVideos(credentials, videoIds)
        : items;
      const map = Object.fromEntries(detailed.map((v) => [v.id, v]));
      const lines = items.map((item, i) => {
        const full = map[item.id?.videoId] ?? item;
        return formatVideo(full.id ? full : { ...full, id: { videoId: item.id?.videoId } }, i + 1);
      });
      return `YouTube search "${query}" — ${items.length} result${items.length !== 1 ? 's' : ''}:\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_get_video': {
      const { video_id } = params;
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      const video = await YouTubeAPI.getVideoDetails(credentials, video_id.trim());
      if (!video) return `No video found with ID "${video_id}".`;
      const sn = video.snippet ?? {};
      const stats = video.statistics ?? {};
      const details = video.contentDetails ?? {};
      return [
        `**${sn.title ?? '(No title)'}**`,
        '',
        `Channel: ${sn.channelTitle ?? 'unknown'}`,
        `Video ID: \`${video.id}\``,
        `Published: ${sn.publishedAt ? new Date(sn.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'unknown'}`,
        `Duration: ${details.duration ? YouTubeAPI.parseDuration(details.duration) : 'unknown'}`,
        '',
        `👁  Views:    ${YouTubeAPI.formatCount(stats.viewCount)}`,
        `👍 Likes:    ${YouTubeAPI.formatCount(stats.likeCount)}`,
        `💬 Comments: ${stats.commentCount ? YouTubeAPI.formatCount(stats.commentCount) : 'disabled'}`,
        '',
        '── Description ──',
        sn.description
          ? sn.description.slice(0, 500) + (sn.description.length > 500 ? '...' : '')
          : '(none)',
      ].join('\n');
    }

    case 'youtube_list_playlists': {
      const { max_results = 20 } = params;
      const playlists = await YouTubeAPI.listMyPlaylists(credentials, max_results);
      if (!playlists.length) return 'No playlists found on your channel.';
      const lines = playlists.map((pl, i) => {
        const sn = pl.snippet ?? {};
        const count = pl.contentDetails?.itemCount ?? 0;
        return `${i + 1}. **${sn.title ?? '(Untitled)'}** — ${count} video${count !== 1 ? 's' : ''}\n   ID: \`${pl.id}\`${sn.description ? `\n   ${sn.description.slice(0, 80)}` : ''}`;
      });
      return `Your playlists (${playlists.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_get_playlist_items': {
      const { playlist_id, max_results = 20 } = params;
      if (!playlist_id?.trim()) throw new Error('Missing required param: playlist_id');
      const items = await YouTubeAPI.getPlaylistItems(credentials, playlist_id.trim(), max_results);
      if (!items.length) return `Playlist \`${playlist_id}\` is empty or not found.`;
      const lines = items.map((item, i) => {
        const sn = item.snippet ?? {};
        const videoId = sn.resourceId?.videoId ?? '';
        return `${i + 1}. **${sn.title ?? '(No title)'}**${videoId ? `\n   Video ID: \`${videoId}\`` : ''}\n   Channel: ${sn.videoOwnerChannelTitle ?? 'unknown'}`;
      });
      return `Playlist items (${items.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_list_subscriptions': {
      const { max_results = 20 } = params;
      const subs = await YouTubeAPI.listSubscriptions(credentials, max_results);
      if (!subs.length) return 'No subscriptions found.';
      const lines = subs.map((sub, i) => {
        const sn = sub.snippet ?? {};
        return `${i + 1}. **${sn.title ?? '(Unknown)'}**\n   Channel ID: \`${sn.resourceId?.channelId ?? ''}\`${sn.description ? `\n   ${sn.description.slice(0, 80)}` : ''}`;
      });
      return `Your subscriptions (${subs.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_get_liked_videos': {
      const { max_results = 20 } = params;
      const videos = await YouTubeAPI.getLikedVideos(credentials, max_results);
      if (!videos.length) return 'No liked videos found.';
      return `Your liked videos (${videos.length}):\n\n${videos.map((v, i) => formatVideo(v, i + 1)).join('\n\n')}`;
    }

    case 'youtube_get_video_comments': {
      const { video_id, max_results = 20 } = params;
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      const threads = await YouTubeAPI.getVideoComments(credentials, video_id.trim(), max_results);
      if (!threads.length)
        return `No comments found for video \`${video_id}\` (comments may be disabled).`;
      const lines = threads.map((thread, i) => {
        const top = thread.snippet?.topLevelComment?.snippet ?? {};
        const replyCount = thread.snippet?.totalReplyCount ?? 0;
        return [
          `${i + 1}. **${top.authorDisplayName ?? 'Anonymous'}**`,
          `   ${top.textDisplay?.replace(/<[^>]*>/g, '').slice(0, 200) ?? ''}`,
          `   👍 ${YouTubeAPI.formatCount(top.likeCount)}${replyCount ? ` · ${replyCount} repl${replyCount !== 1 ? 'ies' : 'y'}` : ''}`,
          `   ${top.publishedAt ? new Date(top.publishedAt).toLocaleDateString() : ''}`,
        ].join('\n');
      });
      return `Comments on \`${video_id}\` (${threads.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_rate_video': {
      const { video_id, rating } = params;
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      if (!rating?.trim()) throw new Error('Missing required param: rating');
      await YouTubeAPI.rateVideo(credentials, video_id.trim(), rating.trim().toLowerCase());
      const action =
        rating === 'like' ? 'Liked' : rating === 'dislike' ? 'Disliked' : 'Rating removed from';
      return `${action} video \`${video_id}\`.`;
    }

    case 'youtube_list_my_videos': {
      const { max_results = 20 } = params;
      const items = await YouTubeAPI.listMyVideos(credentials, max_results);
      if (!items.length) return 'No videos found on your channel.';
      const lines = items.map((item, i) => {
        const sn = item.snippet ?? {};
        const videoId = item.id?.videoId ?? '';
        return `${i + 1}. **${sn.title ?? '(No title)'}**${videoId ? `\n   ID: \`${videoId}\`` : ''}\n   Published: ${sn.publishedAt ? new Date(sn.publishedAt).toLocaleDateString() : 'unknown'}`;
      });
      return `Your videos (${items.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_get_channel_by_id': {
      const { channel_id } = params;
      if (!channel_id?.trim()) throw new Error('Missing required param: channel_id');
      const channel = await YouTubeAPI.getChannelById(credentials, channel_id.trim());
      if (!channel) return `No channel found with ID "${channel_id}".`;
      const sn = channel.snippet ?? {};
      const stats = channel.statistics ?? {};
      return [
        `**${sn.title ?? 'Unknown Channel'}**`,
        sn.description ? sn.description.slice(0, 200) : '',
        '',
        `Channel ID: \`${channel.id}\``,
        `Subscribers: ${stats.hiddenSubscriberCount ? 'Hidden' : YouTubeAPI.formatCount(stats.subscriberCount)}`,
        `Total Views: ${YouTubeAPI.formatCount(stats.viewCount)}`,
        `Videos: ${YouTubeAPI.formatCount(stats.videoCount)}`,
        sn.country ? `Country: ${sn.country}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'youtube_get_channel_videos': {
      const { channel_id, max_results = 20 } = params;
      if (!channel_id?.trim()) throw new Error('Missing required param: channel_id');
      const items = await YouTubeAPI.getChannelVideos(credentials, channel_id.trim(), max_results);
      if (!items.length) return `No videos found for channel \`${channel_id}\`.`;
      const lines = items.map((item, i) => {
        const sn = item.snippet ?? {};
        const videoId = item.id?.videoId ?? '';
        return `${i + 1}. **${sn.title ?? '(No title)'}**${videoId ? `\n   ID: \`${videoId}\`` : ''}\n   Published: ${sn.publishedAt ? new Date(sn.publishedAt).toLocaleDateString() : 'unknown'}`;
      });
      return `Channel videos (${items.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_create_playlist': {
      const { title, description, privacy_status = 'private' } = params;
      if (!title?.trim()) throw new Error('Missing required param: title');
      const pl = await YouTubeAPI.createPlaylist(credentials, {
        title,
        description,
        privacyStatus: privacy_status,
      });
      return `Playlist created!\nID: \`${pl.id}\`\nTitle: ${pl.snippet?.title}\nPrivacy: ${pl.status?.privacyStatus}`;
    }

    case 'youtube_update_playlist': {
      const { playlist_id, title, description, privacy_status } = params;
      if (!playlist_id?.trim()) throw new Error('Missing required param: playlist_id');
      await YouTubeAPI.updatePlaylist(credentials, playlist_id.trim(), {
        title,
        description,
        privacyStatus: privacy_status,
      });
      return `Playlist \`${playlist_id}\` updated successfully.`;
    }

    case 'youtube_delete_playlist': {
      const { playlist_id } = params;
      if (!playlist_id?.trim()) throw new Error('Missing required param: playlist_id');
      await YouTubeAPI.deletePlaylist(credentials, playlist_id.trim());
      return `Playlist \`${playlist_id}\` deleted.`;
    }

    case 'youtube_add_video_to_playlist': {
      const { playlist_id, video_id } = params;
      if (!playlist_id?.trim()) throw new Error('Missing required param: playlist_id');
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      const item = await YouTubeAPI.addVideoToPlaylist(
        credentials,
        playlist_id.trim(),
        video_id.trim(),
      );
      return `Video \`${video_id}\` added to playlist \`${playlist_id}\`.\nPlaylist item ID: \`${item.id}\``;
    }

    case 'youtube_remove_playlist_item': {
      const { playlist_item_id } = params;
      if (!playlist_item_id?.trim()) throw new Error('Missing required param: playlist_item_id');
      await YouTubeAPI.removePlaylistItem(credentials, playlist_item_id.trim());
      return `Playlist item \`${playlist_item_id}\` removed.`;
    }

    case 'youtube_subscribe_to_channel': {
      const { channel_id } = params;
      if (!channel_id?.trim()) throw new Error('Missing required param: channel_id');
      const sub = await YouTubeAPI.subscribeToChannel(credentials, channel_id.trim());
      return `Subscribed to channel \`${channel_id}\`.\nSubscription ID: \`${sub.id}\``;
    }

    case 'youtube_unsubscribe_from_channel': {
      const { subscription_id } = params;
      if (!subscription_id?.trim()) throw new Error('Missing required param: subscription_id');
      await YouTubeAPI.unsubscribeFromChannel(credentials, subscription_id.trim());
      return `Unsubscribed. Subscription \`${subscription_id}\` removed.`;
    }

    case 'youtube_check_subscription': {
      const { channel_id } = params;
      if (!channel_id?.trim()) throw new Error('Missing required param: channel_id');
      const result = await YouTubeAPI.checkSubscription(credentials, channel_id.trim());
      return result.subscribed
        ? `You are subscribed to \`${channel_id}\`.\nSubscription ID: \`${result.subscriptionId}\``
        : `You are NOT subscribed to \`${channel_id}\`.`;
    }

    case 'youtube_post_comment': {
      const { video_id, text } = params;
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      if (!text?.trim()) throw new Error('Missing required param: text');
      const thread = await YouTubeAPI.postComment(credentials, video_id.trim(), text.trim());
      return `Comment posted!\nComment ID: \`${thread.id}\`\n"${text.slice(0, 100)}"`;
    }

    case 'youtube_reply_to_comment': {
      const { parent_id, text } = params;
      if (!parent_id?.trim()) throw new Error('Missing required param: parent_id');
      if (!text?.trim()) throw new Error('Missing required param: text');
      const comment = await YouTubeAPI.replyToComment(credentials, parent_id.trim(), text.trim());
      return `Reply posted!\nComment ID: \`${comment.id}\`\n"${text.slice(0, 100)}"`;
    }

    case 'youtube_delete_comment': {
      const { comment_id } = params;
      if (!comment_id?.trim()) throw new Error('Missing required param: comment_id');
      await YouTubeAPI.deleteComment(credentials, comment_id.trim());
      return `Comment \`${comment_id}\` deleted.`;
    }

    case 'youtube_get_comment_replies': {
      const { parent_id, max_results = 20 } = params;
      if (!parent_id?.trim()) throw new Error('Missing required param: parent_id');
      const replies = await YouTubeAPI.getCommentReplies(
        credentials,
        parent_id.trim(),
        max_results,
      );
      if (!replies.length) return `No replies found for comment \`${parent_id}\`.`;
      const lines = replies.map((c, i) => {
        const sn = c.snippet ?? {};
        return [
          `${i + 1}. **${sn.authorDisplayName ?? 'Anonymous'}**`,
          `   ${sn.textDisplay?.replace(/<[^>]*>/g, '').slice(0, 200) ?? ''}`,
          `   👍 ${YouTubeAPI.formatCount(sn.likeCount)}`,
        ].join('\n');
      });
      return `Replies (${replies.length}):\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_get_video_rating': {
      const { video_id } = params;
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      const rating = await YouTubeAPI.getVideoRating(credentials, video_id.trim());
      if (!rating) return `No rating info found for \`${video_id}\`.`;
      return `Your rating for \`${video_id}\`: **${rating.rating ?? 'none'}**`;
    }

    case 'youtube_get_trending_videos': {
      const { region_code = 'US', category_id = '0', max_results = 20 } = params;
      const items = await YouTubeAPI.getTrendingVideos(credentials, {
        regionCode: region_code,
        categoryId: category_id,
        maxResults: max_results,
      });
      if (!items.length) return 'No trending videos found.';
      return `Trending in ${region_code} (${items.length}):\n\n${items.map((v, i) => formatVideo(v, i + 1)).join('\n\n')}`;
    }

    case 'youtube_search_channels': {
      const { query, max_results = 10 } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');
      const items = await YouTubeAPI.searchChannels(credentials, query.trim(), max_results);
      if (!items.length) return `No channels found for "${query}".`;
      const lines = items.map((item, i) => {
        const sn = item.snippet ?? {};
        return `${i + 1}. **${sn.channelTitle ?? sn.title ?? '(Unknown)'}**\n   Channel ID: \`${item.id?.channelId ?? ''}\`${sn.description ? `\n   ${sn.description.slice(0, 80)}` : ''}`;
      });
      return `Channel search "${query}" — ${items.length} result${items.length !== 1 ? 's' : ''}:\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_search_playlists': {
      const { query, max_results = 10 } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');
      const items = await YouTubeAPI.searchPlaylists(credentials, query.trim(), max_results);
      if (!items.length) return `No playlists found for "${query}".`;
      const lines = items.map((item, i) => {
        const sn = item.snippet ?? {};
        return `${i + 1}. **${sn.title ?? '(Untitled)'}**\n   Playlist ID: \`${item.id?.playlistId ?? ''}\`\n   By: ${sn.channelTitle ?? 'unknown'}`;
      });
      return `Playlist search "${query}" — ${items.length} result${items.length !== 1 ? 's' : ''}:\n\n${lines.join('\n\n')}`;
    }

    case 'youtube_get_video_categories': {
      const { region_code = 'US' } = params;
      const cats = await YouTubeAPI.getVideoCategories(credentials, region_code);
      if (!cats.length) return 'No categories found.';
      const lines = cats
        .filter((c) => c.snippet?.assignable)
        .map((c) => `${c.id.padStart(3, ' ')}. ${c.snippet?.title ?? '(Unknown)'}`);
      return `YouTube video categories (${region_code}):\n\`\`\`\n${lines.join('\n')}\n\`\`\``;
    }

    case 'youtube_report_video': {
      const { video_id, reason_id, secondary_reason_id = '', comments = '' } = params;
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      if (!reason_id?.trim()) throw new Error('Missing required param: reason_id');
      await YouTubeAPI.reportVideo(
        credentials,
        video_id.trim(),
        reason_id.trim(),
        secondary_reason_id,
        comments,
      );
      return `Video \`${video_id}\` reported with reason \`${reason_id}\`.`;
    }

    default:
      throw new Error(`Unknown YouTube tool: ${toolName}`);
  }
}
