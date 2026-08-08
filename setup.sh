#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║     Chatwoot Cloudflare - Setup Wizard                  ║${NC}"
echo "${BLUE}║     WhatsApp-first customer support platform            ║${NC}"
echo "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo "${YELLOW}📋 Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || {
  echo "${RED}❌ Node.js is required. Install from https://nodejs.org${NC}"
  exit 1
}

command -v pnpm >/dev/null 2>&1 || {
  echo "${RED}❌ pnpm is required. Run: npm install -g pnpm${NC}"
  exit 1
}

command -v wrangler >/dev/null 2>&1 || {
  echo "${YELLOW}⚠️  wrangler not found. Installing...${NC}"
  npm install -g wrangler
}

command -v turso >/dev/null 2>&1 || {
  echo "${YELLOW}⚠️  Turso CLI not found.${NC}"
  echo ""
  echo "Install Turso CLI:"
  echo "  curl -sSfL https://get.tur.so/install.sh | bash"
  echo ""
  echo "Then run this setup script again."
  exit 1
}

echo "${GREEN}✅ All prerequisites found${NC}"
echo ""

# Turso Database Setup
echo "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║  📦 Turso Database Setup                                ║${NC}"
echo "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Don't have a Turso account?"
echo "  1. Go to https://turso.tech"
echo "  2. Sign up with GitHub"
echo "  3. Create a database"
echo ""

read -p "Turso Database URL (libsql://...): " TURSO_URL
read -s -p "Turso Auth Token: " TURSO_TOKEN
echo ""

# WhatsApp Business API Setup
echo ""
echo "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║  📱 WhatsApp Business API Setup                          ║${NC}"
echo "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Get these from https://business.facebook.com"
echo "  1. Go to WhatsApp → API Setup"
echo "  2. Copy the required credentials"
echo ""

read -p "Phone Number ID: " WHATSAPP_PHONE_ID
read -p "Business Account ID (WABA ID): " WHATSAPP_WABA_ID
read -s -p "Permanent Access Token: " WHATSAPP_TOKEN
echo ""
read -s -p "App Secret: " WHATSAPP_APP_SECRET
echo ""
read -p "Verify Token (you choose this, e.g., my-chatwoot-verify): " WHATSAPP_VERIFY_TOKEN

# Generate auth secret
AUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '\n' | head -c 64)

# Create .env file
echo ""
echo "${YELLOW}📝 Creating configuration files...${NC}"

cat > .env << EOF
# Turso Database
TURSO_DATABASE_URL=$TURSO_URL
TURSO_AUTH_TOKEN=$TURSO_TOKEN

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=$WHATSAPP_PHONE_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=$WHATSAPP_WABA_ID
WHATSAPP_ACCESS_TOKEN=$WHATSAPP_TOKEN
WHATSAPP_APP_SECRET=$WHATSAPP_APP_SECRET
WHATSAPP_VERIFY_TOKEN=$WHATSAPP_VERIFY_TOKEN

# Auth (auto-generated)
AUTH_SECRET=$AUTH_SECRET
BETTER_AUTH_URL=http://localhost:8787
EOF

# Create .dev.vars for wrangler
cat > .dev.vars << EOF
TURSO_AUTH_TOKEN=$TURSO_TOKEN
WHATSAPP_ACCESS_TOKEN=$WHATSAPP_TOKEN
WHATSAPP_APP_SECRET=$WHATSAPP_APP_SECRET
AUTH_SECRET=$AUTH_SECRET
EOF

echo "${GREEN}✅ Configuration saved to .env and .dev.vars${NC}"

# Install dependencies
echo ""
echo "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

# Setup database
echo ""
echo "${YELLOW}🗄️  Setting up database schema...${NC}"
cd packages/api
pnpm db:generate 2>/dev/null || true
pnpm db:push 2>/dev/null || echo "Note: Database push may require manual setup"
cd ../..

echo ""
echo "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo "${GREEN}║  ✅ Setup Complete!                                      ║${NC}"
echo "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${BLUE}🚀 To start development:${NC}"
echo ""
echo "   pnpm dev"
echo ""
echo "${BLUE}🌐 Services:${NC}"
echo "   Dashboard:  http://localhost:5173"
echo "   API:        http://localhost:8787"
echo "   Webhook:    http://localhost:8788/webhooks/whatsapp"
echo ""
echo "${BLUE}📱 WhatsApp Webhook URL (for Meta):${NC}"
echo "   https://your-worker.workers.dev/webhooks/whatsapp"
echo ""
echo "${BLUE}📖 To deploy to Cloudflare:${NC}"
echo "   pnpm deploy"
echo ""
echo "${YELLOW}⚠️  Important:${NC}"
echo "   1. Set up your WhatsApp webhook in Meta Business Manager"
echo "   2. Test the webhook verification endpoint"
echo "   3. Send a test message to verify everything works"
echo ""
