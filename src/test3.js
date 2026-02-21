const fetch = require("node-fetch");

async function run() {
  const url = "https://api.bilibili.com/pgc/view/web/season?season_id=44923";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    const text = await res.text();
    console.log("Raw response (up to 1000 chars):", text.slice(0, 1000));
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

run();
