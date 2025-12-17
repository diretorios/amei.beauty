#!/bin/bash
# Production Deployment Script for amei.beauty
# This script facilitates deployment to Cloudflare Workers and Pages
#
# Usage:
#   ./scripts/deploy-production.sh [--skip-tests] [--skip-verify] [--api-url URL]
#
# Options:
#   --skip-tests      Skip running tests before deployment
#   --skip-verify     Skip post-deployment verification
#   --api-url URL     Set VITE_API_URL for build (overrides environment variable)

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Flags
SKIP_TESTS=false
SKIP_VERIFY=false
API_URL=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --skip-verify)
      SKIP_VERIFY=true
      shift
      ;;
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--skip-tests] [--skip-verify] [--api-url URL]"
      exit 1
      ;;
  esac
done

# Helper functions
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_step() {
  echo -e "\n${CYAN}▶ $1${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Try to load Node.js from common version managers
load_node() {
  if command_exists node; then
    return 0
  fi

  # Try loading from NVM
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  fi

  # Try loading from fnm
  if ! command_exists node && [ -s "$HOME/.local/share/fnm/fnm" ]; then
    eval "$(fnm env --use-on-cd)"
  fi

  # Try common Node.js installation paths
  if ! command_exists node; then
    for node_path in \
      "$HOME/.local/share/nvm/v25.2.1/bin/node" \
      "$HOME/.local/share/nvm/current/bin/node" \
      "/usr/local/bin/node" \
      "/usr/bin/node"; do
      if [ -x "$node_path" ]; then
        export PATH="$(dirname "$node_path"):$PATH"
        break
      fi
    done
  fi

  command_exists node
}

# Main deployment script
main() {
  print_header "🚀 Production Deployment - amei.beauty"

  # Step 1: Check prerequisites
  print_step "Checking prerequisites"

  if ! load_node; then
    print_error "Node.js is not installed or not in PATH"
    print_info "Please install Node.js or ensure it's accessible"
    exit 1
  fi

  NODE_VERSION=$(node --version)
  print_success "Node.js found: $NODE_VERSION"

  if ! command_exists npm; then
    print_error "npm is not installed"
    exit 1
  fi

  NPM_VERSION=$(npm --version)
  print_success "npm found: $NPM_VERSION"

  # Check if wrangler is available
  if ! npx wrangler --version &>/dev/null; then
    print_warning "Wrangler not found, installing..."
    npm install -g wrangler || {
      print_error "Failed to install wrangler"
      exit 1
    }
  fi

  WRANGLER_VERSION=$(npx wrangler --version 2>/dev/null | head -n1 || echo "unknown")
  print_success "Wrangler found: $WRANGLER_VERSION"

  # Step 2: Check Cloudflare authentication
  print_step "Checking Cloudflare authentication"

  if ! npx wrangler whoami &>/dev/null; then
    print_error "Not authenticated with Cloudflare"
    print_info "Please run: npx wrangler login"
    exit 1
  fi

  CLOUDFLARE_ACCOUNT=$(npx wrangler whoami 2>/dev/null | grep -i "email" | head -n1 || echo "authenticated")
  print_success "Authenticated with Cloudflare: $CLOUDFLARE_ACCOUNT"

  # Step 3: Verify configuration
  print_step "Verifying configuration"

  if [ ! -f "wrangler.workers.toml" ]; then
    print_error "wrangler.workers.toml not found"
    exit 1
  fi
  print_success "Workers configuration found"

  if [ ! -f "wrangler.toml" ]; then
    print_error "wrangler.toml not found"
    exit 1
  fi
  print_success "Pages configuration found"

  if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    exit 1
  fi
  print_success "package.json found"

  # Step 4: Run tests (optional)
  if [ "$SKIP_TESTS" = false ]; then
    print_step "Running tests"

    if npm test -- --run &>/dev/null; then
      print_success "All tests passed"
    else
      print_warning "Tests failed or no tests found"
      read -p "Continue with deployment? (y/N) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 1
      fi
    fi
  else
    print_warning "Skipping tests (--skip-tests flag set)"
  fi

  # Step 5: Get or validate API URL
  print_step "Configuring API URL for build"

  if [ -n "$API_URL" ]; then
    VITE_API_URL="$API_URL"
    print_info "Using API URL from --api-url flag: $VITE_API_URL"
  elif [ -n "$VITE_API_URL" ]; then
    print_info "Using API URL from environment variable: $VITE_API_URL"
  else
    # Try to get Workers URL automatically
    print_info "Attempting to detect Workers URL..."
    WORKERS_URL=$(npx wrangler deployments list --name amei-beauty-api --config wrangler.workers.toml 2>/dev/null | grep -oP 'https://[^\s]+' | head -n1 || echo "")

    if [ -n "$WORKERS_URL" ]; then
      # Extract base URL and add /api
      WORKERS_BASE="${WORKERS_URL%/}"
      if [[ "$WORKERS_BASE" != */api ]]; then
        WORKERS_BASE="${WORKERS_BASE}/api"
      fi
      VITE_API_URL="$WORKERS_BASE"
      print_info "Detected Workers URL: $VITE_API_URL"
    else
      print_warning "Could not detect Workers URL automatically"
      print_info "Please provide the Workers API URL (e.g., https://amei-beauty-api.YOUR_SUBDOMAIN.workers.dev/api)"
      read -p "Workers API URL: " VITE_API_URL

      if [ -z "$VITE_API_URL" ]; then
        print_error "API URL is required for production build"
        exit 1
      fi

      # Validate URL format
      if [[ ! "$VITE_API_URL" =~ ^https://.*\.workers\.dev/api$ ]]; then
        print_warning "URL format may be incorrect. Expected: https://amei-beauty-api.*.workers.dev/api"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
          print_info "Deployment cancelled"
          exit 1
        fi
      fi
    fi
  fi

  # Trim whitespace from API URL
  VITE_API_URL=$(echo "$VITE_API_URL" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  if [ -z "$VITE_API_URL" ]; then
    print_error "API URL is empty after trimming"
    exit 1
  fi

  if [[ "$VITE_API_URL" == *"localhost"* ]]; then
    print_error "API URL contains 'localhost'. This is not allowed for production builds."
    exit 1
  fi

  print_success "API URL configured: $VITE_API_URL"
  export VITE_API_URL

  # Step 6: Build frontend
  print_step "Building frontend for production"

  # Clean previous build
  if [ -d "dist" ]; then
    print_info "Cleaning previous build..."
    rm -rf dist
  fi

  print_info "Building with VITE_API_URL=$VITE_API_URL"
  if npm run build; then
    print_success "Frontend build completed"
  else
    print_error "Frontend build failed"
    exit 1
  fi

  # Verify build output
  if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    print_error "Build output directory is empty or missing"
    exit 1
  fi

  # Check for localhost in build (should not exist in production)
  if grep -r "localhost:8787" dist/ 2>/dev/null; then
    print_warning "Build contains localhost URLs. This may indicate VITE_API_URL was not applied correctly."
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_info "Deployment cancelled"
      exit 1
    fi
  else
    print_success "Build verified: No localhost URLs found"
  fi

  # Step 7: Deploy Workers
  print_step "Deploying Workers to Cloudflare"

  if npm run deploy:workers; then
    print_success "Workers deployed successfully"
  else
    print_error "Workers deployment failed"
    exit 1
  fi

  # Get Workers URL
  WORKERS_URL=$(npx wrangler deployments list --name amei-beauty-api --config wrangler.workers.toml 2>/dev/null | grep -oP 'https://[^\s]+' | head -n1 || echo "")
  if [ -n "$WORKERS_URL" ]; then
    print_info "Workers URL: $WORKERS_URL"
  fi

  # Step 8: Run database migrations
  print_step "Running database migrations"

  if npm run d1:migrate; then
    print_success "Database migrations applied"
  else
    print_warning "Migration failed or already applied (this is usually OK)"
  fi

  # Step 9: Deploy Pages
  print_step "Deploying Pages to Cloudflare"

  if npm run deploy:pages; then
    print_success "Pages deployed successfully"
  else
    print_error "Pages deployment failed"
    exit 1
  fi

  # Step 10: Post-deployment verification
  if [ "$SKIP_VERIFY" = false ]; then
    print_step "Verifying deployment"

    # Verify Workers health
    if [ -n "$WORKERS_URL" ]; then
      print_info "Checking Workers health endpoint..."
      HEALTH_URL="${WORKERS_URL%/}/api/health"
      if curl -s -f "$HEALTH_URL" >/dev/null 2>&1; then
        print_success "Workers health check passed"
      else
        print_warning "Workers health check failed (may need a moment to propagate)"
      fi
    fi

    # Get Pages URL
    print_info "Getting Pages deployment URL..."
    PAGES_URL=$(npx wrangler pages deployment list --project-name=amei-beauty 2>/dev/null | grep -oP 'https://[^\s]+' | head -n1 || echo "")
    if [ -n "$PAGES_URL" ]; then
      print_success "Pages URL: $PAGES_URL"
    else
      print_info "Check Cloudflare Dashboard for Pages URL"
    fi
  else
    print_warning "Skipping verification (--skip-verify flag set)"
  fi

  # Summary
  print_header "🎉 Deployment Complete!"

  echo -e "${GREEN}Summary:${NC}"
  echo -e "  ${CYAN}Workers:${NC} Deployed to Cloudflare Workers"
  if [ -n "$WORKERS_URL" ]; then
    echo -e "    URL: ${BLUE}$WORKERS_URL${NC}"
  fi
  echo -e "  ${CYAN}Pages:${NC} Deployed to Cloudflare Pages"
  if [ -n "$PAGES_URL" ]; then
    echo -e "    URL: ${BLUE}$PAGES_URL${NC}"
  fi

  echo -e "\n${YELLOW}Next steps:${NC}"
  echo -e "  1. Verify Workers: ${BLUE}curl ${WORKERS_URL%/}/api/health${NC}"
  if [ -n "$PAGES_URL" ]; then
    echo -e "  2. Visit Pages: ${BLUE}$PAGES_URL${NC}"
  else
    echo -e "  2. Check Cloudflare Dashboard for Pages URL"
  fi
  echo -e "  3. Test the deployed application"
  echo -e "  4. Monitor Cloudflare Dashboard for any issues"

  echo -e "\n${GREEN}✅ Production deployment completed successfully!${NC}\n"
}

# Run main function
main "$@"

