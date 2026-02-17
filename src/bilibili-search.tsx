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
  ensureHttps,
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

  // Debounce search
  useEffect(() => {
    if (!searchText) {
      setResults([]);
      return;
    }
    setPage(1);
  }, [searchText]);

  const performSearch = useCallback(
    async (newPage = 1) => {
      if (!searchText) return;

      setIsLoading(true);
      try {
        const data = await searchBilibili(searchText, searchType, newPage);
        if (newPage === 1) {
          setResults(data);
        } else {
          setResults((prev) => [...prev, ...data]);
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
    performSearch(1);
  }, [searchText, searchType]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(nextPage);
  };

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
      {results.map((item, index) => (
        <SearchResultItem
          key={index}
          item={item}
          searchType={searchType}
          onCycleCategory={cycleCategory}
          isShowingDetail={isShowingDetail}
          onToggleDetail={toggleDetail}
        />
      ))}
      {results.length === 0 && !isLoading && (
        <List.EmptyView title="No results found" icon={Icon.MagnifyingGlass} />
      )}
    </List>
  );
}

function SearchResultItem({
  item,
  searchType,
  onCycleCategory,
  isShowingDetail,
  onToggleDetail,
}: {
  item: AnyItem;
  searchType: SearchType;
  onCycleCategory: (dir: 1 | -1) => void;
  isShowingDetail: boolean;
  onToggleDetail: () => void;
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

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label title="作者" text={v.author} />
        <List.Item.Detail.Metadata.Label
          title="观看次数"
          text={formatNumber(v.play)}
        />
        <List.Item.Detail.Metadata.Label
          title="三连"
          text={`▲ ${formatNumber(0)}   ₿ ${formatNumber(0)}   ★ ${formatNumber(v.favorites)}   ↪ ${formatNumber(0)}`}
          icon={Icon.Star}
        />
        <List.Item.Detail.Metadata.Label title="时长" text={v.duration} />
        <List.Item.Detail.Metadata.Label
          title="发布时间"
          text={new Date(v.pubdate * 1000).toLocaleString()}
        />
        <List.Item.Detail.Metadata.Label
          title="评论数量"
          text={formatNumber(v.review)}
        />
        <List.Item.Detail.Metadata.TagList title="标签">
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
      title={title}
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
