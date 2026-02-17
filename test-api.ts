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
    const json = (await response.json()) as any;
    console.log(JSON.stringify(json.data.result[0], null, 2));
  } catch (error) {
    console.error(error);
  }
}

testSearch();
