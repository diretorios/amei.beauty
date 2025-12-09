#!/usr/bin/env node
/**
 * Diagnostic script to check VITE_API_URL configuration
 * Run this script to verify your API URL is configured correctly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Checking VITE_API_URL configuration...\n');

// Check 1: GitHub Actions workflow
console.log('1. Checking GitHub Actions workflow (.github/workflows/deploy.yml)');
try {
  const workflowContent = readFileSync(
    join(rootDir, '.github/workflows/deploy.yml'),
    'utf-8'
  );
  
  if (workflowContent.includes('VITE_API_URL')) {
    console.log('   ✅ Workflow references VITE_API_URL');
    
    // Check if it's using secrets
    if (workflowContent.includes('secrets.VITE_API_URL')) {
      console.log('   ✅ Uses GitHub Actions secrets');
    } else {
      console.log('   ⚠️  Not using GitHub Actions secrets');
    }
  } else {
    console.log('   ❌ Workflow does not reference VITE_API_URL');
  }
} catch (error) {
  console.log('   ⚠️  Could not read workflow file:', error.message);
}

// Check 2: Source code usage
console.log('\n2. Checking source code (src/lib/api.ts)');
try {
  const apiContent = readFileSync(join(rootDir, 'src/lib/api.ts'), 'utf-8');
  
  if (apiContent.includes('VITE_API_URL')) {
    console.log('   ✅ Code uses VITE_API_URL');
    
    if (apiContent.includes('import.meta.env.VITE_API_URL')) {
      console.log('   ✅ Uses import.meta.env.VITE_API_URL');
    }
    
    if (apiContent.includes('localhost')) {
      console.log('   ⚠️  Has localhost fallback (expected for development)');
    }
  } else {
    console.log('   ❌ Code does not use VITE_API_URL');
  }
} catch (error) {
  console.log('   ⚠️  Could not read API file:', error.message);
}

// Check 3: Environment variable in current shell
console.log('\n3. Checking current environment');
const envApiUrl = process.env.VITE_API_URL;
if (envApiUrl) {
  console.log('   ✅ VITE_API_URL is set in current environment');
  console.log(`   Value: ${envApiUrl}`);
  
  if (envApiUrl.includes('localhost')) {
    console.log('   ⚠️  WARNING: Using localhost URL (not suitable for production)');
  } else if (envApiUrl.includes('workers.dev') || envApiUrl.includes('amei.beauty')) {
    console.log('   ✅ Looks like a production URL');
  }
} else {
  console.log('   ⚠️  VITE_API_URL not set in current environment');
  console.log('   (This is OK for local development, but required for production builds)');
}

// Check 4: Build output (if exists)
console.log('\n4. Checking build output (dist/)');
try {
  readFileSync(join(rootDir, 'dist/index.html'), 'utf-8');
  console.log('   ✅ Build output exists');
  
  // Try to find API URL in built files
  // Note: Vite embeds env vars, so we'd need to check JS files
  console.log('   ℹ️  To check embedded API URL, inspect dist/assets/*.js files');
} catch (_error) {
  console.log('   ⚠️  No build output found (run npm run build first)');
}

// Summary and recommendations
console.log('\n📋 Summary and Recommendations:\n');

console.log('For PRODUCTION deployment:');
console.log('1. Set VITE_API_URL in GitHub Actions secrets:');
console.log('   - Go to: GitHub repo → Settings → Secrets and variables → Actions');
console.log('   - Add secret: VITE_API_URL');
console.log('   - Value: https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api');
console.log('');
console.log('2. Verify the secret is set:');
console.log('   - Check GitHub Actions workflow runs');
console.log('   - Look for "Verify VITE_API_URL secret" step');
console.log('');
console.log('3. After deployment, check browser console:');
console.log('   - Open production site');
console.log('   - Open DevTools → Console');
console.log('   - Look for "[API Config]" messages');
console.log('   - Verify API_BASE_URL is not localhost');
console.log('');
console.log('⚠️  IMPORTANT: Vite environment variables are embedded at BUILD time.');
console.log('   Setting VITE_API_URL in Cloudflare Pages dashboard will NOT work.');
console.log('   It MUST be set in GitHub Actions secrets before building.');

