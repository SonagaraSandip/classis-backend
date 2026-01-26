import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

let browserInstance = null;

export async function getBrowser() {
  if (browserInstance) return browserInstance;

  browserInstance = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  return browserInstance;
}
