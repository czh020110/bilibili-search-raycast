import { ActionPanel, Action, List, Image, Color, Icon } from "@raycast/api";
import { useState, useEffect } from "react";
import {
  getFavorites,
  VideoItem,
  formatDuration,
  formatNumber,
  ensureHttps,
} from "./utils/bilibili-api";
import { isLoggedIn } from "./utils/auth";

export default function Command() {
  const [favorites, setFavorites] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    if (!isUserLoggedIn) {
      setIsLoading(false);
      return;
    }

    async function fetchFavorites() {
      try {
        const data = await getFavorites();
        setFavorites(data);
      } catch (error) {
        console.error("Failed to fetch favorites", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFavorites();
  }, [isUserLoggedIn]);

  if (!isUserLoggedIn) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Person}
          title="Login Required"
          description="Please login to view your favorites."
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
    <List isLoading={isLoading} searchBarPlaceholder="Search favorites...">
      {favorites.map((item) => (
        <List.Item
          key={item.bvid || item.aid}
          title={item.title}
          subtitle={item.author}
          icon={{
            source: ensureHttps(item.pic),
            mask: Image.Mask.RoundedRectangle,
          }}
          accessories={[
            { text: formatDuration(item.duration) },
            {
              date: new Date(item.pubdate * 1000),
              tooltip: new Date(item.pubdate * 1000).toLocaleString(),
            },
          ]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                url={ensureHttps(item.arcurl)}
                title="Open Video"
              />
              <Action.CopyToClipboard
                content={ensureHttps(item.arcurl)}
                title="Copy Link"
              />
            </ActionPanel>
          }
        />
      ))}
      <List.EmptyView title="No favorites found" icon={Icon.Star} />
    </List>
  );
}
