#!/bin/bash
# Script to check CORS configuration for production

echo "🔍 Checking CORS Configuration..."
echo ""

# Get the production domain (you may need to adjust this)
PROD_DOMAIN="${1:-https://amei.beauty}"
WORKERS_URL="${2:-https://amei-beauty-api.adsventures.workers.dev}"

echo "Production domain: $PROD_DOMAIN"
echo "Workers URL: $WORKERS_URL"
echo ""

# Test CORS preflight
echo "Testing CORS preflight request..."
CORS_RESPONSE=$(curl -s -X OPTIONS "${WORKERS_URL}/api/publish" \
  -H "Origin: ${PROD_DOMAIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1)

echo "$CORS_RESPONSE" | grep -i "access-control"

# Test health endpoint
echo ""
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "${WORKERS_URL}/api/health")
echo "Response: $HEALTH_RESPONSE"

# Check if Workers is accessible
echo ""
echo "Checking Workers accessibility..."
if curl -s -o /dev/null -w "%{http_code}" "${WORKERS_URL}/api/health" | grep -q "200"; then
    echo "✅ Workers is accessible"
else
    echo "❌ Workers is not accessible or returned error"
fi

echo ""
echo "📋 Next steps:"
echo "1. If CORS headers are missing, set ALLOWED_ORIGINS secret:"
echo "   npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production"
echo "   Value: ${PROD_DOMAIN},https://www.amei.beauty"
echo ""
echo "2. Verify Workers is deployed:"
echo "   npx wrangler deployments list --config wrangler.workers.toml --name amei-beauty-api"

