const puppeteer = require('puppeteer');

async function debugErrors() {
  console.log('\n🔍 DEBUGGING PAGE ERRORS:\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  let allMessages = [];

  // Capture ALL console messages
  page.on('console', msg => {
    allMessages.push({type: msg.type(), text: msg.text()});
  });

  // Capture page crashes and errors
  page.on('error', err => {
    console.log(`[PAGE CRASH] ${err}`);
  });

  try {
    await page.goto('http://localhost:5500/index.html', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    await new Promise(r => setTimeout(r, 3000));

    console.log('All console messages:');
    allMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });

    console.log('\n--- Checking page source ---');
    const html = await page.content();
    if (html.includes('[INDEX]')) {
      console.log('✓ [INDEX] logs are in the HTML');
    } else {
      console.log('✗ [INDEX] logs NOT found in HTML - script may not be executing');
    }

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  await browser.close();
}

debugErrors().catch(console.error);
