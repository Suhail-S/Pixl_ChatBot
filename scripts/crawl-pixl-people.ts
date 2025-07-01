import * as fs from "fs";
import { chromium } from "playwright";

async function scrapePixlPeople() {
  const BASE_URL = "https://www.pixl.ae/people";
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Expand all accordion sections by clicking their group buttons
  const buttonHandles = await page.$$('button[id]');
  for (const btn of buttonHandles) {
    await btn.click();
    await page.waitForTimeout(300); // Animation/JS delay
  }

  // Wait for at least one .Card to appear visibly (should now be loaded)
  await page.waitForSelector(".Card", { timeout: 20000 });

  const groups = await page.evaluate(() => {
    const result: {
      group: string;
      members: { name: string; role: string; image: string }[];
    }[] = [];
    document.querySelectorAll(".accordion").forEach((acc) => {
      const groupBtn = acc.querySelector('button[id]');
      if (!groupBtn) return;
      const groupTitle = groupBtn.textContent?.replace(/\s+/g, " ").trim() || "";
      const members: { name: string; role: string; image: string }[] = [];
      acc.querySelectorAll('.grid .Card').forEach((card) => {
        let name = "";
        card.querySelectorAll('div.text-white').forEach(div => {
          if (!(div as HTMLElement).classList.contains('font-medium')) {
            name = (div as HTMLElement).innerText.trim();
          }
        });
        let role = "";
        const roleElem = card.querySelector('p.text-white.font-medium');
        if (roleElem) role = (roleElem as HTMLElement).innerText.trim();
        const img = card.querySelector('img');
        const image = img ? (img as HTMLImageElement).src : "";
        if (name && role && image) members.push({ name, role, image });
      });
      result.push({
        group: groupTitle,
        members,
      });
    });
    return result;
  });

  await browser.close();

  fs.mkdirSync("src/data", { recursive: true });
  fs.writeFileSync(
    "src/data/pixlTeam.json",
    JSON.stringify(groups, null, 2),
    "utf-8"
  );
  console.log("Pixl people data written to src/data/pixlTeam.json");
}

scrapePixlPeople().catch((err) => {
  console.error("Scraping failed:", err);
  process.exit(1);
});