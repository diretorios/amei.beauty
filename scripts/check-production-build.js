#!/usr/bin/env node
/**
 * Check what API URL is actually embedded in the production build
 * This helps diagnose if VITE_API_URL was applied correctly during build
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function checkBuildFiles() {
  log('\n🔍 Checking Production Build Files\n', 'blue');
  log('='.repeat(60), 'blue');

  const distDir = join(rootDir, 'dist');
  
  if (!existsSync(distDir)) {
    logError('dist/ directory not found!');
    log('Run "npm run build" first to create a build.');
    return;
  }

  // Check index.html
  const indexHtml = join(distDir, 'index.html');
  if (existsSync(indexHtml)) {
    logInfo('\nChecking index.html...');
    const content = readFileSync(indexHtml, 'utf-8');
    
    // Look for API URLs in script tags
    const scriptMatches = content.match(/<script[^>]*src="([^"]+)"[^>]*>/g);
    if (scriptMatches) {
      log(`Found ${scriptMatches.length} script tags`);
    }
  }

  // Check JavaScript files in assets
  const assetsDir = join(distDir, 'assets');
  if (!existsSync(assetsDir)) {
    logError('dist/assets/ directory not found!');
    return;
  }

  const jsFiles = readdirSync(assetsDir)
    .filter(f => f.endsWith('.js'))
    .slice(0, 10); // Check first 10 JS files

  logInfo(`\nChecking ${jsFiles.length} JavaScript files...`);

  let foundLocalhost = false;
  let foundWorkersUrl = false;
  const foundUrls = new Set();

  for (const filename of jsFiles) {
    const filepath = join(assetsDir, filename);
    try {
      const content = readFileSync(filepath, 'utf-8');
      
      // Look for localhost URLs
      if (content.includes('localhost:8787')) {
        foundLocalhost = true;
        logError(`Found localhost URL in: ${filename}`);
      }

      // Look for Workers URLs
      const workersUrlMatch = content.match(/https?:\/\/[^"'\s]+workers\.dev\/api/g);
      if (workersUrlMatch) {
        foundWorkersUrl = true;
        workersUrlMatch.forEach(url => foundUrls.add(url));
      }

      // Look for any API URLs
      const apiUrlMatch = content.match(/https?:\/\/[^"'\s]+(?:workers\.dev|amei\.beauty)\/api/g);
      if (apiUrlMatch) {
        apiUrlMatch.forEach(url => foundUrls.add(url));
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📋 Summary\n', 'blue');

  if (foundLocalhost) {
    logError('❌ Build contains localhost URLs!');
    log('This means VITE_API_URL was not set correctly during build.');
    log('\nFix:');
    log('1. Set VITE_API_URL in GitHub Actions secrets');
    log('2. Value should be: https://amei-beauty-api.adsventures.workers.dev/api');
    log('3. Trigger a new deployment');
  } else {
    logSuccess('✅ No localhost URLs found in build');
  }

  if (foundWorkersUrl) {
    logSuccess('✅ Found Workers API URLs in build:');
    foundUrls.forEach(url => {
      if (url.includes('workers.dev')) {
        log(`   ${url}`, 'green');
      }
    });
  } else {
    logWarning('⚠️  No Workers API URLs found in build');
    log('This might mean VITE_API_URL was not set during build.');
  }

  if (foundUrls.size > 0) {
    log('\n📡 Found API URLs in build:');
    foundUrls.forEach(url => {
      if (url.includes('localhost')) {
        log(`   ❌ ${url}`, 'red');
      } else if (url.includes('workers.dev')) {
        log(`   ✅ ${url}`, 'green');
      } else {
        log(`   ℹ️  ${url}`, 'cyan');
      }
    });
  }

  log('\n');
}

checkBuildFiles();

