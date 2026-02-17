import fetch from "node-fetch";

async function testSearch() {
  const keyword = "Genshin";
  const url = `https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&search_type=video&page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.bilibili.com/",
        Cookie: "buvid3=infoc;",
      },
    });
    const json = await response.json();
    if (json.data && json.data.result && json.data.result.length > 0) {
      const item = json.data.result[0];
      console.log("Title:", item.title);
      console.log("Favorites:", item.favorites);
      console.log("Review (Replies):", item.review);
      // Check for like, coin, share. API key might be different.
      console.log("Like:", item.like);
      console.log("Coin:", item.coin);
      console.log("Share:", item.share);
      // Sometimes they are in stat object?
      console.log("Stat:", item.stat);

      // Print all keys to find them if they have different names
      console.log("All Keys:", Object.keys(item));
    } else {
      console.log("No results found or API error");
    }
  } catch (error) {
    console.error(error);
  }
}

testSearch();
