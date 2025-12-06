#!/bin/bash
# Comprehensive testing script for amei.beauty
# Run all tests and checks before deployment

set -e

echo "🧪 Running comprehensive tests for amei.beauty"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Run linter
echo -e "\n${YELLOW}🔍 Running linter...${NC}"
if npm run lint; then
    echo -e "${GREEN}✅ Linter passed${NC}"
else
    echo -e "${RED}❌ Linter failed${NC}"
    exit 1
fi

# Run unit tests
echo -e "\n${YELLOW}🧪 Running unit tests...${NC}"
if npm test -- --run; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi

# Run tests with coverage
echo -e "\n${YELLOW}📊 Running tests with coverage...${NC}"
if npm run test:coverage; then
    echo -e "${GREEN}✅ Coverage tests passed${NC}"
else
    echo -e "${RED}❌ Coverage tests failed${NC}"
    exit 1
fi

# Build frontend
echo -e "\n${YELLOW}🏗️  Building frontend...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Check build output
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build output directory 'dist' not found${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ All tests passed! Ready for deployment.${NC}"
echo -e "\nNext steps:"
echo -e "  1. Review the build output in ./dist"
echo -e "  2. Test locally: npm run preview"
echo -e "  3. Deploy: npm run deploy:workers && npm run deploy:pages"

