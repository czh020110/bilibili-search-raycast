const https = require("https");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({});
          }
        });
      },
    );
  });
}

async function run() {
  const bvid = "BV1uT4y1P7CX";
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  const data = await fetchUrl(viewUrl);
  if (data.code === 0 && data.data) {
    console.log("Keys:", Object.keys(data.data));
    console.log("tname:", data.data.tname);
    console.log("typename:", data.data.typename); // Some APIs use this
    console.log("label:", data.data.label);
  }
}
run();
