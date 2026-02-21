const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

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

async function run() {
  const midRes = await fetch("https://api.bilibili.com/x/web-interface/nav", {
    headers: { Cookie: getCookie(), "User-Agent": "Mozilla/5.0" },
  });
  const navJson = await midRes.json();
  const mid = navJson.data.mid;

  const res = await fetch(
    `https://api.bilibili.com/x/space/bangumi/follow/list?type=1&follow_status=0&pn=1&ps=15&vmid=${mid}`,
    {
      headers: { Cookie: getCookie(), "User-Agent": "Mozilla/5.0" },
    },
  );
  const json = await res.json();
  console.log(JSON.stringify(json.data.list[0], null, 2));
}

run();
