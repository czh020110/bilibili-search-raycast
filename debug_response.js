const https = require("https");

function fetchUrl(url, cookie = "") {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Cookie: cookie,
      },
    };
    https
      .get(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            console.log("Parse Error for url: " + url + " Data: " + data);
            resolve({});
          }
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// Helper to get cookie - in a real script we'd read it from the file system or env,
// here I'll assume I can just run this if I had the cookie.
// Since I can't interactively get the cookie here, I will try to rely on the fact that
// `getHistory` requires auth.
// Wait, I can't run `getHistory` easily without the cookie file which `auth.ts` manages.
// I will try to read the auth cache file if I can, OR just blindly assume I need to improve the mapping
// by looking at the documentation or common knowledge, BUT the screenshot shows the user is logged in.
// actually, I can just modify `bilibili-api.ts` to log specific parts of the answer to console.error
// and then look at the output of the development server! That is easier and more reliable.

console.log(
  "Please ignore this script execution, I will use console.log in the main app to debug.",
);
