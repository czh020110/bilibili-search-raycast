const https = require("https");

function fetchUrl(url, cookie = "") {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Cookie: cookie,
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({});
            }
          });
          res.on("error", reject);
        },
      )
      .on("error", reject);
  });
}

async function run() {
  const bvid = "BV1YL411r7SB"; // Specified in user screenshot/logs
  console.log(`Searching for ${bvid}...`);

  // Search API
  const searchUrl = `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${bvid}`;
  const data = await fetchUrl(searchUrl);

  if (data.code === 0 && data.data && data.data.result) {
    const videoResult = data.data.result.find((r) => r.result_type === "video");
    if (videoResult && videoResult.data) {
      const item = videoResult.data[0]; // First result
      console.log("Found item title:", item.title);
      console.log("Keys:", Object.keys(item));
      console.log("Tags:", item.tag);
      console.log("View:", item.play);
      console.log("Coin:", item.coin); // Check if exists
      console.log("Share:", item.share); // Check if exists
      // Check common stat object just in case
      if (item.stat) console.log("Stat obj:", item.stat);
    } else {
      console.log("No video results found");
    }
  } else {
    console.log("Search API failed or empty");
    console.log(JSON.stringify(data));
  }
}

run();
