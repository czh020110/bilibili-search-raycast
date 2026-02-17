import { ActionPanel, Action, List, Image, Color, Icon } from "@raycast/api";
import { useState, useEffect, useRef } from "react";
import {
  getHistory,
  VideoItem,
  formatDuration,
  formatNumber,
  ensureHttps,
  getVideoDetails,
  VideoStats,
} from "./utils/bilibili-api";
import { isLoggedIn } from "./utils/auth";

export default function Command() {
  const [history, setHistory] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn());
  const [isShowingDetail, setIsShowingDetail] = useState(true);
  const [cursor, setCursor] = useState<any>(null);
  const [videoStats, setVideoStats] = useState<Record<string, VideoStats>>({});

  const fetchHistory = async (nextCursor: any = null) => {
    setIsLoading(true);
    try {
      const data = await getHistory(nextCursor);
      if (nextCursor) {
        setHistory((prev) => {
          // Deduplicate
          const existing = new Set(prev.map((p) => p.bvid));
          const newData = data.list.filter((d) => !existing.has(d.bvid));
          return [...prev, ...newData];
        });
      } else {
        setHistory(data.list);
      }
      setCursor(data.cursor);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoggedIn) {
      setIsLoading(false);
      return;
    }
    fetchHistory();
  }, [isUserLoggedIn]);

  const selectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleSelectionChange = async (id: string | null) => {
    if (selectionTimeout.current) clearTimeout(selectionTimeout.current);
    if (!id) return;

    selectionTimeout.current = setTimeout(async () => {
      if (videoStats[id]) return;
      const stats = await getVideoDetails(id);
      if (stats) {
        setVideoStats((prev) => ({ ...prev, [id]: stats }));
      }
    }, 300);
  };

  if (!isUserLoggedIn) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Person}
          title="Login Required"
          description="Please login to view your history."
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                url="https://www.bilibili.com"
                title="Open Bilibili"
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search history..."
      isShowingDetail={isShowingDetail}
      pagination={{
        onLoadMore: () => {
          if (cursor) fetchHistory(cursor);
        },
        hasMore: !!cursor,
        pageSize: 20,
      }}
      onSelectionChange={handleSelectionChange}
    >
      {history.map((item, index) => {
        // Only fetch stats if we have a valid bvid
        const bvid = item.bvid;
        const stats = videoStats[bvid];

        const title = item.title;
        const cover = ensureHttps(item.pic);
        const url = ensureHttps(item.arcurl);

        const description = stats?.desc || item.description || "No description";

        // Prefer stats from real-time fetch, fall back to item data, then 0
        const play = stats?.view || item.play || 0;
        const like = stats?.like || item.like || 0;
        const coin = stats?.coin || 0;
        const fav = stats?.favorite || item.favorites || 0;
        const share = stats?.share || 0;
        const reply = stats?.reply || item.review || 0;
        const danmaku = stats?.danmaku || item.video_review || 0;

        const detailMarkdown = `
![Cover](${cover})

# ${title}

${description}
        `;

        const metadata = (
          <List.Item.Detail.Metadata>
            <List.Item.Detail.Metadata.Label
              title="Author"
              text={item.author}
              icon={
                item.owner?.face
                  ? {
                      source: ensureHttps(item.owner.face),
                      mask: Image.Mask.Circle,
                    }
                  : undefined
              }
            />
            <List.Item.Detail.Metadata.Label
              title="Data"
              text={`⏯ ${formatNumber(play)}   ▲ ${formatNumber(like)}   ₿ ${formatNumber(coin)}   ★ ${formatNumber(fav)}   ↪ ${formatNumber(share)}   “ ${formatNumber(reply)}   ※ ${formatNumber(danmaku)}`}
            />
            <List.Item.Detail.Metadata.Label
              title="Duration"
              text={formatDuration(item.duration)}
            />
            <List.Item.Detail.Metadata.Label
              title="Publish"
              text={new Date(item.pubdate * 1000).toLocaleString()}
            />
          </List.Item.Detail.Metadata>
        );

        return (
          <List.Item
            key={`${item.bvid}-${index}`}
            id={bvid}
            title={title}
            subtitle={!isShowingDetail ? item.author : undefined}
            icon={
              !isShowingDetail
                ? {
                    source: cover,
                    mask: Image.Mask.RoundedRectangle,
                  }
                : undefined
            }
            accessories={
              !isShowingDetail
                ? [
                    { text: formatDuration(item.duration) },
                    {
                      date: new Date(item.pubdate * 1000),
                      tooltip: new Date(item.pubdate * 1000).toLocaleString(),
                    },
                  ]
                : undefined
            }
            detail={
              <List.Item.Detail markdown={detailMarkdown} metadata={metadata} />
            }
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={url} title="Open Video" />
                <Action.CopyToClipboard content={url} title="Copy Link" />
                <ActionPanel.Section title="View Options">
                  <Action
                    title={isShowingDetail ? "Hide Details" : "Show Details"}
                    icon={isShowingDetail ? Icon.EyeSlash : Icon.Eye}
                    shortcut={{ modifiers: ["ctrl"], key: "b" }}
                    onAction={() => setIsShowingDetail(!isShowingDetail)}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
      <List.EmptyView title="No history found" icon={Icon.Clock} />
    </List>
  );
}
