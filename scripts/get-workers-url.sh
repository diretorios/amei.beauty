#!/bin/bash
# Script to get Workers API URL for production configuration

echo "🔍 Finding your Workers API URL..."
echo ""

# Try to get URL from wrangler
echo "Checking Workers deployments..."
WORKERS_URL=$(npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api 2>/dev/null | grep -o 'https://[^[:space:]]*workers\.dev' | head -1)

if [ -z "$WORKERS_URL" ]; then
    echo "⚠️  Could not automatically detect Workers URL."
    echo ""
    echo "Please get it manually:"
    echo "1. Go to: Cloudflare Dashboard → Workers & Pages → amei-beauty-api"
    echo "2. Look at the 'Overview' tab"
    echo "3. Find the URL (format: https://amei-beauty-api.xxx.workers.dev)"
    echo ""
    echo "Or run manually:"
    echo "  npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api"
    echo ""
    read -p "Enter your Workers URL (without /api): " WORKERS_URL
fi

# Remove trailing slash if present
WORKERS_URL="${WORKERS_URL%/}"

# Construct API URL
API_URL="${WORKERS_URL}/api"

echo ""
echo "✅ Your API URL is:"
echo "   $API_URL"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Copy this URL: $API_URL"
echo ""
echo "2. Go to GitHub → Settings → Secrets and variables → Actions"
echo ""
echo "3. Click 'New repository secret'"
echo "   Name: VITE_API_URL"
echo "   Value: $API_URL"
echo ""
echo "4. Click 'Add secret'"
echo ""
echo "5. Trigger a new deployment:"
echo "   git commit --allow-empty -m 'Fix: Set VITE_API_URL for production'"
echo "   git push origin main"
echo ""
echo "6. Wait for deployment (2-5 minutes), then test in production"
echo ""

