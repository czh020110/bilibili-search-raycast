const fetch = require("node-fetch");

// Need a cookie for this likely
// I'll try without, but likely fail or need to be run in context where cookie is available.
// Since I can't easily inject cookie here without logging it (security risk),
// I'll verify if the endpoint 404s or 401s.
// If 401, it exists. If 404, it probably doesn't.

async function testSearchFollowings() {
  const url = `https://api.bilibili.com/x/web-interface/relation/followings/search?name=test`;
  console.log(`Checking Endpoint: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    console.log(`Status: ${res.status}`);
    const json = await res.json();
    console.log("Response:", json);
  } catch (e) {
    console.error(e);
  }
}

testSearchFollowings();
