const puppeteer = require('puppeteer');

async function debugProtection() {
  console.log('\n🔍 DETAILED DEBUGGING PAGE PROTECTION:\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  // Capture ALL console messages (not filtering by type)
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
    console.log(err.stack);
  });

  // Capture response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  console.log('Navigating to /index.html (unauthenticated)...\n');

  try {
    await page.goto('http://localhost:5500/index.html', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Wait a bit more to let things settle
    await new Promise(r => setTimeout(r, 2000));

    const finalUrl = page.url();
    console.log(`\nFinal URL: ${finalUrl}`);
    console.log(`Expected:  http://localhost:5500/login.html`);
    console.log(`Redirected: ${finalUrl.includes('login.html') ? '✅ YES' : '❌ NO'}\n`);

    // Try to run the protectPage function to see if it's defined
    try {
      const result = await page.evaluate(() => {
        console.log('Evaluating in browser context...');
        return window.location.href;
      });
      console.log(`Browser context URL: ${result}`);
    } catch (e) {
      console.log(`Browser evaluation error: ${e.message}`);
    }

  } catch (error) {
    console.log(`Navigation Error: ${error.message}\n`);
  }

  await browser.close();
}

debugProtection().catch(console.error);
