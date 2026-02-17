import {
  ActionPanel,
  List,
  Action,
  Icon,
  Image,
  useNavigation,
  Color,
  LaunchProps,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import {
  searchBilibili,
  SearchType,
  AnyItem,
  VideoItem,
  BangumiItem,
  MovieItem,
  LiveItem,
  ArticleItem,
  UserItem,
  formatNumber,
  formatDuration,
  ensureHttps,
  getVideoDetails,
  VideoStats,
  getRecommendations,
} from "./utils/bilibili-api";

interface SearchArguments {
  query?: string;
}

export default function Command(
  props: LaunchProps<{ arguments: SearchArguments }>,
) {
  const [searchText, setSearchText] = useState(props.arguments.query || "");
  const [searchType, setSearchType] = useState<SearchType>("video");
  const [results, setResults] = useState<AnyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isShowingDetail, setIsShowingDetail] = useState(true);
  const [videoStats, setVideoStats] = useState<Record<string, VideoStats>>({});

  // Debounce search
  useEffect(() => {
    /*
    if (!searchText) {
      setResults([]);
      return;
    }
    */
    setPage(1);
    setVideoStats({}); // Clear stats on new search
  }, [searchText]);

  const performSearch = useCallback(
    async (newPage = 1) => {
      if (!searchText) return;

      setIsLoading(true);
      try {
        let data: AnyItem[] = [];
        if (!searchText && newPage === 1) {
          // Fetch recommendations
          data = await getRecommendations();
        } else if (searchText) {
          data = await searchBilibili(searchText, searchType, newPage);
        }
        if (newPage === 1) {
          setResults(data);
        } else {
          setResults((prev) => {
            // Deduplicate based on BVID for video items, or fallback to simple id check with type guard
            if (!data.length) return prev;

            // Create a set of existing IDs to check against
            const existingIds = new Set(
              prev.map((i) => {
                if ("bvid" in i) return i.bvid;
                if ("id" in i) return String(i.id);
                if ("media_id" in i) return String(i.media_id);
                return "";
              }),
            );

            const newData = data.filter((i) => {
              let id = "";
              if ("bvid" in i) id = i.bvid;
              else if ("id" in i) id = String(i.id);
              else if ("media_id" in i) id = String(i.media_id);
              return id ? !existingIds.has(id) : true;
            });

            return [...prev, ...newData];
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [searchText, searchType],
  );

  useEffect(() => {
    // Initial load (recommendations) or search change
    performSearch(1);
  }, [searchText]); // Only re-run when searchText changes. searchType change is handled by performSearch logic but we might want to reset if type changes AND we are searching. But for empty search (recommendations) type doesn't matter much or we only show video recommendations.

  useEffect(() => {
    if (searchText) {
      performSearch(1);
    }
  }, [searchType]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(nextPage);
  };

  // Batch fetch stats for new items
  useEffect(() => {
    if (searchType !== "video") return;

    const fetchMissingStats = async () => {
      const missingBvids = results
        .filter((item): item is VideoItem => "bvid" in item)
        .map((item) => item.bvid)
        .filter((bvid) => !videoStats[bvid]);

      if (missingBvids.length === 0) return;

      const newStats: Record<string, VideoStats> = {};
      const chunkSize = 5;
      for (let i = 0; i < missingBvids.length; i += chunkSize) {
        const chunk = missingBvids.slice(i, i + chunkSize);
        const promises = chunk.map(async (bvid) => {
          const stats = await getVideoDetails(bvid);
          if (stats) {
            newStats[bvid] = stats;
          }
        });
        await Promise.all(promises);
        setVideoStats((prev) => ({ ...prev, ...newStats }));
      }
    };

    fetchMissingStats();
  }, [results, searchType]);

  const handleSelectionChange = async (id: string | null) => {};

  const categories: { label: string; value: SearchType }[] = [
    { label: "Video", value: "video" },
    { label: "Anime", value: "media_bangumi" },
    { label: "Movie/TV", value: "media_ft" },
    { label: "Live", value: "live" },
    { label: "Article", value: "article" },
    { label: "User", value: "bili_user" },
  ];

  const cycleCategory = (direction: 1 | -1) => {
    const currentIndex = categories.findIndex((c) => c.value === searchType);
    let nextIndex = currentIndex + direction;
    if (nextIndex >= categories.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = categories.length - 1;
    setSearchType(categories[nextIndex].value);
  };

  const toggleDetail = () => {
    setIsShowingDetail((prev) => !prev);
  };

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchText={searchText}
      searchBarPlaceholder="Search Bilibili..."
      isShowingDetail={isShowingDetail && results.length > 0}
      throttle={true}
      pagination={{
        onLoadMore: handleLoadMore,
        hasMore: results.length > 0 && results.length % 20 === 0,
        pageSize: 20,
      }}
      onSelectionChange={handleSelectionChange}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Search Category"
          value={searchType}
          onChange={(newValue) => setSearchType(newValue as SearchType)}
        >
          {categories.map((cat) => (
            <List.Dropdown.Item
              key={cat.value}
              title={cat.label}
              value={cat.value}
            />
          ))}
        </List.Dropdown>
      }
    >
      {results.map((item, index) => {
        const id =
          searchType === "video" ? (item as VideoItem).bvid : String(index);
        return (
          <SearchResultItem
            key={`${id}-${index}`}
            id={id}
            item={item}
            searchType={searchType}
            onCycleCategory={cycleCategory}
            isShowingDetail={isShowingDetail}
            onToggleDetail={toggleDetail}
            videoStats={
              searchType === "video"
                ? videoStats[(item as VideoItem).bvid]
                : undefined
            }
          />
        );
      })}
      {results.length === 0 && !isLoading && (
        <List.EmptyView title="No results found" icon={Icon.MagnifyingGlass} />
      )}
    </List>
  );
}

function SearchResultItem({
  id,
  item,
  searchType,
  onCycleCategory,
  isShowingDetail,
  onToggleDetail,
  videoStats,
}: {
  id: string;
  item: AnyItem;
  searchType: SearchType;
  onCycleCategory: (dir: 1 | -1) => void;
  isShowingDetail: boolean;
  onToggleDetail: () => void;
  videoStats?: VideoStats;
}) {
  let title = "";
  let cover = "";
  let url = "";
  let detailMarkdown = "";
  let metadata: any = null;

  // Protocol Check handled inside specific types via ensureHttps

  // Common Actions
  const commonActions = (targetUrl: string) => (
    <ActionPanel>
      <Action.OpenInBrowser url={targetUrl} title="Open in Browser" />
      <Action.CopyToClipboard content={targetUrl} title="Copy Link" />

      <ActionPanel.Section title="View Options">
        <Action
          title={isShowingDetail ? "Hide Details" : "Show Details"}
          icon={isShowingDetail ? Icon.EyeSlash : Icon.Eye}
          shortcut={{ modifiers: ["ctrl"], key: "b" }}
          onAction={onToggleDetail}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Navigation">
        <Action
          title="Next Category"
          icon={Icon.ArrowRight}
          shortcut={{ modifiers: ["ctrl"], key: "arrowRight" }}
          onAction={() => onCycleCategory(1)}
        />
        <Action
          title="Previous Category"
          icon={Icon.ArrowLeft}
          shortcut={{ modifiers: ["ctrl"], key: "arrowLeft" }}
          onAction={() => onCycleCategory(-1)}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );

  if (searchType === "video") {
    const v = item as VideoItem;
    title = removeHtmlTags(v.title);
    cover = ensureHttps(v.pic);
    url = ensureHttps(v.arcurl);

    detailMarkdown = `
![Cover](${cover})

# ${title}

${v.description || "No description"}
        `;

    // Use stats from videoStats if available, otherwise use basic info from search result
    const like = videoStats?.like ?? v.like ?? 0;
    const coin = videoStats?.coin ?? 0;
    const fav = videoStats?.favorite ?? v.favorites;
    const share = videoStats?.share ?? 0;
    const reply = videoStats?.reply ?? v.review;
    const danmaku = videoStats?.danmaku ?? v.video_review;

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Author"
          text={v.author}
          icon={
            v.owner?.face
              ? { source: ensureHttps(v.owner.face), mask: Image.Mask.Circle }
              : undefined
          }
        />
        <List.Item.Detail.Metadata.Label
          title="Data"
          text={`⏯ ${formatNumber(v.play)}   ▲ ${formatNumber(like)}   ₿ ${formatNumber(coin)}   ★ ${formatNumber(fav)}   ↪ ${formatNumber(share)}   “ ${formatNumber(reply)}   ※ ${formatNumber(danmaku)}`}
        />
        <List.Item.Detail.Metadata.Label
          title="Duration"
          text={formatDuration(v.duration)}
        />
        <List.Item.Detail.Metadata.Label
          title="Publish"
          text={new Date(v.pubdate * 1000).toLocaleString()}
        />

        <List.Item.Detail.Metadata.TagList title="Tags">
          {v.tag
            .split(",")
            .slice(0, 5)
            .map((t) => (
              <List.Item.Detail.Metadata.TagList.Item key={t} text={t} />
            ))}
        </List.Item.Detail.Metadata.TagList>
      </List.Item.Detail.Metadata>
    );
  } else if (searchType === "media_bangumi") {
    const b = item as BangumiItem;
    title = removeHtmlTags(b.title);
    cover = ensureHttps(b.cover);
    url = ensureHttps(b.url);

    detailMarkdown = `
![Cover](${cover})

# ${title}

**Score**: ${b.media_score?.score ?? "N/A"}
**CV**: ${b.cv}

${b.desc || "No description"}
        `;

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Score"
          text={String(b.media_score?.score ?? "N/A")}
        />
        <List.Item.Detail.Metadata.Label title="Staff" text={b.staff} />
        <List.Item.Detail.Metadata.Label title="Areas" text={b.areas} />
      </List.Item.Detail.Metadata>
    );
  } else if (searchType === "media_ft") {
    const m = item as MovieItem;
    title = removeHtmlTags(m.title);
    cover = ensureHttps(m.cover);
    url = ensureHttps(m.url);

    detailMarkdown = `
![Cover](${cover})

# ${title}

**Score**: ${m.media_score?.score ?? "N/A"}
**Actors**: ${m.actors}

${m.desc || "No description"}
        `;

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Score"
          text={String(m.media_score?.score ?? "N/A")}
        />
        <List.Item.Detail.Metadata.Label title="Staff" text={m.staff} />
        <List.Item.Detail.Metadata.Label title="Areas" text={m.areas} />
      </List.Item.Detail.Metadata>
    );
  } else if (searchType === "live") {
    const l = item as LiveItem;
    title = removeHtmlTags(l.title);
    cover = ensureHttps(l.cover);
    url = `https://live.bilibili.com/${l.roomid}`;

    detailMarkdown = `
![Cover](${cover})

# ${title}

**Host**: ${l.uname}
**Category**: ${l.cate_name}
**Time**: ${l.live_time}

Tags: ${l.tags}
        `;

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Room ID"
          text={String(l.roomid)}
        />
        <List.Item.Detail.Metadata.Label
          title="Online"
          text={formatNumber(l.online)}
        />
        <List.Item.Detail.Metadata.Label
          title="Host"
          text={l.uname}
          icon={{ source: ensureHttps(l.user_cover), mask: Image.Mask.Circle }}
        />
      </List.Item.Detail.Metadata>
    );
  } else if (searchType === "article") {
    const a = item as ArticleItem;
    title = removeHtmlTags(a.title);
    cover = a.cover && a.cover[0] ? ensureHttps(a.cover[0]) : "";
    url = `https://www.bilibili.com/read/cv${a.id}`;

    detailMarkdown = `
![Cover](${cover})

# ${title}

${a.desc || "No summary"}
        `;

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Views"
          text={formatNumber(a.view)}
        />
        <List.Item.Detail.Metadata.Label
          title="Likes"
          text={formatNumber(a.like)}
        />
        <List.Item.Detail.Metadata.Label
          title="Replies"
          text={formatNumber(a.reply)}
        />
      </List.Item.Detail.Metadata>
    );
  } else if (searchType === "bili_user") {
    const u = item as UserItem;
    title = u.uname;
    cover = ensureHttps(u.upic);
    url = `https://space.bilibili.com/${u.mid}`;

    detailMarkdown = `
![Avatar](${cover})

# ${title}

**Bio**: ${u.usign}
**Level**: ${u.level}
        `;

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Fans"
          text={formatNumber(u.fans)}
        />
        <List.Item.Detail.Metadata.Label
          title="Videos"
          text={formatNumber(u.videos)}
        />
        <List.Item.Detail.Metadata.Label title="UID" text={String(u.mid)} />
      </List.Item.Detail.Metadata>
    );
  }

  return (
    <List.Item
      id={id}
      title={title}
      subtitle={
        !isShowingDetail
          ? (item as any).author || (item as any).uname
          : undefined
      }
      icon={
        !isShowingDetail
          ? { source: cover, mask: Image.Mask.RoundedRectangle }
          : undefined
      }
      accessories={
        !isShowingDetail
          ? [
              {
                text: `⏯ ${formatNumber((item as any).play || (item as any).view || 0)}`,
              },
              { text: formatDuration((item as any).duration) },
              {
                date: (item as any).pubdate
                  ? new Date((item as any).pubdate * 1000)
                  : undefined,
                tooltip: (item as any).pubdate
                  ? new Date((item as any).pubdate * 1000).toLocaleString()
                  : undefined,
              },
            ]
          : undefined
      }
      detail={
        <List.Item.Detail markdown={detailMarkdown} metadata={metadata} />
      }
      actions={commonActions(url)}
    />
  );
}

function removeHtmlTags(str: string) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}
