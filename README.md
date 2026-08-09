# CFwoot - Open-Source WhatsApp Customer Support Platform

<div align="center">

![CFwoot Logo](https://img.shields.io/badge/CFwoot-WhatsApp%20Support-blue?style=for-the-badge&logo=whatsapp&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Cloudflare](https://img.shields.io/badge/Built%20on-Cloudflare%20Workers-orange?style=for-the-badge)

**The open-source alternative to DoubleTick & WATI — 100% FREE forever**

[![GitHub stars](https://img.shields.io/github/stars/satishskid/cfwoot?style=social)](https://github.com/satishskid/cfwoot)
[![GitHub forks](https://img.shields.io/github/forks/satishskid/cfwoot?style=social)](https://github.com/satishskid/cfwoot)
[![GitHub issues](https://img.shields.io/github/issues/satishskid/cfwoot?style=social)](https://github.com/satishskid/cfwoot/issues)

</div>

---

## What is CFwoot?

CFwoot is a **WhatsApp-first customer support platform** built entirely on Cloudflare's free tier. It's designed to compete with expensive platforms like DoubleTick ($141/month) and WATI ($59/month) by offering **100% free** self-hosted WhatsApp business API integration.

### Why CFwoot?

| Feature | DoubleTick | WATI | CFwoot |
|---------|-----------|------|--------|
| **Starting Price** | $141/month | $59/month | **FREE** |
| **WhatsApp API** | ✅ | ✅ | ✅ |
| **Team Inbox** | ✅ | ✅ | ✅ |
| **AI Chatbot** | ✅ | ✅ (extra) | ✅ Included |
| **Broadcast** | ✅ | ✅ | ✅ |
| **E-commerce** | ✅ | ✅ | ✅ |
| **Self-hosted** | ❌ | ❌ | ✅ |
| **Data Privacy** | ❌ | ❌ | ✅ |
| **Public REST API** | ❌ | Limited | ✅ Scoped |
| **Outbound Webhooks** | ❌ | ❌ | ✅ HMAC-signed |
| **Custom Fields** | Limited | Limited | ✅ Full CRUD |

---

## Core Features

### 1. Unified Team Inbox
- **Multi-number support** — Manage multiple WhatsApp numbers from one dashboard
- **Real-time collaboration** — See who's typing, agent presence indicators
- **Message tagging** — Organize conversations with custom tags
- **Conversation routing** — Auto-assign based on team, skills, or load
- **Internal notes** — Private notes visible only to agents
- **Reply-with-quote** — Reference specific messages in replies

### 2. AI-Powered Support
- **Knowledge Base** — Train AI on your business FAQs with hybrid RAG (semantic + FTS)
- **Smart Replies** — AI suggests responses based on conversation context
- **Intent Detection** — Automatically categorize customer messages
- **Auto-Summaries** — Generate conversation summaries when resolved
- **Auto-Reply Bot** — Rate-limited with per-conversation caps and handoff detection

### 3. WhatsApp Flows 2.0
- **Interactive Forms** — Collect data directly in WhatsApp
- **Multi-step Wizards** — Guide customers through processes
- **Conditional Logic** — Branch based on customer responses
- **Visual Builder** — Drag-and-drop flow editor with templates

### 4. No-Code Bot Builder
- **12 Step Types** — send_message, send_buttons, send_list, send_template, add_tag, assign, update_field, create_deal, wait, condition, webhook, close
- **8 Trigger Types** — keyword (exact/contains/word), time-based, interactive_reply, tag_added
- **Human Handoff** — Seamless transfer to agents with AI summary
- **Template Library** — Welcome menu, FAQ bot, Lead capture starters

### 5. Broadcast Marketing
- **Bulk Messaging** — Send to thousands of contacts
- **Audience Segmentation** — Filter by tags, attributes, behavior
- **Scheduled Campaigns** — Plan and automate sends
- **Delivery Analytics** — Track sent, delivered, read, replied rates
- **Template Variables** — Per-recipient personalization

### 6. E-commerce Integration
- **Shopify Sync** — Auto-sync products and orders
- **WooCommerce Support** — Full integration
- **Order Updates** — Send shipping notifications via WhatsApp
- **Cart Recovery** — Abandoned cart reminders

### 7. Team Management
- **Role-based Access** — Owner > Admin > Agent > Viewer
- **Team Assignment** — Route to specialized teams
- **Performance Metrics** — Track agent productivity
- **SLA Policies** — Set response time targets with breach alerts
- **Invitation System** — One-click invite links with token-based auth

### 8. Security & Production Hardening
- **AES-256-GCM Encryption** — WhatsApp tokens encrypted at rest
- **SSRF Protection** — Blocks private IPs on webhook URLs
- **HMAC-SHA256 Webhooks** — Outbound webhooks are cryptographically signed
- **Atomic Reply Slots** — Prevents auto-reply race conditions
- **Phone Variant Retry** — Auto-retries failed sends with alternate formats
- **Rate Limiting** — 120 req/min on public API with per-key tracking

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Vue.js 3 + Tailwind CSS | Fast, reactive, beautiful |
| **API** | Hono + Cloudflare Workers | Edge computing, zero cold starts |
| **Database** | Turso (libSQL) | Edge-distributed SQLite, 9GB free |
| **Auth** | Better Auth | Secure, modern authentication |
| **Real-time** | Durable Objects + WebSocket | Persistent connections |
| **Storage** | Cloudflare R2 | S3-compatible object storage |
| **AI** | Cloudflare Workers AI | Free tier inference |
| **Encryption** | Web Crypto API | AES-256-GCM, HMAC-SHA256 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CFwoot Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Dashboard  │    │   Widget    │    │  Public     │         │
│  │   (Vue.js)   │    │   (JS SDK) │    │  REST API   │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                           │                                    │
│                    ┌──────┴──────┐                             │
│                    │  Cloudflare  │                             │
│                    │   Workers    │                             │
│                    └──────┬──────┘                             │
│                           │                                    │
│    ┌──────────────────────┼──────────────────────┐             │
│    │                      │                      │             │
│  ┌─┴─────────┐   ┌───────┴───────┐   ┌─────────┴───┐         │
│  │   Turso    │   │   Durable     │   │      R2     │         │
│  │  Database  │   │   Objects     │   │   Storage   │         │
│  │  (22 tbls) │   │  (WebSocket)  │   │             │         │
│  └────────────┘   └───────────────┘   └─────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Security Layer                        │   │
│  │  AES-256-GCM · HMAC-SHA256 · SSRF Guard · Rate Limit   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- **Cloudflare Account** (free tier works)
- **Turso Account** (free tier: 9GB storage)
- **WhatsApp Business Account** (via Meta)
- **Node.js 18+** and **pnpm**

### 1. Clone & Setup

```bash
git clone https://github.com/satishskid/cfwoot.git
cd cfwoot
./setup.sh
```

The setup script will guide you through:
- Creating a Turso database
- Configuring WhatsApp API credentials
- Setting up Cloudflare Workers
- Generating an encryption secret

### 2. Run Locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 to access the dashboard.

### 3. Deploy to Production

```bash
./deploy.sh
```

This deploys:
- API Worker → `cfwoot-api.your-subdomain.workers.dev`
- Dashboard → `cfwoot-dashboard.pages.dev`
- WhatsApp Webhook → `cfwoot-webhook.your-subdomain.workers.dev`
- Real-time Worker → `cfwoot-realtime.your-subdomain.workers.dev`

---

## Database Schema

### Tables (22 total)

| Table | Purpose |
|-------|---------|
| `accounts` | Business accounts |
| `users` | System users |
| `sessions` | Auth sessions |
| `accounts_users` | User-account mapping |
| `contacts` | Customer contacts |
| `conversations` | Chat threads |
| `messages` | Chat messages |
| `inboxes` | WhatsApp inboxes |
| `channel_whatsapp` | WhatsApp channel config (encrypted) |
| `whatsapp_templates` | Message templates |
| `knowledge_articles` | AI knowledge base |
| `whatsapp_flows` | Interactive flows |
| `flow_responses` | Flow submission data |
| `bot_flows` | Chatbot definitions |
| `bot_executions` | Bot run history |
| `broadcast_campaigns` | Marketing campaigns |
| `broadcast_recipients` | Campaign delivery tracking |
| `ecommerce_stores` | Connected stores |
| `ecommerce_products` | Product catalog |
| `ecommerce_orders` | Order tracking |
| `teams` | Team definitions |
| `team_members` | Team membership |
| `sla_policies` | SLA rules |
| `sla_breaches` | SLA violation logs |
| `api_keys` | Scoped REST API keys |
| `webhook_endpoints` | Outbound webhook URLs |
| `webhook_delivery_logs` | Delivery attempt history |
| `contact_custom_fields` | Custom field definitions |
| `contact_custom_values` | Custom field values |

---

## API Endpoints

### Internal API (Session Auth)

#### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/conversations` | List conversations |
| `POST` | `/api/v1/conversations` | Create conversation |
| `GET` | `/api/v1/conversations/:id/messages` | Get messages |
| `POST` | `/api/v1/conversations/:id/assign` | Assign to agent |
| `PATCH` | `/api/v1/conversations/:id/status` | Update status |

#### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/contacts` | List contacts |
| `POST` | `/api/v1/contacts` | Create contact |
| `GET` | `/api/v1/contacts/:id` | Get contact |
| `PATCH` | `/api/v1/contacts/:id` | Update contact |

#### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/messages` | Send message |
| `GET` | `/api/v1/messages/:id` | Get message |

#### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/whatsapp/send` | Send text message |
| `POST` | `/api/v1/whatsapp/send-template` | Send template message |
| `POST` | `/api/v1/whatsapp/send-media` | Send media message |
| `POST` | `/api/v1/whatsapp/mark-read` | Mark message as read |
| `POST` | `/api/v1/whatsapp/claim-reply-slot` | Atomic auto-reply slot |
| `POST` | `/api/v1/whatsapp/config` | Save channel config (encrypted) |
| `GET` | `/api/v1/whatsapp/webhook` | Webhook verification |
| `POST` | `/api/v1/whatsapp/webhook` | Webhook receiver |

#### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/ai/knowledge` | List knowledge articles |
| `POST` | `/api/v1/ai/knowledge` | Create article |
| `POST` | `/api/v1/ai/suggest` | Get reply suggestions |
| `POST` | `/api/v1/ai/summarize` | Summarize conversation |
| `POST` | `/api/v1/ai/analyze` | Analyze message intent |

#### Flows
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/flows` | List flows |
| `POST` | `/api/v1/flows` | Create flow |
| `POST` | `/api/v1/flows/:id/publish` | Publish to Meta |
| `POST` | `/api/v1/flows/:id/send` | Send to contact |

#### Bots
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/bots` | List bots |
| `POST` | `/api/v1/bots` | Create bot |
| `POST` | `/api/v1/bots/:id/activate` | Activate bot |
| `POST` | `/api/v1/bots/:id/test` | Test bot |

#### Broadcasts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/broadcasts` | List campaigns |
| `POST` | `/api/v1/broadcasts` | Create campaign |
| `POST` | `/api/v1/broadcasts/:id/send` | Send campaign |
| `GET` | `/api/v1/broadcasts/:id/stats` | Get delivery stats |

#### E-commerce
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/ecommerce/stores` | List stores |
| `POST` | `/api/v1/ecommerce/stores/shopify` | Connect Shopify |
| `GET` | `/api/v1/ecommerce/orders` | List orders |
| `POST` | `/api/v1/ecommerce/orders/:id/send-details` | Send order via WhatsApp |

#### Teams & SLA
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/teams` | List teams |
| `POST` | `/api/v1/teams` | Create team |
| `GET` | `/api/v1/sla` | List SLA policies |
| `POST` | `/api/v1/sla` | Create SLA policy |

#### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/api-keys` | List API keys |
| `POST` | `/api/v1/api-keys` | Create API key |
| `DELETE` | `/api/v1/api-keys/:id` | Revoke API key |

#### Outbound Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/webhooks` | List webhook endpoints |
| `POST` | `/api/v1/webhooks` | Create webhook endpoint |
| `DELETE` | `/api/v1/webhooks/:id` | Delete webhook endpoint |

#### Custom Fields
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/custom-fields/fields` | List custom fields |
| `POST` | `/api/v1/custom-fields/fields` | Create custom field |
| `DELETE` | `/api/v1/custom-fields/fields/:id` | Delete custom field |
| `GET` | `/api/v1/custom-fields/contacts/:id` | Get contact custom values |
| `POST` | `/api/v1/custom-fields/contacts/:id` | Set contact custom values |

### Public REST API (API Key Auth)

All endpoints require `Authorization: Bearer <api_key>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/public/me` | Identity probe |
| `GET` | `/api/v1/public/contacts` | List contacts (search, tag filter) |
| `POST` | `/api/v1/public/contacts` | Create/find-or-create contact |
| `GET` | `/api/v1/public/contacts/:id` | Get contact |
| `PATCH` | `/api/v1/public/contacts/:id` | Update contact |
| `GET` | `/api/v1/public/conversations` | List conversations |
| `GET` | `/api/v1/public/conversations/:id` | Get conversation |
| `GET` | `/api/v1/public/conversations/:id/messages` | Get message history |
| `POST` | `/api/v1/public/messages` | Send message |

**Rate Limit:** 120 requests per minute per API key.

**API Key Scopes:** `read`, `write`, `admin`

---

## Dashboard Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Conversation list with real-time updates |
| `/conversation/:id` | Conversation | Message thread with AI suggestions |
| `/contacts` | Contacts | Contact management with custom fields |
| `/ai/knowledge` | Knowledge Base | Manage AI training articles |
| `/ai/settings` | AI Settings | Configure AI features |
| `/ai/summary` | Conversation Summary | AI-generated summaries |
| `/flows` | WhatsApp Flows | Create interactive flows |
| `/bots` | Chatbot Builder | Build automated bots |
| `/broadcasts` | Broadcasts | Marketing campaigns |
| `/ecommerce` | E-commerce | Store & order management |
| `/settings/teams` | Teams & SLA | Team and SLA config |

---

## Security Features

### AES-256-GCM Token Encryption

WhatsApp access tokens are encrypted at rest using AES-256-GCM with PBKDF2 key derivation. The encryption secret is stored as an environment variable.

```bash
# Generate an encryption secret
openssl rand -hex 32
# Add to wrangler.toml:
# ENCRYPTION_SECRET = "your-generated-secret"
```

### SSRF Protection

All outbound webhook URLs are validated against:
- Private IP ranges (10.x, 172.16.x, 192.168.x)
- Loopback addresses (127.x, ::1)
- Link-local addresses (169.254.x)
- Cloud metadata endpoints (169.254.169.254)
- Non-HTTPS URLs

### HMAC-SHA256 Webhook Signatures

Outbound webhooks are signed with HMAC-SHA256. Verify in your handler:

```typescript
const signature = request.headers.get("X-CFwoot-Signature");
const expected = await hmacSign(body, webhookSecret);
if (signature !== expected) throw new Error("Invalid signature");
```

### Atomic Reply Slots

Prevents race conditions when multiple concurrent messages trigger auto-replies:

```bash
POST /api/v1/whatsapp/claim-reply-slot
{
  "conversationId": 123,
  "maxPerConversation": 5
}
```

### Phone Variant Retry

When Meta rejects a number ("recipient not in allowed list"), the system automatically tries alternate formats:
- `919876543210` → `+919876543210` → `0919876543210`

The contact's phone number is auto-corrected to the working variant.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | Turso database URL | ✅ |
| `TURSO_AUTH_TOKEN` | Turso auth token | ✅ |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | ✅ |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta business account ID | ✅ |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API access token | ✅ |
| `WHATSAPP_APP_SECRET` | WhatsApp app secret | ✅ |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verify token | ✅ |
| `AUTH_SECRET` | Auth encryption secret | ✅ |
| `ENCRYPTION_SECRET` | AES-256-GCM encryption key | ✅ |

---

## Outbound Webhooks

Register HTTPS endpoints to receive events from CFwoot.

### Events

| Event | Description |
|-------|-------------|
| `message.received` | Incoming WhatsApp message |
| `message.sent` | Outgoing message sent |
| `message.status_updated` | Delivery status changed |
| `conversation.created` | New conversation started |

### Payload Format

```json
{
  "event": "message.received",
  "account_id": 1,
  "timestamp": "2026-08-09T12:00:00Z",
  "data": {
    "conversation_id": 123,
    "contact_id": 456,
    "message_id": "wamid.xxx",
    "content": "Hello!",
    "content_type": "text",
    "from": "919876543210"
  }
}
```

### Headers

```
Content-Type: application/json
X-CFwoot-Signature: sha256=...
X-CFwoot-Event: message.received
```

---

## Roadmap

### Phase 1 - Core ✅
- [x] Unified Inbox
- [x] WhatsApp Integration
- [x] Contact Management
- [x] Conversation Threading

### Phase 2 - AI ✅
- [x] Knowledge Base
- [x] Reply Suggestions
- [x] Intent Detection
- [x] Auto-Summaries

### Phase 3 - Automation ✅
- [x] WhatsApp Flows 2.0
- [x] No-Code Bot Builder
- [x] Broadcast Campaigns
- [x] E-commerce Integration

### Phase 4 - Enterprise ✅
- [x] Team Management
- [x] SLA Policies
- [x] Role-based Access
- [x] Performance Metrics

### Phase 5 - Security & Production ✅
- [x] AES-256-GCM Token Encryption
- [x] SSRF Protection
- [x] HMAC-signed Outbound Webhooks
- [x] Atomic Reply Slot Claims
- [x] Phone Variant Retry
- [x] Public REST API with Scoped Keys
- [x] Contact Custom Fields
- [x] Rate Limiting

### Phase 6 - Future
- [ ] Visual Drag-and-drop Flow Builder UI
- [ ] Workers AI Integration (replace external API)
- [ ] Mobile Apps (React Native)
- [ ] Advanced Analytics Dashboard
- [ ] Multi-language Support
- [ ] Voice Messages
- [ ] MCP Server for AI Assistants
- [ ] Contact Enrichment (Clearbit, FullContact)
- [ ] Conversation Export (CSV/PDF)
- [ ] Audit Log for Admin Actions

---

## Comparison with DoubleTick

| Feature | DoubleTick | CFwoot |
|---------|-----------|--------|
| **Price** | $141/month | **FREE** |
| **Setup** | 3-5 days | **5 minutes** |
| **Data Storage** | Their servers | **Your Cloudflare** |
| **Customization** | Limited | **Full control** |
| **AI Features** | $50+/month extra | **Included** |
| **Broadcast** | Per-message billing | **Free** |
| **Support** | Email only | **Community + Docs** |
| **Self-hosted** | ❌ | ✅ |
| **API** | Limited | **Full REST + Webhooks** |
| **Token Encryption** | Unknown | **AES-256-GCM** |
| **SSRF Protection** | Unknown | ✅ |
| **Phone Retry** | ❌ | ✅ Auto-retry |

---

## Project Structure

```
cfwoot/
├── apps/
│   └── dashboard/              # Vue.js 3 frontend
│       ├── src/
│       │   ├── views/          # 12 Vue pages
│       │   ├── stores/         # 8 Pinia stores
│       │   ├── api/            # API client
│       │   ├── components/     # Reusable components
│       │   └── router.ts       # Vue Router config
│       └── package.json
├── packages/
│   └── api/                    # Hono API backend
│       └── src/
│           ├── db/
│           │   ├── schema/     # 17 Drizzle schema files
│           │   └── index.ts    # Schema barrel export
│           ├── routes/         # 14 route files
│           ├── lib/            # Utility modules
│           │   ├── crypto.ts   # AES-256-GCM, HMAC, API keys
│           │   ├── phone.ts    # Phone normalization & variants
│           │   └── ssrf.ts     # URL safety validation
│           └── index.ts        # Main Hono app
├── widget/                     # Embeddable widget SDK
├── setup.sh                    # Interactive setup script
├── deploy.sh                   # Deployment script
├── index.html                  # Landing page
├── CFwoot-Deck.html            # Presentation deck
├── README.md                   # This file
└── package.json                # Root pnpm workspace
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Fork the repo
git clone https://github.com/your-username/cfwoot.git
cd cfwoot
pnpm install
pnpm dev
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Documentation:** [docs.cfwoot.dev](https://docs.cfwoot.dev)
- **Issues:** [GitHub Issues](https://github.com/satishskid/cfwoot/issues)
- **Discussions:** [GitHub Discussions](https://github.com/satishskid/cfwoot/discussions)

---

## Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com)
- Database by [Turso](https://turso.tech)
- Auth by [Better Auth](https://better-auth.com)
- Security patterns inspired by [wacrm](https://github.com/ArnasDon/wacrm)
- UI inspired by [Chatwoot](https://chatwoot.com)

---

<div align="center">

**Made with ❤️ for the open-source community**

[⬆ Back to top](#cfwoot---open-source-whatsapp-customer-support-platform)

</div>
