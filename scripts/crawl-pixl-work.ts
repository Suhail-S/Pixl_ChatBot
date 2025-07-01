import * as fs from "fs";
import { chromium } from "playwright";

const WORK_URLS = [
  "https://www.pixl.ae/work/eywa",
  "https://www.pixl.ae/work/jw-marriott-residences-al-marjan-island",
  "https://www.pixl.ae/work/franck-muller-aeternitas",
  "https://www.pixl.ae/work/swank-development",
  "https://www.pixl.ae/work/wadi-villas",
  "https://www.pixl.ae/work/citi-developers",
  "https://www.pixl.ae/work/celebrate-serenity",
  "https://www.pixl.ae/work/the-allure-of-azure",
  "https://www.pixl.ae/work/live-connected",
  "https://www.pixl.ae/work/london_gate",
  "https://www.pixl.ae/work/experience-meets-ambition",
  "https://www.pixl.ae/work/fairmont-residences",
  "https://www.pixl.ae/work/citi-developers-first-residential-project-in-dubai",
  "https://www.pixl.ae/work/nadine",
  "https://www.pixl.ae/work/live-with-delight",
];

async function scrapePixlWork() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const results: {
    url: string;
    title: string;
    summary: string;
    featuredImage: string;
    results: string[];
    tags: string[];
  }[] = [];

  for (const url of WORK_URLS) {
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait a bit more in case of slow JS rendering
    await page.waitForTimeout(4000);

    // Try to get any significant visible text node as title, if no h1/h2 exists
    const workInfo = await page.evaluate(() => {
      // Get title from h1/h2, fallback to longest visible text in a heading-like tag
      let title =
        document.querySelector("h1, h2, .project-title, .case-title")?.textContent?.trim() || "";
      if (!title) {
        // try other candidates: strong, b, first main div
        const alts = Array.from(document.querySelectorAll("strong, b, .case-study-title, [class*=title], [class*=heading]"));
        let maxLen = 0;
        for (const el of alts) {
          const txt = (el as HTMLElement).innerText.trim();
          if (txt.length > maxLen) {
            title = txt;
            maxLen = txt.length;
          }
        }
      }
      // Summary: as before
      let summary = "";
      const ps = Array.from(document.querySelectorAll("main p, .content p, .project-description p, p"));
      for (const p of ps) {
        const txt = (p as HTMLElement).innerText.trim();
        if (txt.length > 30) {
          summary = txt;
          break;
        }
      }
      let featuredImage = "";
      Array.from(document.querySelectorAll("img")).forEach((img) => {
        const src = (img as HTMLImageElement).src || "";
        if (
          src &&
          !src.includes("/Logo.png") &&
          (img as HTMLImageElement).naturalHeight > 30 &&
          !featuredImage
        ) {
          featuredImage = src;
        }
      });
      const results: string[] = [];
      document.querySelectorAll("main ul li, .content ul li, .project-description ul li, ul li").forEach((li) => {
        const txt = (li as HTMLElement).innerText.trim();
        if (txt.length > 0) results.push(txt);
      });
      const tags: string[] = [];
      document.querySelectorAll(".tags, .tag, .hashtags, .project-tags, .work-category").forEach((cont) => {
        cont.querySelectorAll("span, a").forEach((el) => {
          const txt = el.textContent?.replace(/^[#]+/, "").trim();
          if (txt) tags.push(txt);
        });
      });
      return {
        title,
        summary,
        featuredImage,
        results,
        tags,
      };
    });

    results.push({
      url,
      ...workInfo,
    });

    console.log(`[DONE] ${url}: ${workInfo.title}`);
  }

  await browser.close();

  fs.mkdirSync("src/data", { recursive: true });
  fs.writeFileSync(
    "src/data/pixlWork.json",
    JSON.stringify(results, null, 2),
    "utf-8"
  );
  console.log("Pixl work data written to src/data/pixlWork.json");
}

scrapePixlWork().catch((err) => {
  console.error("Scraping failed:", err);
  process.exit(1);
});