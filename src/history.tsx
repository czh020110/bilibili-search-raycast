import { ActionPanel, Action, List, Image, Color, Icon } from "@raycast/api";
import { useState, useEffect } from "react";
import {
  getHistory,
  VideoItem,
  formatDuration,
  formatNumber,
  ensureHttps,
} from "./utils/bilibili-api";
import { isLoggedIn } from "./utils/auth";

export default function Command() {
  const [history, setHistory] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn());
  const [isShowingDetail, setIsShowingDetail] = useState(true);

  useEffect(() => {
    if (!isUserLoggedIn) {
      setIsLoading(false);
      return;
    }

    async function fetchHistory() {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [isUserLoggedIn]);

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
    >
      {history.map((item) => {
        const title = item.title;
        const cover = ensureHttps(item.pic);
        const url = ensureHttps(item.arcurl);

        const detailMarkdown = `
![Cover](${cover})

# ${title}

${item.description || "No description"}
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
            key={item.bvid || item.aid}
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
