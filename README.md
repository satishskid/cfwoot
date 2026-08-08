# Chatwoot Cloudflare

A Cloudflare-native, WhatsApp-first customer support platform built with Hono, Turso, Better Auth, and Vue.js.

## Features

- **WhatsApp Integration** - Send and receive WhatsApp messages
- **Real-time Chat** - WebSocket-powered live messaging
- **Agent Dashboard** - Vue.js 3 web interface for support agents
- **Embeddable Widget** - Customer-facing chat widget for websites
- **Contact Management** - Track customer interactions
- **Conversation Management** - Organize and prioritize support tickets

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend API | Hono + Cloudflare Workers |
| Database | Turso (libSQL) |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Real-time | Durable Objects + WebSocket |
| Frontend | Vue.js 3 + Vite |
| Widget | Vanilla JavaScript |
| Styling | Tailwind CSS |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Turso account (free tier)
- WhatsApp Business API credentials
- Cloudflare account (free tier)

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd chatwoot-cf

# Run interactive setup
./setup.sh

# Start development
pnpm dev
```

The setup script will:
1. Check all prerequisites
2. Prompt for Turso database credentials
3. Prompt for WhatsApp Business API credentials
4. Generate secure auth secrets
5. Install all dependencies
6. Set up the database schema

### Services

- **Dashboard**: http://localhost:5173
- **API**: http://localhost:8787
- **WhatsApp Webhook**: http://localhost:8788/webhooks/whatsapp

## Development

```bash
# Start all services
pnpm dev

# Start specific service
pnpm --filter api dev
pnpm --filter dashboard dev

# Database operations
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Apply migrations
pnpm db:push      # Push schema directly (dev only)
```

## Deployment

```bash
# Deploy all services
pnpm deploy

# Deploy specific service
pnpm deploy:api
pnpm deploy:dashboard
```

## Project Structure

```
chatwoot-cf/
├── apps/
│   └── dashboard/              # Vue.js agent dashboard
├── packages/
│   ├── api/                    # Hono API worker
│   │   └── src/db/schema/      # Drizzle ORM schema
│   └── shared/                 # Shared types
├── workers/
│   ├── realtime/               # WebSocket Durable Object
│   └── whatsapp-webhook/       # WhatsApp webhook handler
├── widget-sdk/                 # Embeddable widget
├── setup.sh                    # Interactive setup
└── deploy.sh                   # Deployment script
```

## WhatsApp Setup

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to WhatsApp → API Setup
3. Copy the following:
   - Phone Number ID
   - Business Account ID
   - Permanent Access Token
   - App Secret
4. Set up webhook URL: `https://your-worker.workers.dev/webhooks/whatsapp`
5. Choose a Verify Token (you'll use this in setup)

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|----------|-------------|
| TURSO_DATABASE_URL | Turso database URL |
| TURSO_AUTH_TOKEN | Turso authentication token |
| WHATSAPP_PHONE_NUMBER_ID | WhatsApp Phone Number ID |
| WHATSAPP_ACCESS_TOKEN | WhatsApp API access token |
| WHATSAPP_APP_SECRET | WhatsApp app secret |
| WHATSAPP_VERIFY_TOKEN | Custom verify token |
| AUTH_SECRET | Auto-generated auth secret |

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/session` - Get session
- `POST /api/auth/signout` - Sign out

### Conversations
- `GET /api/v1/conversations` - List conversations
- `GET /api/v1/conversations/:id` - Get conversation
- `POST /api/v1/conversations` - Create conversation
- `PUT /api/v1/conversations/:id` - Update conversation
- `GET /api/v1/conversations/:id/messages` - Get messages

### Contacts
- `GET /api/v1/contacts` - List contacts
- `POST /api/v1/contacts` - Create contact
- `POST /api/v1/contacts/find-or-create` - Find or create by phone

### Messages
- `POST /api/v1/messages` - Send message

### WhatsApp
- `POST /api/v1/whatsapp/send` - Send text message
- `POST /api/v1/whatsapp/send-template` - Send template message
- `POST /api/v1/whatsapp/send-media` - Send media message

## Widget Integration

Add to your website:

```html
<script src="https://your-widget-url/widget.js"></script>
<script>
  initChatwoot({
    baseUrl: 'https://your-api-url',
    inboxId: 1,
    accountId: 1,
    position: 'bottom-right',
    primaryColor: '#3b82f6'
  });
</script>
```

## License

MIT
