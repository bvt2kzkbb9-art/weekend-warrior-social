const puppeteer = require('puppeteer');

async function debugProtection() {
  console.log('\n🔍 DEBUGGING PAGE PROTECTION:\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture redirects
  let finalUrl = null;
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      finalUrl = frame.url();
      console.log(`\n🔀 REDIRECT: ${finalUrl}\n`);
    }
  });

  console.log('Accessing /index.html (unauthenticated)...\n');

  try {
    await page.goto('http://localhost:5500/index.html', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    console.log(`\nFinal URL: ${page.url()}`);
    console.log(`Expected:  http://localhost:5500/login.html`);
    console.log(`Match:     ${page.url().includes('login.html') ? '✅ YES' : '❌ NO'}\n`);

    // Check if protectPage ran
    const hasProtection = await page.evaluate(() => {
      return typeof protectPage !== 'undefined';
    }).catch(() => false);

    console.log(`protectPage function exists: ${hasProtection ? '✅' : '❌'}\n`);

    // Check auth state
    const authState = await page.evaluate(() => {
      if (typeof authService !== 'undefined') {
        return {
          hasAuth: authService.getCurrentUser() !== null,
          initialized: true
        };
      }
      return {
        hasAuth: false,
        initialized: false
      };
    }).catch(() => ({
      hasAuth: false,
      initialized: false
    }));

    console.log(`AuthService initialized: ${authState.initialized ? '✅' : '❌'}`);
    console.log(`Current user: ${authState.hasAuth ? '✅ Logged in' : '❌ Not logged in'}\n`);

  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }

  await browser.close();
}

debugProtection();
