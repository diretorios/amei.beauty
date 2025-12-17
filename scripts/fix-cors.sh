#!/bin/bash
# Fix CORS Configuration for amei.beauty
# This script helps diagnose and fix CORS issues

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

WORKERS_URL="https://amei-beauty-api.adsventures.workers.dev"
PAGES_PROJECT="amei-beauty"

print_header "CORS Configuration Fix for amei.beauty"

# Step 1: Check current ALLOWED_ORIGINS
print_step "Checking current CORS configuration"

CURRENT_ORIGINS=$(npx wrangler secret list --config wrangler.workers.toml --env production 2>/dev/null | grep "ALLOWED_ORIGINS" || echo "")

if [ -n "$CURRENT_ORIGINS" ]; then
  print_info "Current ALLOWED_ORIGINS: $CURRENT_ORIGINS"
else
  print_warning "ALLOWED_ORIGINS secret not found"
fi

# Step 2: Get Pages URL
print_step "Detecting Pages URL"

PAGES_URL=$(npx wrangler pages deployment list --project-name=$PAGES_PROJECT 2>/dev/null | grep -oP 'https://[^\s]+' | head -n1 || echo "")

if [ -n "$PAGES_URL" ]; then
  # Extract base URL (remove path)
  PAGES_BASE=$(echo "$PAGES_URL" | sed 's|\(https://[^/]*\).*|\1|')
  print_success "Pages URL detected: $PAGES_BASE"
else
  print_warning "Could not detect Pages URL automatically"
  print_info "Please provide your Pages URL (e.g., https://amei-beauty.xxx.pages.dev or https://amei.beauty)"
  read -p "Pages URL: " PAGES_BASE
  if [ -z "$PAGES_BASE" ]; then
    print_error "Pages URL is required"
    exit 1
  fi
  # Remove trailing slash and path
  PAGES_BASE=$(echo "$PAGES_BASE" | sed 's|\(https://[^/]*\).*|\1|' | sed 's|/$||')
fi

# Step 3: Build allowed origins list
print_step "Building allowed origins list"

ORIGINS_LIST="$PAGES_BASE"

# Check if custom domain exists
if [[ "$PAGES_BASE" != *".pages.dev" ]]; then
  # Already using custom domain
  print_info "Using custom domain: $PAGES_BASE"
else
  # Check if custom domain should be added
  print_info "Detected Pages.dev URL: $PAGES_BASE"
  print_info "If you have a custom domain (e.g., https://amei.beauty), we'll add it too"
  read -p "Custom domain (optional, press Enter to skip): " CUSTOM_DOMAIN
  if [ -n "$CUSTOM_DOMAIN" ]; then
    CUSTOM_DOMAIN=$(echo "$CUSTOM_DOMAIN" | sed 's|\(https://[^/]*\).*|\1|' | sed 's|/$||')
    ORIGINS_LIST="$ORIGINS_LIST,$CUSTOM_DOMAIN"
    # Also add www version if not already included
    if [[ "$CUSTOM_DOMAIN" == "https://amei.beauty" ]]; then
      ORIGINS_LIST="$ORIGINS_LIST,https://www.amei.beauty"
    fi
  fi
fi

print_success "Allowed origins: $ORIGINS_LIST"

# Step 4: Test CORS
print_step "Testing CORS configuration"

print_info "Testing OPTIONS request from $PAGES_BASE..."
CORS_TEST=$(curl -s -X OPTIONS "$WORKERS_URL/api/publish" \
  -H "Origin: $PAGES_BASE" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i 2>&1 | grep -i "access-control-allow-origin" || echo "")

if [ -n "$CORS_TEST" ]; then
  print_info "Current CORS response: $CORS_TEST"
  if echo "$CORS_TEST" | grep -qi "$PAGES_BASE"; then
    print_success "CORS is already configured correctly for $PAGES_BASE"
    exit 0
  else
    print_warning "CORS is not configured for $PAGES_BASE"
  fi
else
  print_warning "Could not test CORS (Workers may not be responding)"
fi

# Step 5: Update ALLOWED_ORIGINS
print_step "Updating ALLOWED_ORIGINS secret"

print_info "This will update the ALLOWED_ORIGINS secret in Cloudflare Workers"
print_info "New value: $ORIGINS_LIST"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_info "Cancelled"
  exit 0
fi

# Update the secret
echo "$ORIGINS_LIST" | npx wrangler secret put ALLOWED_ORIGINS --config wrangler.workers.toml --env production

if [ $? -eq 0 ]; then
  print_success "ALLOWED_ORIGINS secret updated successfully"
else
  print_error "Failed to update ALLOWED_ORIGINS secret"
  exit 1
fi

# Step 6: Verify
print_step "Verifying CORS configuration"

print_info "Waiting 5 seconds for changes to propagate..."
sleep 5

print_info "Testing CORS again..."
CORS_VERIFY=$(curl -s -X OPTIONS "$WORKERS_URL/api/publish" \
  -H "Origin: $PAGES_BASE" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i 2>&1 | grep -i "access-control-allow-origin" || echo "")

if [ -n "$CORS_VERIFY" ] && echo "$CORS_VERIFY" | grep -qi "$PAGES_BASE"; then
  print_success "CORS is now configured correctly!"
  print_info "Response: $CORS_VERIFY"
else
  print_warning "CORS test inconclusive. Changes may take a few minutes to propagate."
  print_info "Response: $CORS_VERIFY"
fi

# Summary
print_header "Summary"

echo -e "${GREEN}Configuration updated:${NC}"
echo -e "  ${CYAN}Workers URL:${NC} $WORKERS_URL"
echo -e "  ${CYAN}Pages URL:${NC} $PAGES_BASE"
echo -e "  ${CYAN}Allowed Origins:${NC} $ORIGINS_LIST"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Test publishing a card from your frontend"
echo -e "  2. Check browser console for any CORS errors"
echo -e "  3. If issues persist, wait a few minutes for changes to propagate"
echo ""
echo -e "${GREEN}✅ CORS configuration fix completed!${NC}\n"

