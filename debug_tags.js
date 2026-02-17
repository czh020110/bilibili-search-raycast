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
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              console.error("JSON Parse Error:", e);
              console.error("Raw Data:", data.substring(0, 500)); // Log first 500 chars
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
  const bvid = "BV1uT4y1P7CX";

  console.log("--- Checking 'view' endpoint ---");
  const viewData = await fetchUrl(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
  );
  if (viewData.code === 0) {
    console.log("View Data Keys:", Object.keys(viewData.data));
    // Check for common tag fields
    if (viewData.data.tag)
      console.log("viewData.data.tag found:", viewData.data.tag);
    if (viewData.data.tags)
      console.log("viewData.data.tags found:", viewData.data.tags); // Sometimes objects
    if (viewData.data.tag_name)
      console.log("viewData.data.tag_name found:", viewData.data.tag_name);
    if (viewData.data.tname)
      console.log("viewData.data.tname found:", viewData.data.tname);
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
