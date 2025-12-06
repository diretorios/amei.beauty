#!/bin/bash
# Verification script for deployed amei.beauty
# Tests all endpoints and functionality

set -e

echo "🔍 Verifying amei.beauty Deployment"
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get URLs from environment or use defaults
WORKERS_URL=${WORKERS_URL:-"http://localhost:8787"}
PAGES_URL=${PAGES_URL:-"http://localhost:3000"}

echo -e "${YELLOW}Workers URL: $WORKERS_URL${NC}"
echo -e "${YELLOW}Pages URL: $PAGES_URL${NC}\n"

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed${NC}"
    exit 1
fi

# Test Workers Health Endpoint
echo -e "${YELLOW}1. Testing Workers Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$WORKERS_URL/api/health" || echo "ERROR")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test Workers Publish Endpoint (with mock data)
echo -e "\n${YELLOW}2. Testing Publish Endpoint...${NC}"
PUBLISH_RESPONSE=$(curl -s -X POST "$WORKERS_URL/api/publish" \
    -H "Content-Type: application/json" \
    -d '{
        "profile": {
            "full_name": "Test Professional",
            "profession": "Cabeleireira",
            "whatsapp": "+5511999999999",
            "headline": "Test Headline",
            "bio": "Test Bio"
        },
        "services": [],
        "social": [],
        "links": [],
        "referral_code": "TEST'$(date +%s)'"
    }' || echo "ERROR")

if echo "$PUBLISH_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✅ Publish endpoint works${NC}"
    CARD_ID=$(echo "$PUBLISH_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "   Card ID: $CARD_ID"
else
    echo -e "${YELLOW}⚠️  Publish endpoint response: $PUBLISH_RESPONSE${NC}"
fi

# Test Get Card Endpoint (if we have a card ID)
if [ -n "$CARD_ID" ]; then
    echo -e "\n${YELLOW}3. Testing Get Card Endpoint...${NC}"
    GET_RESPONSE=$(curl -s "$WORKERS_URL/api/card/$CARD_ID" || echo "ERROR")
    if echo "$GET_RESPONSE" | grep -q "id"; then
        echo -e "${GREEN}✅ Get card endpoint works${NC}"
    else
        echo -e "${YELLOW}⚠️  Get card response: $GET_RESPONSE${NC}"
    fi
fi

# Test Search Endpoint
echo -e "\n${YELLOW}4. Testing Search Endpoint...${NC}"
SEARCH_RESPONSE=$(curl -s "$WORKERS_URL/api/search?q=cabeleireira" || echo "ERROR")
if echo "$SEARCH_RESPONSE" | grep -q "cards"; then
    echo -e "${GREEN}✅ Search endpoint works${NC}"
else
    echo -e "${YELLOW}⚠️  Search response: $SEARCH_RESPONSE${NC}"
fi

# Test Directory Endpoint
echo -e "\n${YELLOW}5. Testing Directory Endpoint...${NC}"
DIRECTORY_RESPONSE=$(curl -s "$WORKERS_URL/api/directory?page=1&limit=10" || echo "ERROR")
if echo "$DIRECTORY_RESPONSE" | grep -q "cards"; then
    echo -e "${GREEN}✅ Directory endpoint works${NC}"
else
    echo -e "${YELLOW}⚠️  Directory response: $DIRECTORY_RESPONSE${NC}"
fi

# Test Pages (if accessible)
echo -e "\n${YELLOW}6. Testing Pages Frontend...${NC}"
PAGES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PAGES_URL" || echo "000")
if [ "$PAGES_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Pages frontend accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Pages response code: $PAGES_RESPONSE${NC}"
fi

echo -e "\n${GREEN}✅ Verification complete!${NC}"
echo -e "\nManual checks to perform:"
echo -e "  1. Visit $PAGES_URL and test onboarding flow"
echo -e "  2. Test AI completion feature"
echo -e "  3. Test directory search and filters"
echo -e "  4. Test card publishing and viewing"
echo -e "  5. Check browser console for errors"

