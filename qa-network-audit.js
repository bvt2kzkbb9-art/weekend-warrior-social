const puppeteer = require('puppeteer');

async function networkAudit() {
  console.log('\n🌐 NETWORK REQUEST AUDIT:\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const requests = [];
  const failures = [];

  page.on('request', req => {
    requests.push({
      url: req.url(),
      resourceType: req.resourceType()
    });
  });

  page.on('requestfailed', req => {
    failures.push({
      url: req.url(),
      failure: req.failure().errorText
    });
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`);
    }
  });

  try {
    await page.goto('http://localhost:5500/login.html', {
      waitUntil: 'load',
      timeout: 15000
    });

    // Count request types
    const types = {};
    requests.forEach(req => {
      types[req.resourceType] = (types[req.resourceType] || 0) + 1;
    });

    console.log('Request Summary:');
    Object.entries(types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log(`\nTotal Requests: ${requests.length}`);
    console.log(`Failed Requests: ${failures.length}\n`);

    if (failures.length > 0) {
      console.log('Failed Requests:');
      failures.forEach(fail => {
        if (!fail.url.includes('fonts') && !fail.url.includes('favicon')) {
          console.log(`  ${fail.failure}: ${new URL(fail.url).pathname}`);
        }
      });
    }

  } catch (error) {
    console.log(`Navigation Error: ${error.message}`);
  }

  await browser.close();
}

networkAudit();
