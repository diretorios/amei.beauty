#!/bin/bash
# Deployment script for amei.beauty
# Deploys both Workers and Pages to Cloudflare

set -e

echo "🚀 Deploying amei.beauty to Cloudflare"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx is not installed${NC}"
    exit 1
fi

# Check if wrangler is available
if ! npx wrangler --version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler not found, installing...${NC}"
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
echo -e "\n${YELLOW}🔐 Checking Cloudflare authentication...${NC}"
if ! npx wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare. Please run: npx wrangler login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"

# Run tests first
echo -e "\n${YELLOW}🧪 Running tests before deployment...${NC}"
if ! npm test -- --run &> /dev/null; then
    echo -e "${RED}❌ Tests failed. Please fix tests before deploying.${NC}"
    exit 1
fi

# Build frontend
echo -e "\n${YELLOW}🏗️  Building frontend...${NC}"
if [ -z "$VITE_API_URL" ]; then
    echo -e "${YELLOW}⚠️  VITE_API_URL not set. Using default or localhost.${NC}"
    echo -e "${YELLOW}   Set VITE_API_URL environment variable for production API URL${NC}"
fi

npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed. dist directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Deploy Workers
echo -e "\n${YELLOW}☁️  Deploying Workers...${NC}"
if npm run deploy:workers; then
    echo -e "${GREEN}✅ Workers deployed successfully${NC}"
else
    echo -e "${RED}❌ Workers deployment failed${NC}"
    exit 1
fi

# Get Workers URL (if available)
WORKERS_URL=$(npx wrangler deployments list --name amei-beauty-api 2>/dev/null | head -n 1 | awk '{print $NF}' || echo "")
if [ -n "$WORKERS_URL" ]; then
    echo -e "${GREEN}   Workers URL: $WORKERS_URL${NC}"
fi

# Run migrations
echo -e "\n${YELLOW}📊 Running database migrations...${NC}"
if npm run d1:migrate; then
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  Migration failed or already applied${NC}"
fi

# Deploy Pages
echo -e "\n${YELLOW}📄 Deploying Pages...${NC}"
if npm run deploy:pages; then
    echo -e "${GREEN}✅ Pages deployed successfully${NC}"
else
    echo -e "${RED}❌ Pages deployment failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "\nNext steps:"
echo -e "  1. Verify Workers: curl $WORKERS_URL/api/health"
echo -e "  2. Check Cloudflare Dashboard for Pages URL"
echo -e "  3. Test the deployed application"

