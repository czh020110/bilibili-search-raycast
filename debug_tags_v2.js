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
            Referer: "https://www.bilibili.com/",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              console.error("Parse Error");
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
  const bvid = "BV1uT4y1P7CX"; // Example
  console.log(`Checking tags for ${bvid}...`);

  // Check tags endpoint
  const tagsUrl = `https://api.bilibili.com/x/tag/archive/tags?bvid=${bvid}`;
  const tagsData = await fetchUrl(tagsUrl);
  if (tagsData.code === 0 && tagsData.data) {
    console.log(
      "x/tag/archive/tags found:",
      tagsData.data.map((t) => t.tag_name).join(","),
    );
  } else {
    console.log("x/tag/archive/tags FAILED or empty");
  }

  // Check view endpoint fallback
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  const viewData = await fetchUrl(viewUrl);
  if (viewData.code === 0 && viewData.data) {
    console.log("tname:", viewData.data.tname);
    console.log("tag_name:", viewData.data.tag_name);
    console.log("dynamic:", viewData.data.dynamic);
  } else {
    console.log("view endpoint FAILED");
  }
}

run();
