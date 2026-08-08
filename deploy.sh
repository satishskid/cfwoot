#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║  🚀 Chatwoot Cloudflare - Deploy                        ║${NC}"
echo "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if logged in to Cloudflare
echo "${YELLOW}📋 Checking Cloudflare login...${NC}"
if ! wrangler whoami >/dev/null 2>&1; then
  echo "${YELLOW}⚠️  Not logged in to Cloudflare. Logging in...${NC}"
  wrangler login
fi

echo "${GREEN}✅ Logged in to Cloudflare${NC}"

# Deploy API
echo ""
echo "${YELLOW}📦 Deploying API worker...${NC}"
cd packages/api
npx wrangler deploy --minify
cd ../..

# Deploy Webhook Handler
echo ""
echo "${YELLOW}📦 Deploying WhatsApp webhook handler...${NC}"
cd workers/whatsapp-webhook
npx wrangler deploy --minify
cd ../..

# Deploy Realtime
echo ""
echo "${YELLOW}📦 Deploying Realtime worker...${NC}"
cd workers/realtime
npx wrangler deploy --minify
cd ../..

# Build and deploy Dashboard
echo ""
echo "${YELLOW}📦 Building and deploying Dashboard...${NC}"
cd apps/dashboard
pnpm build
npx wrangler pages deploy dist --project-name chatwoot-dashboard
cd ../..

# Build Widget SDK
echo ""
echo "${YELLOW}📦 Building Widget SDK...${NC}"
cd widget-sdk
pnpm build
cd ..

echo ""
echo "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║  ✅ Deployment Complete!                                 ║${NC}"
echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${BLUE}🌐 Your services are now live:${NC}"
echo ""
echo "   API:        https://chatwoot-api.your-subdomain.workers.dev"
echo "   Webhook:    https://chatwoot-whatsapp-webhook.your-subdomain.workers.dev"
echo "   Realtime:   https://chatwoot-realtime.your-subdomain.workers.dev"
echo "   Dashboard:  https://chatwoot-dashboard.pages.dev"
echo ""
echo "${BLUE}📱 WhatsApp Webhook URL (for Meta):${NC}"
echo "   https://chatwoot-whatsapp-webhook.your-subdomain.workers.dev/webhooks/whatsapp"
echo ""
echo "${YELLOW}⚠️  Next steps:${NC}"
echo "   1. Update .env with your deployed URLs"
echo "   2. Set up WhatsApp webhook in Meta Business Manager"
echo "   3. Test the complete flow"
echo ""
