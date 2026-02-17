// import fetch from "node-fetch"; // Use native fetch
import fs from "fs";

(async () => {
  const bvid = "BV1P1g3zmEQ8";
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.bilibili.com/",
      },
    });
    const json = await response.json();
    fs.writeFileSync("view_api_response.json", JSON.stringify(json, null, 2));
    console.log("Response written to view_api_response.json");
    if (json.data && json.data.stat) {
      console.log("Stats found:", json.data.stat);
    } else {
      console.log("Stats not found in standard location.");
    }
  } catch (error) {
    console.error(error);
  }
})();
