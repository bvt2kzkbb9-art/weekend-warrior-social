#!/usr/bin/env node
/**
 * Firebase Auth Setup Script
 * Configures Authorized Domains and Authentication Settings
 */

const http = require('http');
const https = require('https');

const PROJECT_ID = 'weekend-warrior-social-ed3d0';
const API_KEY = 'AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98';

const AUTHORIZED_DOMAINS = [
  'weekend-warrior-social-ed3d0.web.app',
  'weekend-warrior-social-ed3d0.firebaseapp.com',
  'bvt2kzkbb9-art.github.io',
  'localhost',
];

console.log('[Firebase Auth Setup] Starting configuration...');
console.log('[Firebase Auth Setup] Project ID:', PROJECT_ID);
console.log('[Firebase Auth Setup] Authorized domains to add:', AUTHORIZED_DOMAINS);

/**
 * Test Firebase Auth Endpoint
 * This verifies that the authorized domains are properly configured
 */
function testFirebaseAuth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.googleapis.com',
      path: `/identitytoolkit/v3/relyingparty/getProjectConfig?key=${API_KEY}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('\n[Firebase Auth Setup] Current Firebase Config:');
          console.log('[Firebase Auth Setup] Project:', parsed.projectId || 'N/A');
          console.log('[Firebase Auth Setup] Auth Providers:', parsed.signInProviders || []);

          if (parsed.authorizedDomains) {
            console.log('[Firebase Auth Setup] Currently Authorized Domains:');
            parsed.authorizedDomains.forEach(domain => {
              console.log('  ✓', domain);
            });
          }

          resolve(parsed);
        } catch (e) {
          console.error('[Firebase Auth Setup] Error parsing response:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Verify that all required domains are authorized
 */
async function verifyDomains() {
  try {
    const config = await testFirebaseAuth();
    const authorizedDomains = config.authorizedDomains || [];

    console.log('\n[Firebase Auth Setup] Checking domain authorization:');

    let allAuthorized = true;
    AUTHORIZED_DOMAINS.forEach(domain => {
      const isAuthorized = authorizedDomains.includes(domain);
      const status = isAuthorized ? '✓' : '✗';
      console.log(`  ${status} ${domain}`);
      if (!isAuthorized) allAuthorized = false;
    });

    if (!allAuthorized) {
      console.log('\n[Firebase Auth Setup] ⚠️  Some domains are NOT authorized.');
      console.log('[Firebase Auth Setup] Please add them in Firebase Console:');
      console.log('[Firebase Auth Setup] 1. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/settings');
      console.log('[Firebase Auth Setup] 2. Scroll to "Authorized domains"');
      console.log('[Firebase Auth Setup] 3. Click "Add domain" and add:');
      AUTHORIZED_DOMAINS.forEach(domain => {
        if (!authorizedDomains.includes(domain)) {
          console.log(`       - ${domain}`);
        }
      });
      console.log('[Firebase Auth Setup] 4. Wait 2-5 minutes for propagation');
      console.log('[Firebase Auth Setup] 5. Clear browser cache (Ctrl+Shift+Delete)');
      console.log('[Firebase Auth Setup] 6. Refresh the app and try again');
      process.exit(1);
    } else {
      console.log('\n[Firebase Auth Setup] ✅ All domains are authorized!');
      console.log('[Firebase Auth Setup] If auth errors persist:');
      console.log('  1. Clear browser cache (Ctrl+Shift+Delete)');
      console.log('  2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('  3. Wait 5 minutes for DNS propagation');
      process.exit(0);
    }
  } catch (error) {
    console.error('[Firebase Auth Setup] Error:', error.message);
    console.log('\n[Firebase Auth Setup] Manual Fix Required:');
    console.log('[Firebase Auth Setup] 1. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/settings');
    console.log('[Firebase Auth Setup] 2. Add these domains to "Authorized domains":');
    AUTHORIZED_DOMAINS.forEach(domain => console.log(`       - ${domain}`));
    process.exit(1);
  }
}

// Run verification
verifyDomains().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
