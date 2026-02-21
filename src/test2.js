const fs = require("fs");
const path = require("path");
const https = require("https");

function getCookie() {
  try {
    const authPath = path.join(
      process.env.APPDATA || process.env.HOME,
      "Raycast",
      "extensions",
      "bilibili-search",
      "bilibili_cookies.json",
    );
    if (fs.existsSync(authPath)) {
      const data = JSON.parse(fs.readFileSync(authPath, "utf8"));
      return data.cookie;
    }
  } catch (e) {
    console.error("No cookie");
  }
  return "";
}

function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    https
      .get(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function run() {
  const cookie = getCookie();

  const navJson = await fetchJson(
    "https://api.bilibili.com/x/web-interface/nav",
    {
      headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" },
    },
  );
  const mid = navJson.data.mid;
  console.log("MID:", mid);

  const json = await fetchJson(
    `https://api.bilibili.com/x/space/bangumi/follow/list?type=1&follow_status=0&pn=1&ps=2&vmid=${mid}`,
    {
      headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" },
    },
  );

  console.log("First item:", JSON.stringify(json.data.list[0], null, 2));
}

run();
