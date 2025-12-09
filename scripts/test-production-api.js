#!/usr/bin/env node
/**
 * Production API Diagnostic Script
 * Tests API connectivity and configuration
 * 
 * Usage:
 *   node scripts/test-production-api.js [API_URL]
 * 
 * If API_URL is not provided, it will try to detect from:
 * 1. VITE_API_URL environment variable
 * 2. Built files in dist/ directory
 * 3. GitHub Actions secrets (if running in CI)
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for terminal output
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

// Extract API URL from built files
function extractApiUrlFromBuild() {
  try {
    const distDir = join(rootDir, 'dist');
    if (!existsSync(distDir)) {
      return null;
    }

    // Look for JavaScript files in dist/assets
    const assetsDir = join(distDir, 'assets');
    if (!existsSync(assetsDir)) {
      return null;
    }
    
    const files = readdirSync(assetsDir)
      .filter(f => f.endsWith('.js'))
      .slice(0, 5); // Check first 5 files
    
    for (const filename of files) {
      const file = join(assetsDir, filename);
      try {
        const content = readFileSync(file, 'utf-8');
        // Look for common patterns
        const patterns = [
          /https?:\/\/[^"'\s]+workers\.dev\/api/g,
          /https?:\/\/[^"'\s]+\.workers\.dev\/api/g,
          /localhost:8787\/api/g,
        ];
        
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            return matches[0];
          }
        }
      } catch (_err) {
        // Continue to next file
      }
    }
  } catch (_err) {
    // Ignore errors
  }
  
  return null;
}

// Test API endpoint
async function testApiEndpoint(apiUrl) {
  const results = {
    health: null,
    cors: null,
    publish: null,
  };

  log('\n🔍 Testing API Endpoints...\n', 'blue');

  // Test 1: Health endpoint
  try {
    logInfo(`Testing health endpoint: ${apiUrl}/health`);
    const healthResponse = await fetch(`${apiUrl}/health`);
    results.health = {
      status: healthResponse.status,
      ok: healthResponse.ok,
      headers: Object.fromEntries(healthResponse.headers.entries()),
    };
    
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      logSuccess(`Health check passed: ${JSON.stringify(data)}`);
    } else {
      logError(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }
  } catch (error) {
    results.health = { error: error.message };
    logError(`Health check error: ${error.message}`);
  }

  // Test 2: CORS preflight
  try {
    logInfo(`Testing CORS preflight: ${apiUrl}/publish`);
    const corsResponse = await fetch(`${apiUrl}/publish`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://amei.beauty',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    
    results.cors = {
      status: corsResponse.status,
      headers: Object.fromEntries(corsResponse.headers.entries()),
    };
    
    const allowOrigin = corsResponse.headers.get('Access-Control-Allow-Origin');
    const allowMethods = corsResponse.headers.get('Access-Control-Allow-Methods');
    
    if (allowOrigin) {
      if (allowOrigin === '*' || allowOrigin.includes('amei.beauty')) {
        logSuccess(`CORS configured: Allow-Origin=${allowOrigin}, Methods=${allowMethods}`);
      } else {
        logWarning(`CORS may be misconfigured: Allow-Origin=${allowOrigin}`);
      }
    } else {
      logError('CORS headers missing - this will cause browser requests to fail');
    }
  } catch (error) {
    results.cors = { error: error.message };
    logError(`CORS test error: ${error.message}`);
  }

  // Test 3: Publish endpoint (should return 400/401, not network error)
  try {
    logInfo(`Testing publish endpoint: ${apiUrl}/publish`);
    const publishResponse = await fetch(`${apiUrl}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://amei.beauty',
      },
      body: JSON.stringify({}),
    });
    
    results.publish = {
      status: publishResponse.status,
      ok: publishResponse.ok,
      headers: Object.fromEntries(publishResponse.headers.entries()),
    };
    
    // 400/401/422 are expected (validation/auth errors), not network errors
    if (publishResponse.status >= 400 && publishResponse.status < 500) {
      logSuccess(`Publish endpoint reachable (returned ${publishResponse.status} as expected)`);
    } else if (publishResponse.status >= 500) {
      logWarning(`Publish endpoint returned server error: ${publishResponse.status}`);
    } else {
      logWarning(`Unexpected response: ${publishResponse.status}`);
    }
  } catch (error) {
    results.publish = { error: error.message };
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      logError(`Publish endpoint CORS/network error: ${error.message}`);
      logError('This is likely the cause of your production network errors!');
    } else {
      logError(`Publish endpoint error: ${error.message}`);
    }
  }

  return results;
}

// Main function
async function main() {
  log('\n🚀 Production API Diagnostic Tool\n', 'blue');
  log('=' .repeat(60), 'blue');

  // Get API URL from various sources
  let apiUrl = process.argv[2];
  
  if (!apiUrl) {
    // Try environment variable
    apiUrl = process.env.VITE_API_URL;
    if (apiUrl) {
      logInfo(`Found VITE_API_URL in environment: ${apiUrl}`);
    }
  }

  if (!apiUrl) {
    // Try to extract from build files
    logInfo('Attempting to extract API URL from build files...');
    const extractedUrl = extractApiUrlFromBuild();
    if (extractedUrl) {
      apiUrl = extractedUrl;
      logInfo(`Found API URL in build: ${apiUrl}`);
    }
  }

  if (!apiUrl) {
    logError('API URL not found!');
    log('\nPlease provide API URL as argument:');
    log('  node scripts/test-production-api.js https://amei-beauty-api.xxx.workers.dev/api');
    log('\nOr set VITE_API_URL environment variable:');
    log('  VITE_API_URL=https://amei-beauty-api.xxx.workers.dev/api node scripts/test-production-api.js');
    process.exit(1);
  }

  // Validate URL format
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    logError(`Invalid URL format: ${apiUrl}`);
    log('URL must start with http:// or https://');
    process.exit(1);
  }

  // Remove trailing slash
  apiUrl = apiUrl.replace(/\/$/, '');

  // Check for localhost in production
  if (apiUrl.includes('localhost')) {
    logError('⚠️  WARNING: API URL contains localhost!');
    logError('This will NOT work in production.');
    logError('Set VITE_API_URL in GitHub Actions secrets before building.');
  }

  log(`\n📡 Testing API: ${apiUrl}\n`, 'cyan');

  // Run tests
  const results = await testApiEndpoint(apiUrl);

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📋 Summary\n', 'blue');

  if (results.health?.ok) {
    logSuccess('Health endpoint: Working');
  } else if (results.health?.error) {
    logError(`Health endpoint: ${results.health.error}`);
  } else {
    logWarning('Health endpoint: Not tested');
  }

  if (results.cors?.headers?.['access-control-allow-origin']) {
    logSuccess('CORS: Configured');
  } else if (results.cors?.error) {
    logError(`CORS: ${results.cors.error}`);
  } else {
    logWarning('CORS: Not tested');
  }

  if (results.publish?.status) {
    if (results.publish.status >= 400 && results.publish.status < 500) {
      logSuccess('Publish endpoint: Reachable');
    } else {
      logWarning(`Publish endpoint: Returned ${results.publish.status}`);
    }
  } else if (results.publish?.error) {
    logError(`Publish endpoint: ${results.publish.error}`);
  } else {
    logWarning('Publish endpoint: Not tested');
  }

  // Recommendations
  log('\n💡 Recommendations\n', 'blue');

  if (apiUrl.includes('localhost')) {
    logError('1. Set VITE_API_URL in GitHub Actions secrets');
    log('   GitHub repo → Settings → Secrets and variables → Actions');
    log('   Add secret: VITE_API_URL = https://amei-beauty-api.xxx.workers.dev/api');
  }

  if (!results.cors?.headers?.['access-control-allow-origin']) {
    logError('2. Configure CORS in Workers');
    log('   Set ALLOWED_ORIGINS secret in Workers:');
    log('   npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production');
    log('   Value: https://amei.beauty,https://www.amei.beauty');
  }

  if (results.publish?.error?.includes('CORS')) {
    logError('3. CORS is blocking requests - this is likely your issue!');
    log('   Fix: Set ALLOWED_ORIGINS secret in Workers production environment');
  }

  log('\n');
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

