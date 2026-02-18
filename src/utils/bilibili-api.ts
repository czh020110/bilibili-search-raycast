import fetch from "node-fetch";
import { getCookie } from "./auth";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const REFERER = "https://www.bilibili.com/";

export type SearchType =
  | "video"
  | "media_bangumi"
  | "media_ft"
  | "live"
  | "article"
  | "video"
  | "media_bangumi"
  | "media_ft"
  | "live"
  | "article"
  | "bili_user";

export interface FavoriteFolder {
  id: number;
  fid: number;
  mid: number;
  attr: number;
  title: string;
  fav_state: number;
  media_count: number;
}

async function getVideoTags(bvid: string, headers: Record<string, string>) {
  const tagUrl = `https://api.bilibili.com/x/web-interface/view/detail/tag?bvid=${bvid}`;
  const res = await fetch(tagUrl, { headers });
  if (!res.ok) return "";
  const json = (await res.json()) as any;
  if (json.code !== 0 || !json.data) return "";
  const names = (json.data as any[])
    .map((t) => String(t.tag_name || "").trim())
    .filter(Boolean);
  return names.join(",");
}
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
  owner?: {
    mid: number;
    name: string;
    face: string;
  };
  stat?: {
    view: number;
    like: number;
    danmaku: number;
    coin: number;
  };
  uri?: string;
  rcmd_reason?: {
    content: string;
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
  following?: number; // Added following count
  level: number;
  gender: number;
  is_live: number;
  room_id: number;
  official_verify?: {
    type: number;
    desc: string;
  };
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

// ... existing code ...

export async function getUserCard(mid: number): Promise<UserItem | null> {
  const url = `https://api.bilibili.com/x/web-interface/card?mid=${mid}&photo=true`;
  const headers = {
    "User-Agent": USER_AGENT,
    Referer: REFERER,
    Cookie: getCookie() || "",
  };

  try {
    const res = await fetch(url, { headers });
    const json = (await res.json()) as any;
    if (json.code === 0 && json.data && json.data.card) {
      const card = json.data.card;
      return {
        type: "bili_user",
        mid: card.mid,
        uname: card.name,
        usign: card.sign,
        upic: card.face,
        videos: json.data.archive_count || 0,
        fans: card.fans,
        following: card.attention,
        level: card.level_info?.current_level || 0,
        gender: card.sex === "男" ? 1 : card.sex === "女" ? 2 : 0,
        is_live: 0, // Not always available here
        room_id: 0,
        official_verify: card.official_verify,
        res: [],
      };
    }
  } catch (e) {
    console.error(`Failed to fetch user card for ${mid}`, e);
  }
  return null;
}

export async function getHistory(
  cursor: {
    max: number;
    view_at: number;
    business: string;
    ps: number;
  } | null = null,
): Promise<{ list: VideoItem[]; cursor: any }> {
  const cookie = getCookie();
  if (!cookie) return { list: [], cursor: null };

  let url = "https://api.bilibili.com/x/web-interface/history/cursor?ps=20";
  if (cursor) {
    url += `&max=${cursor.max}&view_at=${cursor.view_at}&business=${cursor.business}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: REFERER,
        Cookie: cookie,
      },
    });
    const json = (await response.json()) as any;
    if (json.code === 0 && json.data && json.data.list) {
      if (json.data.list.length > 0) {
        console.log(
          "Raw History Item [0]:",
          JSON.stringify(json.data.list[0], null, 2),
        );
      }
      const list = json.data.list.map((item: any) => ({
        type: "video",
        bvid: item.history.bvid,
        title: item.title,
        pic: item.cover,
        author: item.author_name,
        arcurl: `https://www.bilibili.com/video/${item.history.bvid}`,
        duration: item.duration,
        pubdate: item.view_at,
        // Fill other fields with defaults or map from available data
        id: item.history.oid,
        mid: item.author_mid,
        typename: item.tag_name,
        aid: item.history.oid,
        description: "",
        play: 0,
        video_review: 0,
        favorites: 0,
        tag: "",
        review: 0,
        like: 0,
      })) as VideoItem[];
      return { list, cursor: json.data.cursor };
    }
    return { list: [], cursor: null };
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return { list: [], cursor: null };
  }
}

export async function getSelfMid(): Promise<number | null> {
  const cookie = getCookie();
  if (!cookie) return null;
  try {
    const navRes = await fetch("https://api.bilibili.com/x/web-interface/nav", {
      headers: { Cookie: cookie, "User-Agent": USER_AGENT },
    });
    const navJson = (await navRes.json()) as any;
    if (navJson.code === 0) {
      return navJson.data.mid;
    }
  } catch (e) {
    console.error("Failed to fetch self mid", e);
  }
  return null;
}

export async function getFavoriteFolders(
  mid: number,
): Promise<FavoriteFolder[]> {
  const cookie = getCookie();
  if (!cookie) return [];

  try {
    const folderRes = await fetch(
      `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${mid}`,
      { headers: { Cookie: cookie, "User-Agent": USER_AGENT } },
    );
    const folderJson = (await folderRes.json()) as any;
    if (folderJson.code === 0 && folderJson.data && folderJson.data.list) {
      return folderJson.data.list as FavoriteFolder[];
    }
  } catch (e) {
    console.error("Failed to fetch favorite folders", e);
  }
  return [];
}

export async function getFavorites(
  mediaId?: number,
  page: number = 1,
  keyword: string = "",
): Promise<VideoItem[]> {
  const cookie = getCookie();
  if (!cookie) return [];

  let targetMediaId = mediaId;

  if (!targetMediaId) {
    const mid = await getSelfMid();
    if (mid) {
      const folders = await getFavoriteFolders(mid);
      if (folders.length > 0) {
        targetMediaId = folders[0].id; // Default to first folder
      }
    }
  }

  if (!targetMediaId) return [];

  try {
    const resUrl = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${targetMediaId}&ps=20&pn=${page}&keyword=${encodeURIComponent(
      keyword,
    )}&order=mtime&type=0&tid=0&platform=web`;
    const resRes = await fetch(resUrl, {
      headers: { Cookie: cookie, "User-Agent": USER_AGENT },
    });
    const resJson = (await resRes.json()) as any;
    if (resJson.code === 0 && resJson.data && resJson.data.medias) {
      if (resJson.data.medias.length > 0 && page === 1) {
        console.log(
          "Raw Favorites Item [0]:",
          JSON.stringify(resJson.data.medias[0], null, 2),
        );
      }
      return resJson.data.medias.map((item: any) => ({
        type: "video",
        bvid: item.bvid,
        title: item.title,
        pic: item.cover,
        author: item.upper.name,
        arcurl: `https://www.bilibili.com/video/${item.bvid}`,
        duration: formatDuration(item.duration),
        pubdate: item.ctime,
        id: item.id,
        mid: item.upper.mid,
        typename: "",
        aid: item.id,
        description: item.intro,
        play: item.cnt_info.play,
        video_review: item.cnt_info.danmaku,
        favorites: item.cnt_info.collect,
        tag: "",
        review: item.cnt_info.reply,
        like: 0,
      }));
    }
  } catch (e) {
    console.error("Failed to fetch favorites", e);
  }

  return [];
  return [];
}

export async function getAllFavorites(
  mediaId: number,
  keyword: string = "",
): Promise<VideoItem[]> {
  const allItems: VideoItem[] = [];
  let page = 1;

  while (true) {
    const items = await getFavorites(mediaId, page, keyword);
    if (items.length === 0) break;
    allItems.push(...items);
    if (items.length < 20) break; // Less than page size means end of list
    page++;
    // Add a small delay to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allItems;
}

export async function getRecommendations(): Promise<VideoItem[]> {
  // Top Rcmd: https://api.bilibili.com/x/web-interface/index/top/feed/rcmd?y_num=5&fresh_type=4&feed_version=V9&fetch_row=1&fresh_idx=1&fresh_idx_1h=1&brush=1&homepage_ver=1&ps=20
  const url =
    "https://api.bilibili.com/x/web-interface/index/top/feed/rcmd?ps=20";
  const cookie = getCookie();
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: REFERER,
        Cookie: cookie, // Helps with personalized recommendations
      },
    });
    const json = (await response.json()) as any;
    if (json.code === 0 && json.data && json.data.item) {
      return json.data.item.map((item: any) => ({
        type: "video",
        bvid: item.bvid,
        title: item.title,
        pic: item.pic,
        author: item.owner.name,
        arcurl: item.uri,
        duration: formatDuration(String(item.duration)),
        pubdate: item.pubdate,
        id: item.id,
        mid: item.owner.mid,
        typename: "",
        aid: item.id,
        description: "",
        play: item.stat.view,
        video_review: item.stat.danmaku,
        favorites: 0,
        tag: "",
        review: 0,
        like: item.stat.like,
        owner: {
          mid: item.owner.mid,
          name: item.owner.name,
          face: item.owner.face,
        },
      }));
    }
  } catch (e) {
    console.error("Failed to fetch recommendations", e);
  }
  return [];
}

export async function getPopularVideos(page: number = 1): Promise<VideoItem[]> {
  const url = `https://api.bilibili.com/x/web-interface/popular?ps=20&pn=${page}`;
  const rawCookie = getCookie();
  const cookie = rawCookie || "buvid3=infoc;";

  console.log(
    `Fetching popular videos page ${page} with cookie length: ${cookie.length}`,
  );

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: REFERER,
        Cookie: cookie,
      },
    });

    if (!response.ok) {
      console.error(
        `Popular API validation failed: ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as any;
    console.log(`Popular API Response Code: ${json.code}`);

    if (json.code === 0 && json.data && json.data.list) {
      console.log(`Found ${json.data.list.length} popular videos`);
      return json.data.list.map((item: any) => ({
        type: "video",
        bvid: item.bvid,
        title: item.title,
        pic: item.pic,
        author: item.owner.name,
        arcurl:
          item.short_link_v2 || `https://www.bilibili.com/video/${item.bvid}`,
        duration: formatDuration(String(item.duration)),
        pubdate: item.pubdate,
        id: item.aid,
        mid: item.owner.mid,
        typename: item.tname,
        aid: item.aid,
        description: item.desc || "",
        play: item.stat.view,
        video_review: item.stat.danmaku,
        favorites: item.stat.favorite,
        tag: item.rcmd_reason?.content || "",
        review: item.stat.reply,
        like: item.stat.like,
        owner: {
          mid: item.owner.mid,
          name: item.owner.name,
          face: item.owner.face,
        },
      }));
    } else {
      console.log("Popular API returned no list:", JSON.stringify(json));
    }
  } catch (e) {
    console.error("Failed to fetch popular videos", e);
  }
  return [];
}

export async function getFollowings(page: number = 1): Promise<UserItem[]> {
  const mid = await getSelfMid();
  if (!mid) return [];

  const url = `https://api.bilibili.com/x/relation/followings?vmid=${mid}&pn=${page}&ps=20&order=desc`;
  const cookie = getCookie();

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: REFERER,
        Cookie: cookie || "",
      },
    });
    const json = (await response.json()) as any;
    if (json.code === 0 && json.data && json.data.list) {
      return json.data.list.map((item: any) => ({
        type: "bili_user",
        mid: item.mid,
        uname: item.uname,
        usign: item.sign,
        upic: item.face,
        videos: 0, // API doesn't return video count directly here
        fans: 0, // API doesn't return fans count directly here
        level: 0, // API doesn't return level directly here
        gender: 0,
        is_live: 0,
        room_id: 0,
        res: [],
      }));
    }
  } catch (e) {
    console.error("Failed to fetch followings", e);
  }
  return [];
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
    const results = (json.data?.result || []) as any[];

    if (type === "video") {
      return results.map((item) => ({
        ...item,
        type: "video",
        owner: {
          mid: item.mid,
          name: item.author,
          face: item.upic, // Map upic to owner.face
        },
      }));
    }

    return results as AnyItem[];
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
  if (!str) return "00:00";

  // If it's pure seconds (no colon)
  if (!String(str).includes(":")) {
    const seconds = parseInt(str, 10);
    if (isNaN(seconds)) return str;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    } else {
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
  }

  // If it is mm:ss or hh:mm:ss
  const parts = str.split(":").map((p) => parseInt(p, 10));

  // If already h:m:s (3 parts), return as is (maybe clean up leading zeros if wanted, but standard is fine)
  if (parts.length === 3) return str;

  if (parts.length === 2) {
    let [m, s] = parts;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      m = m % 60;
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
  }

  return str;
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
  tag?: string; // Add tag to stats for convenience or create a separate Details interface
  desc?: string;
  owner?: {
    mid: number;
    name: string;
    face: string;
  };
}

export async function getVideoDetails(
  bvid: string,
): Promise<VideoStats | null> {
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;

  try {
    const rawCookie = getCookie() || "";
    const cookieHeader = rawCookie
      ? `${rawCookie}; buvid3=infoc;`
      : "buvid3=infoc;";

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Referer: "https://www.bilibili.com/",
      Cookie: cookieHeader,
    };

    const viewRes = await fetch(viewUrl, { headers });
    if (!viewRes.ok) return null;

    const viewJson = (await viewRes.json()) as any;
    if (viewJson.code !== 0 || !viewJson.data) return null;

    // ✅ 稳定获取 tags：detail/tag
    const tagName = await getVideoTags(bvid, headers);

    return {
      ...viewJson.data.stat,
      tag: tagName || viewJson.data.tname || "",
      desc: viewJson.data.desc,
      owner: viewJson.data.owner,
    } as VideoStats;
  } catch (error) {
    console.error("Failed to fetch video details:", error);
    return null;
  }
}

export function getProfileUrl(mid: number): string {
  return `https://space.bilibili.com/${mid}`;
}
