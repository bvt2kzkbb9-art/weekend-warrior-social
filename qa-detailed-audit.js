const puppeteer = require('puppeteer');

async function detailedAudit() {
  console.log('\n📍 DETAILED ERROR INVESTIGATION:\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const failedRequests = [];

  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('fonts') && !response.url().includes('favicon')) {
      failedRequests.push({
        status: response.status(),
        url: response.url()
      });
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('CERT') && !msg.text().includes('favicon')) {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:5500/login.html', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log('Failed Requests (excluding fonts and favicon):');
    if (failedRequests.length === 0) {
      console.log('  ✅ None - all critical resources loaded\n');
    } else {
      failedRequests.forEach(req => {
        console.log(`  ❌ ${req.status}: ${req.url}\n`);
      });
    }

    // Check for critical resources
    console.log('Critical Resource Check:');
    const resources = [
      { name: 'AuthService', selector: 'data-testid', test: 'authService' },
      { name: 'Firebase', selector: 'script', test: 'firebase' }
    ];

    // Check if Firebase is loaded
    const firebaseLoaded = await page.evaluate(() => {
      return typeof firebase !== 'undefined';
    }).catch(() => false);
    console.log(`  ${firebaseLoaded ? '✅' : '❌'} Firebase SDK loaded\n`);

    // Check page structure
    console.log('Page Structure:');
    const title = await page.title();
    console.log(`  Title: ${title}`);

    const htmlValid = await page.evaluate(() => {
      return document.documentElement.children.length > 0;
    });
    console.log(`  HTML: ${htmlValid ? '✅ Valid' : '❌ Invalid'}`);

  } catch (error) {
    console.log(`Test Error: ${error.message}\n`);
  }

  await browser.close();
}

detailedAudit();
