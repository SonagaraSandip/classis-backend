// utils/browser.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

let browserInstance = null;

export async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  const isRender = process.env.RENDER === "true" || process.env.NODE_ENV === "production";

  console.log("🧠 Browser launcher - Render mode:", isRender);

  if (isRender) {
    // Render / Linux Production Mode
    const executablePath = await chromium.executablePath();
    browserInstance = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
  } else {
    // Local Windows / Development Mode
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.CHROME_PATH ||
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  return browserInstance;
}
