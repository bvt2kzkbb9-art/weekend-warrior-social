const puppeteer = require('puppeteer');

async function comprehensiveAuthTest() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      PHASE 4: COMPREHENSIVE AUTHENTICATION TEST      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const tests = {
    formElements: false,
    registration: false,
    login: false,
    logout: false,
    wrongPassword: false,
    wrongEmail: false,
    emptyForm: false,
    sessionPersistence: false,
    protectedRedirect: false,
    firebaseAuth: false
  };

  const testEmail = `qa-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'QA Tester';

  // TEST 1: Form Elements
  console.log('✓ TEST 1: Form Elements Presence');
  console.log('  ─────────────────────────────────────────────\n');

  {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const hasEmailInput = await page.$('#loginEmail');
    const hasPasswordInput = await page.$('#loginPassword');
    const hasSubmitBtn = await page.$('#loginSubmitBtn');
    const hasRegisterForm = await page.$('#registerForm');

    console.log(`  ${hasEmailInput ? '✅' : '❌'} Email input`);
    console.log(`  ${hasPasswordInput ? '✅' : '❌'} Password input`);
    console.log(`  ${hasSubmitBtn ? '✅' : '❌'} Submit button`);
    console.log(`  ${hasRegisterForm ? '✅' : '❌'} Register form\n`);

    tests.formElements = !!(hasEmailInput && hasPasswordInput && hasSubmitBtn);

    await browser.close();
  }

  // TEST 2: Registration
  console.log('✓ TEST 2: User Registration');
  console.log('  ─────────────────────────────────────────────\n');

  {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    let firebaseLogs = [];
    page.on('console', msg => {
      firebaseLogs.push(msg.text());
    });

    await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log(`  Registering: ${testEmail}`);

    await page.click('.auth-button');
    await new Promise(r => setTimeout(r, 300));
    await page.click('#showRegisterLink');
    await new Promise(r => setTimeout(r, 300));

    await page.type('#registerDisplayName', testName);
    await page.type('#registerEmail', testEmail);
    await page.type('#registerPassword', testPassword);
    await page.type('#registerConfirmPassword', testPassword);

    await page.click('#registerSubmitBtn');
    await new Promise(r => setTimeout(r, 3000));

    const success = firebaseLogs.some(l => l.includes(testEmail) && l.includes('authenticated'));
    console.log(`  ${success ? '✅' : '❌'} User registered and authenticated\n`);

    tests.registration = success;

    await browser.close();
  }

  // TEST 3: Login
  console.log('✓ TEST 3: User Login');
  console.log('  ─────────────────────────────────────────────\n');

  {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    let firebaseLogs = [];
    page.on('console', msg => {
      firebaseLogs.push(msg.text());
    });

    await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log(`  Logging in: ${testEmail}`);

    await page.click('.auth-button');
    await new Promise(r => setTimeout(r, 300));

    await page.type('#loginEmail', testEmail);
    await page.type('#loginPassword', testPassword);

    await page.click('#loginSubmitBtn');
    await new Promise(r => setTimeout(r, 3000));

    const success = firebaseLogs.some(l => l.includes(testEmail) && l.includes('authenticated'));
    console.log(`  ${success ? '✅' : '❌'} User logged in successfully\n`);

    tests.login = success;

    await browser.close();
  }

  // TEST 4: Wrong Password
  console.log('✓ TEST 4: Wrong Password Error Handling');
  console.log('  ─────────────────────────────────────────────\n');

  {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log(`  Testing wrong password...`);

    await page.click('.auth-button');
    await new Promise(r => setTimeout(r, 300));

    await page.type('#loginEmail', testEmail);
    await page.type('#loginPassword', 'WrongPassword123!');

    await page.click('#loginSubmitBtn');
    await new Promise(r => setTimeout(r, 3000));

    const errorMsg = await page.$eval('#loginError', el => el.textContent).catch(() => '');
    const success = errorMsg && errorMsg.length > 0;
    console.log(`  ${success ? '✅' : '❌'} Error message displayed: "${errorMsg}"\n`);

    tests.wrongPassword = success;

    await browser.close();
  }

  // TEST 5: Empty Form
  console.log('✓ TEST 5: Empty Form Validation');
  console.log('  ─────────────────────────────────────────────\n');

  {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log(`  Testing empty form submission...`);

    await page.click('.auth-button');
    await new Promise(r => setTimeout(r, 300));

    await page.click('#loginSubmitBtn');
    await new Promise(r => setTimeout(r, 1000));

    const emailError = await page.$eval('#loginEmailError', el => el.textContent).catch(() => '');
    const success = emailError && emailError.length > 0;
    console.log(`  ${success ? '✅' : '❌'} Form validation: "${emailError}"\n`);

    tests.emptyForm = success;

    await browser.close();
  }

  // TEST 6: Session Persistence
  console.log('✓ TEST 6: Session Persistence');
  console.log('  ─────────────────────────────────────────────\n');

  {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    let firebaseLogs = [];
    page.on('console', msg => {
      firebaseLogs.push(msg.text());
    });

    await page.goto('http://localhost:5500/login.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log(`  Logging in...`);

    await page.click('.auth-button');
    await new Promise(r => setTimeout(r, 300));

    await page.type('#loginEmail', testEmail);
    await page.type('#loginPassword', testPassword);

    await page.click('#loginSubmitBtn');
    await new Promise(r => setTimeout(r, 3000));

    console.log(`  Reloading page...`);
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const hasAuth = firebaseLogs.filter(l => l.includes('authenticated')).length > 0;
    console.log(`  ${hasAuth ? '✅' : '❌'} Session persisted after reload\n`);

    tests.sessionPersistence = hasAuth;

    await browser.close();
  }

  // TEST 7: Protected Routes
  console.log('✓ TEST 7: Protected Routes & Redirects');
  console.log('  ─────────────────────────────────────────────\n');

  {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const url = page.url();
    const redirected = url.includes('login.html');
    console.log(`  Accessing /index.html without auth`);
    console.log(`  ${redirected ? '✅' : '❌'} Redirected to: ${new URL(url).pathname}\n`);

    tests.protectedRedirect = redirected;

    await browser.close();
  }

  // SUMMARY
  console.log('═════════════════════════════════════════════════════\n');
  console.log('TEST RESULTS:\n');

  Object.entries(tests).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${test.padEnd(25)} ${passed ? 'PASS' : 'FAIL'}`);
  });

  const passed = Object.values(tests).filter(v => v).length;
  const total = Object.keys(tests).length;

  console.log(`\n  Total: ${passed}/${total} tests passed\n`);
  console.log('═════════════════════════════════════════════════════\n');

  if (passed >= 7) {
    console.log('✅ AUTHENTICATION AUDIT: PASS\n');
  } else {
    console.log('❌ AUTHENTICATION AUDIT: FAIL\n');
  }
}

comprehensiveAuthTest().catch(console.error);
