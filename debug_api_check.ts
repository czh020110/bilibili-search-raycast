import {
  getHistory,
  getFavorites,
  getVideoDetails,
  searchBilibili,
} from "./src/utils/bilibili-api";
import fetch from "node-fetch";

// Mock helper if needed or just use the updated file if it exports properly.
// Since I can't easily import from the source due to it being a module in a different env,
// I will copy the relevant fetch logic or try to run ts-node on a new file importing the existing one IF it's cleaner.
// But `src/utils/bilibili-api.ts` imports `getCookie` from `./auth`.

// Let's try to just use a standalone script that duplicates the fetch logic slightly or imports if possible.
// I'll try to import first. If it fails, I'll inline the fetch.

async function run() {
  console.log("--- Debugging Video Details (Tags) ---");
  // Use a known BVID (e.g., from the screenshot or a popular one)
  // Screenshot shows "BV1..."
  const bvid = "BV1uT4y1P7CX"; // Example BVID
  const details = await getVideoDetails(bvid);
  console.log("Details for " + bvid + ":", JSON.stringify(details, null, 2));

  console.log("\n--- Debugging History (Play Count) ---");
  const history = await getHistory();
  if (history.list.length > 0) {
    console.log(
      "First History Item:",
      JSON.stringify(history.list[0], null, 2),
    );
    console.log(
      "Raw History Item (needs inspection of raw response in api.ts equivalent):",
    );
    // To see raw response I might need to modify api.ts or use inline fetch here.
    // I'll rely on the output of getHistory first.
    // If 'play' is 0, I know it's not being mapped.
  }

  console.log("\n--- Debugging Favorites (Play Count) ---");
  const favs = await getFavorites(1);
  if (favs.length > 0) {
    console.log("First Favorite Item:", JSON.stringify(favs[0], null, 2));
  }
}

run();
