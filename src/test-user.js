const fetch = require("node-fetch");

// Mock cookie (needs a real one for some endpoints, but let's try public first or assume I have one)
// I'll grab a cookie from the env if I can, or just use a placeholder and hope for public data.
// Note: x/relation/followings usually needs authentication.
// I will rely on the extension's `getCookie` which works in the app. Here I can only test public endpoints or mock.
// I'll assume standard endpoints work as documented.

async function testUserCard(mid) {
  const url = `https://api.bilibili.com/x/web-interface/card?mid=${mid}&photo=true`;
  console.log(`Fetching User Card: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const json = await res.json();
    if (json.code === 0) {
      const c = json.data;
      console.log("Card Data:", {
        mid: c.card.mid,
        name: c.card.name,
        fans: c.follower, // or c.card.fans? check data structure
        friend: c.card.friend, // following?
        attention: c.card.attention, // following?
        level: c.card.level_info.current_level,
        official: c.card.official_verify,
        desc: c.card.sign,
      });
      console.log("Full Card Structure keys:", Object.keys(c));
      console.log("Card Inner Keys:", Object.keys(c.card));
    } else {
      console.log("Error:", json);
    }
  } catch (e) {
    console.error(e);
  }
}

testUserCard(546195); // Lao Fan
