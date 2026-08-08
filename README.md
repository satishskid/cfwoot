# CFwoot - WhatsApp-First Customer Support Platform

<div align="center">

![CFwoot Logo](https://img.shields.io/badge/CFwoot-WhatsApp%20Support-blue?style=for-the-badge&logo=whatsapp&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**The open-source alternative to DoubleTick & WATI - 100% FREE forever**

[![GitHub stars](https://img.shields.io/github/stars/satishskid/cfwoot?style=social)](https://github.com/satishskid/cfwoot)
[![GitHub forks](https://img.shields.io/github/forks/satishskid/cfwoot?style=social)](https://github.com/satishskid/cfwoot)

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
| **AI Chatbot** | ✅ | ✅ | ✅ |
| **Broadcast** | ✅ | ✅ | ✅ |
| **E-commerce** | ✅ | ✅ | ✅ |
| **Self-hosted** | ❌ | ❌ | ✅ |
| **Data Privacy** | ❌ | ❌ | ✅ |

---

## Core Features

### 1. Unified Team Inbox
- **Multi-number support** - Manage multiple WhatsApp numbers from one dashboard
- **Real-time collaboration** - See who's typing, agent presence indicators
- **Message tagging** - Organize conversations with custom tags
- **Conversation routing** - Auto-assign based on team, skills, or load

### 2. AI-Powered Support
- **Knowledge Base** - Train AI on your business FAQs
- **Smart Replies** - AI suggests responses based on conversation context
- **Intent Detection** - Automatically categorize customer messages
- **Auto-Summaries** - Generate conversation summaries when resolved

### 3. WhatsApp Flows 2.0
- **Interactive Forms** - Collect data directly in WhatsApp
- **Multi-step Wizards** - Guide customers through processes
- **E-signatures** - Get approvals in-chat
- **File Uploads** - Accept documents via WhatsApp

### 4. No-Code Bot Builder
- **Visual Flow Editor** - Drag-and-drop interface
- **Conditional Logic** - Branch based on customer responses
- **Multi-turn Conversations** - Handle complex queries
- **Human Handoff** - Seamless transfer to agents

### 5. Broadcast Marketing
- **Bulk Messaging** - Send to thousands of contacts
- **Audience Segmentation** - Filter by tags, attributes, behavior
- **Scheduled Campaigns** - Plan and automate sends
- **Delivery Analytics** - Track sent, delivered, read rates

### 6. E-commerce Integration
- **Shopify Sync** - Auto-sync products and orders
- **WooCommerce Support** - Full integration
- **Order Updates** - Send shipping notifications via WhatsApp
- **Cart Recovery** - Abandoned cart reminders

### 7. Team Management
- **Role-based Access** - Admin, Agent, Viewer permissions
- **Team Assignment** - Route to specialized teams
- **Performance Metrics** - Track agent productivity
- **SLA Policies** - Set response time targets

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Vue.js 3 + Tailwind CSS | Fast, reactive, beautiful |
| **API** | Hono + Cloudflare Workers | Edge computing, zero cold starts |
| **Database** | Turso (libSQL) | Edge-distributed SQLite |
| **Auth** | Better Auth | Secure, modern authentication |
| **Real-time** | Durable Objects + WebSocket | Persistent connections |
| **Storage** | Cloudflare R2 | S3-compatible object storage |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CFwoot Architecture                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Dashboard  │    │   Widget    │    │  Mobile     │  │
│  │   (Vue.js)   │    │   (JS SDK) │    │  (Future)   │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                           │                            │
│                    ┌──────┴──────┐                     │
│                    │  Cloudflare  │                     │
│                    │   Workers    │                     │
│                    └──────┬──────┘                     │
│                           │                            │
│         ┌─────────────────┼─────────────────┐          │
│         │                 │                 │          │
│  ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐  │
│  │    Turso     │   │  Durable    │   │     R2      │  │
│  │   Database   │   │  Objects    │   │   Storage   │  │
│  └─────────────┘   └─────────────┘   └─────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
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

### Tables (16 total)

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
| `channel_whatsapp` | WhatsApp channel config |
| `whatsapp_templates` | Message templates |
| `knowledge_articles` | AI knowledge base |
| `whatsapp_flows` | Interactive flows |
| `bot_flows` | Chatbot definitions |
| `broadcast_campaigns` | Marketing campaigns |
| `ecommerce_stores` | Connected stores |
| `teams` | Team definitions |
| `sla_policies` | SLA rules |

---

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/conversations` | List conversations |
| `POST` | `/api/v1/conversations` | Create conversation |
| `GET` | `/api/v1/conversations/:id/messages` | Get messages |
| `POST` | `/api/v1/messages` | Send message |
| `GET` | `/api/v1/contacts` | List contacts |
| `POST` | `/api/v1/contacts` | Create contact |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/ai/knowledge` | List knowledge articles |
| `POST` | `/api/v1/ai/knowledge` | Create article |
| `POST` | `/api/v1/ai/suggest` | Get reply suggestions |
| `POST` | `/api/v1/ai/summarize` | Summarize conversation |
| `POST` | `/api/v1/ai/analyze` | Analyze message intent |

### Flows Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/flows` | List flows |
| `POST` | `/api/v1/flows` | Create flow |
| `POST` | `/api/v1/flows/:id/publish` | Publish to Meta |
| `POST` | `/api/v1/flows/:id/send` | Send to contact |

### Bot Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/bots` | List bots |
| `POST` | `/api/v1/bots` | Create bot |
| `POST` | `/api/v1/bots/:id/activate` | Activate bot |
| `POST` | `/api/v1/bots/:id/test` | Test bot |

### Broadcast Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/broadcasts` | List campaigns |
| `POST` | `/api/v1/broadcasts` | Create campaign |
| `POST` | `/api/v1/broadcasts/:id/send` | Send campaign |
| `GET` | `/api/v1/broadcasts/:id/stats` | Get stats |

### E-commerce Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/ecommerce/stores` | List stores |
| `POST` | `/api/v1/ecommerce/stores/shopify` | Connect Shopify |
| `GET` | `/api/v1/ecommerce/orders` | List orders |
| `POST` | `/api/v1/ecommerce/orders/:id/send-details` | Send order via WhatsApp |

---

## Dashboard Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Conversation list |
| `/conversation/:id` | Conversation | Message thread |
| `/ai/knowledge` | Knowledge Base | Manage AI articles |
| `/ai/settings` | AI Settings | Configure AI features |
| `/flows` | WhatsApp Flows | Create interactive flows |
| `/bots` | Chatbot Builder | Build automated bots |
| `/broadcasts` | Broadcasts | Marketing campaigns |
| `/ecommerce` | E-commerce | Store & order management |
| `/settings/teams` | Teams & SLA | Team and SLA config |

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

---

## Roadmap

### Phase 1 - Core (Complete) ✅
- [x] Unified Inbox
- [x] WhatsApp Integration
- [x] Contact Management
- [x] Conversation Threading

### Phase 2 - AI (Complete) ✅
- [x] Knowledge Base
- [x] Reply Suggestions
- [x] Intent Detection
- [x] Auto-Summaries

### Phase 3 - Automation (Complete) ✅
- [x] WhatsApp Flows 2.0
- [x] No-Code Bot Builder
- [x] Broadcast Campaigns
- [x] E-commerce Integration

### Phase 4 - Enterprise (Complete) ✅
- [x] Team Management
- [x] SLA Policies
- [x] Role-based Access
- [x] Performance Metrics

### Phase 5 - Future
- [ ] Visual Flow Builder UI
- [ ] Workers AI Integration
- [ ] Mobile Apps
- [ ] Advanced Analytics Dashboard
- [ ] Multi-language Support
- [ ] Voice Messages
- [ ] Video Calls

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
- UI inspired by [Chatwoot](https://chatwoot.com)

---

<div align="center">

**Made with ❤️ for the open-source community**

[⬆ Back to top](#cfwoot---whatsapp-first-customer-support-platform)

</div>
