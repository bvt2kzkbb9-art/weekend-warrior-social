#!/usr/bin/env node

/**
 * Setup Script for Weekend Warrior Social
 *
 * Initializes the project and verifies all configurations are correct.
 * Run: node scripts/setup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}━━━ ${title} ━━━${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    log('green', '✓', `${description}`);
    return true;
  } else {
    log('red', '✗', `Missing: ${description} (${filePath})`);
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.join(projectRoot, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    log('green', '✓', `${description}`);
    return true;
  } else {
    log('red', '✗', `Missing directory: ${description}`);
    return false;
  }
}

function checkEnvFile() {
  const envLocalPath = path.join(projectRoot, '.env.local');
  const envExamplePath = path.join(projectRoot, '.env.example');

  if (!fs.existsSync(envLocalPath)) {
    log('yellow', '⚠', '.env.local not found - creating from .env.example');

    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');
      fs.writeFileSync(envLocalPath, envContent);
      log('green', '✓', 'Created .env.local - please fill in Cloudinary credentials');
      return false; // Still needs configuration
    } else {
      log('red', '✗', 'Neither .env.local nor .env.example found');
      return false;
    }
  }

  // Check if environment variables are filled
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const hasCloudinaryConfig =
    envContent.includes('VITE_CLOUDINARY_CLOUD_NAME=') &&
    !envContent.match(/VITE_CLOUDINARY_CLOUD_NAME=\s*$/m);

  if (!hasCloudinaryConfig) {
    log('yellow', '⚠', 'Cloudinary configuration is empty - configure for media uploads');
    return false;
  } else {
    log('green', '✓', '.env.local is configured');
    return true;
  }
}

function checkNpmPackages() {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    const requiredDeps = ['firebase'];
    const missingDeps = requiredDeps.filter(
      (dep) => !packageJson.dependencies || !packageJson.dependencies[dep]
    );

    if (missingDeps.length === 0) {
      log('green', '✓', 'All required packages in package.json');
      return true;
    } else {
      log('red', '✗', `Missing packages: ${missingDeps.join(', ')}`);
      return false;
    }
  }
  return false;
}

function checkNodeModules() {
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    log('green', '✓', 'node_modules installed');
    return true;
  } else {
    log('yellow', '⚠', 'node_modules not found - run "npm install"');
    return false;
  }
}

function main() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  Weekend Warrior Social - Setup Check  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  const checks = {
    projectStructure: 0,
    configuration: 0,
    dependencies: 0,
  };
  const totals = {
    projectStructure: 0,
    configuration: 0,
    dependencies: 0,
  };

  // Project Structure
  logSection('Project Structure');
  totals.projectStructure += 3;
  if (checkDirectory('src', 'Source directory')) checks.projectStructure++;
  if (checkDirectory('src/services', 'Services directory')) checks.projectStructure++;
  if (checkFile('package.json', 'Package.json')) checks.projectStructure++;

  // Configuration Files
  logSection('Configuration');
  totals.configuration += 5;
  if (checkFile('.env.example', '.env.example template')) checks.configuration++;
  if (checkFile('.gitignore', '.gitignore')) checks.configuration++;
  if (checkFile('vite.config.js', 'Vite configuration')) checks.configuration++;
  if (checkEnvFile()) {
    checks.configuration++;
  }
  if (checkFile('src/lib/firebase.js', 'Firebase initialization')) checks.configuration++;

  // Dependencies
  logSection('Dependencies');
  totals.dependencies += 2;
  if (checkNpmPackages()) checks.dependencies++;
  if (checkNodeModules()) checks.dependencies++;

  // Summary
  logSection('Summary');
  const totalPassed = checks.projectStructure + checks.configuration + checks.dependencies;
  const totalChecks = totals.projectStructure + totals.configuration + totals.dependencies;
  const percentage = Math.round((totalPassed / totalChecks) * 100);

  console.log(`\n${colors.green}✓ Passed: ${totalPassed}/${totalChecks} (${percentage}%)${colors.reset}`);

  if (totalPassed === totalChecks) {
    log('green', '✓', 'All checks passed! Project is ready.');
    console.log(
      `\n${colors.blue}Next steps:${colors.reset}
  1. Configure Cloudinary in .env.local (get credentials from https://cloudinary.com/console)
  2. Run: npm run dev
  3. Open: http://localhost:5500\n`
    );
    process.exit(0);
  } else if (totalPassed >= totalChecks - 2) {
    log('yellow', '⚠', 'Most checks passed. Project should work, but fix warnings above.');
    console.log(`\n${colors.yellow}Recommended actions:${colors.reset}
  1. Fill in .env.local configuration
  2. Run: npm install (if needed)
  3. See QUICKSTART.md for more details\n`);
    process.exit(0);
  } else {
    log('red', '✗', 'Some required items are missing. See errors above.');
    console.log(`\n${colors.red}Action required:${colors.reset}
  1. Run: npm install
  2. Create .env.local with Cloudinary credentials
  3. See QUICKSTART.md for detailed setup\n`);
    process.exit(1);
  }
}

main();
