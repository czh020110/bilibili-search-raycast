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

  // Debounce search
  useEffect(() => {
    if (!searchText) {
      setResults([]);
      return;
    }

    // Reset results when type or text changes, but page change handled separately?
    // Actually if text changes, we reset page to 1.
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

  // Effect to trigger search when typing stops (debouncing manually or rely on useEffect dependecies)
  // But strictly, we want to trigger search when `searchText` or `searchType` or `page` changes.
  // However, we need to be careful not to trigger infinite loops or double fetches.

  // Let's use a simple approach: Trigger search when searchText/searchType changes (reset page 1),
  // and when page changes (load more).

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

  /* 
     Shortcuts for category switching:
     This is tricky because Actions are attached to Items. 
     We can add global actions if possible, or attach to every item.
     We will attach "Switch Category" actions to items.
  */

  const cycleCategory = (direction: 1 | -1) => {
    const currentIndex = categories.findIndex((c) => c.value === searchType);
    let nextIndex = currentIndex + direction;
    if (nextIndex >= categories.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = categories.length - 1;
    setSearchType(categories[nextIndex].value);
  };

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchText={searchText}
      searchBarPlaceholder="Search Bilibili..."
      isShowingDetail={results.length > 0}
      throttle={true}
      pagination={{
        onLoadMore: handleLoadMore,
        hasMore: results.length > 0 && results.length % 20 === 0, // Approx check
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
}: {
  item: AnyItem;
  searchType: SearchType;
  onCycleCategory: (dir: 1 | -1) => void;
}) {
  let title = "";
  let cover = "";
  let url = ""; // Web URL
  let detailMarkdown = "";
  let metadata: React.ReactNode = null;

  // Common Actions
  const commonActions = (
    <ActionPanel>
      <Action.OpenInBrowser url={url} title="Open in Browser" />
      <Action.CopyToClipboard content={url} title="Copy Link" />

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
    cover = v.pic.startsWith("//") ? "https:" + v.pic : v.pic;
    url = v.arcurl;

    detailMarkdown = `
![Cover](${cover})

# ${title}

**Author**: ${v.author}
**Duration**: ${v.duration}
**Published**: ${new Date(v.pubdate * 1000).toLocaleDateString()}

${v.description || "No description"}
        `;

    metadata = (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title="Views"
          text={formatNumber(v.play)}
        />
        <List.Item.Detail.Metadata.Label
          title="Danmaku"
          text={formatNumber(v.video_review)}
        />
        <List.Item.Detail.Metadata.Label
          title="Favorites"
          text={formatNumber(v.favorites)}
        />
        <List.Item.Detail.Metadata.Label
          title="Reviews"
          text={formatNumber(v.review)}
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
    cover = b.cover.startsWith("//") ? "https:" + b.cover : b.cover;
    url = b.url;

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
    cover = m.cover.startsWith("//") ? "https:" + m.cover : m.cover;
    url = m.url;

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
    cover = l.cover.startsWith("//") ? "https:" + l.cover : l.cover;
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
          icon={{
            source: l.user_cover.startsWith("//")
              ? "https:" + l.user_cover
              : l.user_cover,
            mask: Image.Mask.Circle,
          }}
        />
      </List.Item.Detail.Metadata>
    );
  } else if (searchType === "article") {
    const a = item as ArticleItem;
    title = removeHtmlTags(a.title);
    cover = a.cover?.[0]?.startsWith("//")
      ? "https:" + a.cover[0]
      : a.cover?.[0] || "";
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
    cover = u.upic.startsWith("//") ? "https:" + u.upic : u.upic;
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
      actions={commonActions}
    />
  );
}

function removeHtmlTags(str: string) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}
