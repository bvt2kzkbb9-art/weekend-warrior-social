#!/usr/bin/env node

/**
 * Screenshot Generator for Visual Audit
 * Generates mobile screenshots (390x844) for each page
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8000';
const PAGES = [
  { url: '/index.html', name: 'arena' },
  { url: '/feed.html', name: 'kroniki' },
  { url: '/challenges.html', name: 'misje' },
  { url: '/ranking.html', name: 'chwa ła' },
  { url: '/profile.html', name: 'bohater' },
  { url: '/messages.html', name: 'wiadomosci' },
  { url: '/quizzes.html', name: 'quizy' },
  { url: '/achievements.html', name: 'osiagniecia' }
];

const VIEWPORT = {
  width: 390,
  height: 844
};

async function renderPage(url, pageName) {
  console.log(`\n📸 Rendering ${pageName}... ${url}`);

  try {
    // Try using Puppeteer if available
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle2' });

    const screenshotPath = `./screenshots/${pageName}-390x844.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browser.close();

    console.log(`✅ Screenshot saved: ${screenshotPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error rendering ${pageName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🎬 Weekend Warrior Social - Screenshot Generator');
  console.log(`📱 Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);

  // Create screenshots directory
  if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots', { recursive: true });
  }

  // Render each page
  let successCount = 0;
  for (const page of PAGES) {
    const success = await renderPage(page.url, page.name);
    if (success) successCount++;
  }

  console.log(`\n📊 Summary: ${successCount}/${PAGES.length} screenshots generated`);

  if (successCount === PAGES.length) {
    console.log('✅ All screenshots generated successfully!');
    process.exit(0);
  } else {
    console.error('⚠️ Some screenshots failed to generate');
    process.exit(1);
  }
}

main();
