const puppeteer = require('puppeteer');

async function auditConsole() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      PHASE 3: BROWSER CONSOLE AUDIT                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pages = [
    { name: 'Login', url: '/login.html' },
    { name: 'Index', url: '/index.html' },
    { name: 'Feed', url: '/feed.html' },
    { name: 'Profile', url: '/profile.html' },
    { name: 'Challenges', url: '/challenges.html' },
    { name: 'Ranking', url: '/ranking.html' },
    { name: 'Messenger', url: '/messenger.html' }
  ];

  const results = {
    errors: [],
    warnings: [],
    pages: {}
  };

  for (const pageInfo of pages) {
    const page = await browser.newPage();
    const pageErrors = [];
    const pageWarnings = [];

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      // Ignore Firebase initialization logs
      if (text.includes('Firebase') || text.includes('User logged out') || text.includes('User authenticated')) {
        return;
      }

      if (type === 'error') {
        pageErrors.push(text);
      } else if (type === 'warning' && !text.includes('deprecated')) {
        pageWarnings.push(text);
      }
    });

    page.on('error', err => {
      pageErrors.push(`PAGE ERROR: ${err.message}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        pageErrors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    try {
      await page.goto(`http://localhost:5500${pageInfo.url}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      await new Promise(r => setTimeout(r, 2000));

      results.pages[pageInfo.name] = {
        errors: pageErrors,
        warnings: pageWarnings,
        status: 'OK'
      };
    } catch (error) {
      results.pages[pageInfo.name] = {
        errors: [error.message],
        warnings: [],
        status: 'FAILED'
      };
    }

    await page.close();
  }

  // Print results
  console.log('📄 PAGES AUDITED:\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  Object.entries(results.pages).forEach(([name, data]) => {
    const errorIcon = data.errors.length === 0 ? '✅' : '❌';
    console.log(`${errorIcon} ${name}`);

    if (data.errors.length > 0) {
      data.errors.forEach(err => {
        console.log(`   ERROR: ${err}`);
        totalErrors++;
      });
    }

    if (data.warnings.length > 0) {
      data.warnings.forEach(warn => {
        console.log(`   WARNING: ${warn}`);
        totalWarnings++;
      });
    }

    if (data.errors.length === 0 && data.warnings.length === 0) {
      console.log('   Status: Console clean');
    }
    console.log('');
  });

  console.log('═════════════════════════════════════════════════════\n');
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}\n`);

  if (totalErrors === 0) {
    console.log('✅ CONSOLE AUDIT: PASS\n');
  } else {
    console.log('❌ CONSOLE AUDIT: FAIL\n');
  }

  await browser.close();
}

auditConsole().catch(console.error);
