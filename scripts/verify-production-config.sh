#!/bin/bash
# Production Configuration Verification Script
# Checks configuration files and provides verification report

set -e

echo "🔍 Verifying Production Configuration for amei.beauty"
echo "====================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ISSUES=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        return 0
    else
        echo -e "${RED}❌${NC} $2 (missing)"
        ISSUES=$((ISSUES + 1))
        return 1
    fi
}

# Function to check if value exists in file
check_value() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        return 0
    else
        echo -e "${RED}❌${NC} $3 (not found)"
        ISSUES=$((ISSUES + 1))
        return 1
    fi
}

# Function to check if value matches pattern
check_pattern() {
    if grep -qE "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $3 (check manually)"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo -e "${BLUE}=== Configuration Files ===${NC}\n"

# Check configuration files exist
check_file "wrangler.toml" "wrangler.toml (Pages config)"
check_file "wrangler.workers.toml" "wrangler.workers.toml (Workers config)"
check_file "package.json" "package.json"
check_file "vite.config.ts" "vite.config.ts"
check_file ".github/workflows/deploy.yml" "GitHub Actions workflow"

echo ""
echo -e "${BLUE}=== Wrangler Configuration ===${NC}\n"

# Check wrangler.toml (Pages)
if [ -f "wrangler.toml" ]; then
    check_value "wrangler.toml" "name = \"amei-beauty\"" "Pages name configured"
    check_value "wrangler.toml" "pages_build_output_dir = \"dist\"" "Build output directory set"
    check_value "wrangler.toml" "RATE_LIMIT_KV" "KV namespace binding configured"
fi

# Check wrangler.workers.toml
if [ -f "wrangler.workers.toml" ]; then
    check_value "wrangler.workers.toml" "name = \"amei-beauty-api\"" "Workers name configured"
    check_value "wrangler.workers.toml" "main = \"workers/index.ts\"" "Workers entry point set"
    check_value "wrangler.workers.toml" "database_id = \"def5a00b-d274-4172-927f-02066e778b97\"" "D1 database ID configured"
    check_value "wrangler.workers.toml" "bucket_name = \"amei-beauty-images\"" "R2 bucket name configured"
    check_value "wrangler.workers.toml" "ENVIRONMENT = \"production\"" "Production environment variable configured"
    
    # Check for production environment section
    if grep -q "\[env.production\]" "wrangler.workers.toml"; then
        echo -e "${GREEN}✅${NC} Production environment section exists"
    else
        echo -e "${RED}❌${NC} Production environment section missing"
        ISSUES=$((ISSUES + 1))
    fi
fi

echo ""
echo -e "${BLUE}=== Security Configuration ===${NC}\n"

# Check for sensitive files that should NOT be committed
if [ -f ".dev.vars" ]; then
    if grep -q ".dev.vars" ".gitignore"; then
        echo -e "${GREEN}✅${NC} .dev.vars is gitignored"
    else
        echo -e "${RED}❌${NC} .dev.vars should be in .gitignore"
        ISSUES=$((ISSUES + 1))
    fi
    
    # Check if dev.vars contains default dev secret
    if grep -q "AUTH_SECRET=dev-secret-change-in-production" ".dev.vars" 2>/dev/null; then
        echo -e "${YELLOW}⚠️${NC}  AUTH_SECRET in .dev.vars is default dev secret (OK for local dev)"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  .dev.vars not found (create from .dev.vars.example for local dev)"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.dev\.vars" ".gitignore"; then
        echo -e "${GREEN}✅${NC} .dev.vars is in .gitignore"
    else
        echo -e "${RED}❌${NC} .dev.vars should be in .gitignore"
        ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q "\.env" ".gitignore"; then
        echo -e "${GREEN}✅${NC} .env files are in .gitignore"
    else
        echo -e "${YELLOW}⚠️${NC}  Consider adding .env* to .gitignore"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""
echo -e "${BLUE}=== CI/CD Configuration ===${NC}\n"

# Check GitHub Actions workflow
if [ -f ".github/workflows/deploy.yml" ]; then
    check_value ".github/workflows/deploy.yml" "CLOUDFLARE_API_TOKEN" "GitHub Actions uses CLOUDFLARE_API_TOKEN secret"
    check_value ".github/workflows/deploy.yml" "CLOUDFLARE_ACCOUNT_ID" "GitHub Actions uses CLOUDFLARE_ACCOUNT_ID secret"
    check_value ".github/workflows/deploy.yml" "VITE_API_URL" "GitHub Actions uses VITE_API_URL secret"
    check_value ".github/workflows/deploy.yml" "deploy:workers" "Workers deployment step configured"
    check_value ".github/workflows/deploy.yml" "deploy:pages" "Pages deployment step configured"
    check_value ".github/workflows/deploy.yml" "d1 migrations apply" "Database migrations step configured"
fi

echo ""
echo -e "${BLUE}=== Build Configuration ===${NC}\n"

# Check package.json scripts
if [ -f "package.json" ]; then
    check_value "package.json" "\"build\"" "Build script defined"
    check_value "package.json" "\"deploy:workers\"" "Workers deployment script defined"
    check_value "package.json" "\"deploy:pages\"" "Pages deployment script defined"
    check_value "package.json" "\"d1:migrate\"" "Database migration script defined"
fi

# Check vite.config.ts
if [ -f "vite.config.ts" ]; then
    check_pattern "vite.config.ts" "dist|outDir|build" "Build output directory configured"
    check_pattern "vite.config.ts" "minify.*esbuild|minify.*terser|minify.*true" "Minification enabled"
fi

echo ""
echo -e "${BLUE}=== API Configuration ===${NC}\n"

# Check API configuration
if [ -f "src/lib/api.ts" ]; then
    if grep -q "VITE_API_URL" "src/lib/api.ts"; then
        echo -e "${GREEN}✅${NC} API uses VITE_API_URL environment variable"
    else
        echo -e "${RED}❌${NC} API configuration not using VITE_API_URL"
        ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q "localhost:8787" "src/lib/api.ts"; then
        echo -e "${GREEN}✅${NC} API has localhost fallback for development"
    fi
fi

# Check Workers CORS configuration
if [ -f "workers/index.ts" ]; then
    if grep -q "ALLOWED_ORIGINS" "workers/index.ts"; then
        echo -e "${GREEN}✅${NC} Workers CORS uses ALLOWED_ORIGINS environment variable"
    else
        echo -e "${RED}❌${NC} Workers CORS configuration not found"
        ISSUES=$((ISSUES + 1))
    fi
    
    if grep -q "ENVIRONMENT === 'development'" "workers/index.ts"; then
        echo -e "${GREEN}✅${NC} Workers error handling respects ENVIRONMENT"
    fi
fi

echo ""
echo -e "${BLUE}=== Summary ===${NC}\n"

echo -e "Configuration files checked: ${GREEN}✅${NC}"
echo -e "Issues found: ${RED}$ISSUES${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

echo ""
echo -e "${BLUE}=== Required Production Secrets ===${NC}\n"
echo "The following secrets MUST be set in Cloudflare for production:"
echo ""
echo -e "${YELLOW}Workers Secrets (set via: npx wrangler secret put <NAME> --config wrangler.workers.toml --env production):${NC}"
echo "  - AUTH_SECRET (required, generate with: openssl rand -base64 32)"
echo "  - ALLOWED_ORIGINS (required, format: https://amei.beauty,https://www.amei.beauty)"
echo "  - STRIPE_SECRET_KEY (if payments are enabled)"
echo "  - STRIPE_WEBHOOK_SECRET (if payments are enabled)"
echo ""
echo -e "${YELLOW}Pages Secrets (set via: npx wrangler pages secret put <NAME>):${NC}"
echo "  - VITE_API_URL (required, format: https://amei-beauty-api.<subdomain>.workers.dev/api)"
echo ""
echo -e "${YELLOW}GitHub Actions Secrets (set in GitHub repo settings):${NC}"
echo "  - CLOUDFLARE_API_TOKEN"
echo "  - CLOUDFLARE_ACCOUNT_ID"
echo "  - VITE_API_URL"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All configuration checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify all production secrets are set (see above)"
    echo "  2. Run: npm run build (to verify build works)"
    echo "  3. Run: npm run build:workers (to verify Workers config)"
    echo "  4. Review: docs/PRODUCTION_CONFIG_VERIFICATION.md"
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuration has warnings but no critical issues${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review warnings above"
    echo "  2. Verify all production secrets are set"
    echo "  3. Review: docs/PRODUCTION_CONFIG_VERIFICATION.md"
    exit 0
else
    echo -e "${RED}❌ Configuration has issues that need to be fixed${NC}"
    echo ""
    echo "Please fix the issues above before deploying to production."
    echo "Review: docs/PRODUCTION_CONFIG_VERIFICATION.md for detailed information."
    exit 1
fi

