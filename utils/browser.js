// utils/browser.js
import puppeteer from "puppeteer-core";

let browserInstance = null;

export async function getBrowser() {
  if (browserInstance) return browserInstance;

  const isRender = process.env.RENDER === "true";

  console.log("🧠 Using Render mode:", isRender);

  if (isRender) {
    // ❌ SHOULD NEVER RUN ON WINDOWS
    throw new Error("Render mode detected on localhost ❌");
  }

  browserInstance = await puppeteer.launch({
    headless: "new",
    executablePath:
      process.env.CHROME_PATH ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browserInstance;
}
