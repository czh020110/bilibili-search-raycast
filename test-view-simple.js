const https = require("https");
const fs = require("fs");

const bvid = "BV1P1g3zmEQ8";
const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;

const options = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Referer: "https://www.bilibili.com/",
  },
};

https
  .get(url, options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        fs.writeFileSync(
          "view_api_response_simple.json",
          JSON.stringify(json, null, 2),
        );
        console.log("Response written to view_api_response_simple.json");
        if (json.data && json.data.stat) {
          console.log("Stats found:", JSON.stringify(json.data.stat, null, 2));
        } else {
          console.log("Stats not found or structure different.");
        }
      } catch (e) {
        console.error("Error parsing JSON:", e.message);
        console.log("Raw data:", data);
      }
    });
  })
  .on("error", (err) => {
    console.log("Error: " + err.message);
  });
