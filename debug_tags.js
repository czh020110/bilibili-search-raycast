const https = require("https");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(JSON.parse(data)));
          res.on("error", reject);
        },
      )
      .on("error", reject);
  });
}

async function run() {
  const bvid = "BV1uT4y1P7CX";

  console.log("--- Checking 'view' endpoint ---");
  const viewData = await fetchUrl(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
  );
  if (viewData.code === 0) {
    console.log("Data Keys:", Object.keys(viewData.data));
    if (viewData.data.tags) console.log("Found 'tags' in view!");
    if (viewData.data.tag) console.log("Found 'tag' in view!");
    if (viewData.data.str) console.log("Found 'str' in view!");
    console.log("Stat:", viewData.data.stat); // Check if view count is here
  } else {
    console.log("View endpoint failed");
  }

  console.log("\n--- Checking 'tags' endpoint ---");
  // https://api.bilibili.com/x/tag/archive/tags?bvid=BV1...
  const tagData = await fetchUrl(
    `https://api.bilibili.com/x/tag/archive/tags?bvid=${bvid}`,
  );
  if (tagData.code === 0) {
    console.log("Tag Data:", JSON.stringify(tagData.data, null, 2));
  } else {
    console.log("Tag endpoint failed");
  }
}

run();
