import fetch from "node-fetch";

export type SearchType =
  | "video"
  | "media_bangumi"
  | "media_ft"
  | "live"
  | "article"
  | "bili_user";

export interface BilibiliResult {
  code: number;
  message: string;
  ttl: number;
  data?: {
    numResults: number;
    numPages: number;
    result?: AnyItem[];
  };
}

export type AnyItem =
  | VideoItem
  | BangumiItem
  | MovieItem
  | LiveItem
  | ArticleItem
  | UserItem;

export interface VideoItem {
  type: "video";
  id: number;
  author: string;
  mid: number;
  typename: string;
  arcurl: string;
  aid: number;
  bvid: string;
  title: string;
  description: string;
  pic: string;
  play: number;
  video_review: number;
  favorites: number;
  tag: string;
  review: number;
  pubdate: number;
  duration: string;
  like: number;
  union_page_data?: {
    badge?: string;
  };
}

export interface BangumiItem {
  type: "media_bangumi";
  media_id: number;
  title: string;
  org_title: string;
  cover: string;
  desc: string;
  season_id: string;
  url: string;
  cv: string;
  staff: string;
  areas: string;
  goto_url: string;
  pubtime: number;
  media_score: {
    score: number;
    user_count: number;
  };
}

export interface MovieItem {
  type: "media_ft"; // Movie / TV
  media_id: number;
  title: string;
  org_title: string;
  cover: string;
  desc: string;
  url: string;
  areas: string;
  staff: string;
  actors: string;
  pubtime: number;
  goto_url: string;
  media_score: {
    score: number;
    user_count: number;
  };
}

export interface LiveItem {
  type: "live_room"; // Returned type is usually live_room or live_user
  uid: number;
  roomid: number;
  title: string;
  uname: string;
  cover: string;
  user_cover: string; // Avatar
  online: number;
  tags: string;
  live_time: string; // Start time yyyy-MM-dd HH:mm:ss
  cate_name: string;
}

export interface ArticleItem {
  type: "article";
  id: number;
  mid: number;
  title: string;
  desc: string;
  template_id: number;
  cover: string[]; // Array of image URLs
  view: number;
  like: number;
  reply: number;
  pub_time: number;
}

export interface UserItem {
  type: "bili_user";
  mid: number;
  uname: string;
  usign: string;
  upic: string;
  videos: number;
  fans: number;
  level: number;
  gender: number;
  is_live: number;
  room_id: number;
  res: Array<{
    aid: number;
    bvid: string;
    title: string;
    pubdate: number;
    arcurl: string;
    pic: string;
    play: string;
    duration: string;
  }>;
}

export async function searchBilibili(
  keyword: string,
  type: SearchType,
  page: number = 1,
): Promise<AnyItem[]> {
  const params = new URLSearchParams({
    keyword,
    search_type: type,
    page: String(page),
  });

  const url = `https://api.bilibili.com/x/web-interface/search/type?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.bilibili.com/",
        Cookie: "buvid3=infoc;", // Sometimes needed to avoid -412
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = (await response.json()) as BilibiliResult;

    if (json.code !== 0) {
      console.error("Bilibili API Error:", json.message);
      return [];
    }

    // Determine result list based on type
    // Video: json.data.result (VideoItem[])
    // Anime: json.data.result (BangumiItem[])
    // ...
    // NOTE: The structure inside `result` usually matches the item type, BUT sometimes `result` is wrapped differently or key names differ slightly.
    // However, x/web-interface/search/type usually returns `result` as an array of items.

    return (json.data?.result || []) as AnyItem[];
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return String(num);
}

export function formatDuration(str: string): string {
  // API usually returns "mm:ss" or just seconds?
  // Video API returns "mm:ss" string like "03:21"
  // Sometimes it might return seconds number.
  // If it's already a string with colon, return it.
  if (String(str).includes(":")) return str;
  return str; // Fallback
}

export function ensureHttps(url: string): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (!url.startsWith("http")) return `https://${url}`;
  return url;
}

export interface VideoStats {
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
}

export async function getVideoDetails(
  bvid: string,
): Promise<VideoStats | null> {
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.bilibili.com/",
      },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as any;
    if (json.code !== 0 || !json.data || !json.data.stat) return null;
    return json.data.stat as VideoStats;
  } catch (error) {
    console.error("Failed to fetch video details:", error);
    return null;
  }
}

export function getProfileUrl(mid: number): string {
  return `https://space.bilibili.com/${mid}`;
}
