# Panya — AI Shopping Assistant | Complete Project Overview

## 🎯 Project Summary

**Panya** is a full-stack e-commerce platform powered by an AI assistant that helps customers discover and purchase products. It combines a modern React frontend with a robust Node.js/Express backend, integrated with AI capabilities (Groq) for intelligent shopping assistance, voice interaction support, and merchant management features.

The application uses **Google OAuth** for authentication, **Razorpay** for payment processing, **MongoDB** for data persistence, and **OpenTelemetry** for distributed tracing/observability.

---

## 📋 Tech Stack

### Frontend
- **React 19** — Modern UI library with hooks
- **React Router 7** — Client-side navigation and routing
- **Vite** — Lightning-fast build tool and dev server
- **Recharts** — Data visualization for charts and analytics
- **i18n** — Internationalization support (multi-language)
- **CSS Variables** — Theme system (light/dark mode support)

### Backend
- **Node.js 20** — JavaScript runtime
- **Express 5** — Web framework and API server
- **MongoDB 9** — NoSQL document database
- **Mongoose** — MongoDB object modeling
- **Passport.js** — Authentication middleware (Google OAuth 2.0)
- **Express Session + Connect Mongo** — Session management
- **Groq SDK** — AI/LLM integration for chat and recommendations
- **Razorpay** — Payment gateway integration
- **Node Cron** — Scheduled background jobs
- **Nodemailer** — Email notifications
- **Multer** — File upload handling
- **CORS** — Cross-origin request handling

### DevOps & Observability
- **OpenTelemetry** — Distributed tracing and monitoring
  - OTLP HTTP exporter (sends traces to Jaeger/similar)
  - Auto-instrumentation for Node.js
- **Docker** — Multi-stage containerization
- **Nodemon** — Development server auto-reload

---

## 📁 Folder Structure

```
panya/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js            # API client (fetch wrapper)
│   │   ├── assets/                  # Images, fonts, static files
│   │   ├── components/
│   │   │   ├── PromoCarousel.jsx    # Product promo carousel
│   │   │   ├── ProtectedRoute.jsx   # Auth guard wrapper
│   │   │   └── ThemeToggle.jsx      # Light/dark mode toggle
│   │   ├── hooks/
│   │   │   └── useRevealOnScroll.js # Scroll animation hook
│   │   ├── pages/                   # Full-page components
│   │   │   ├── Landing.jsx          # Home/landing page
│   │   │   ├── SignIn.jsx           # Auth page (Google OAuth + guest)
│   │   │   ├── Chat.jsx             # AI chat interface
│   │   │   ├── Dashboard.jsx        # User orders & insights
│   │   │   ├── Storefront.jsx       # Product catalog
│   │   │   ├── Automation.jsx       # Auto-order rules setup
│   │   │   ├── MerchantDashboard.jsx # Seller analytics
│   │   │   └── MerchantProducts.jsx  # Seller product management
│   │   ├── App.jsx                  # Root component w/ routing
│   │   ├── App.css                  # Global styles
│   │   ├── theme.css                # Theme system & variables
│   │   ├── i18n.js                  # Language configuration
│   │   ├── index.css                # Base styles
│   │   ├── main.jsx                 # React DOM mount point
│   │   └── [page].css               # Page-specific styles
│   ├── public/                      # Static assets
│   ├── index.html                   # HTML entry point (theme sync script)
│   ├── vite.config.js               # Vite configuration
│   └── package.json
│
├── server/                          # Express Backend
│   ├── tracing.js                   # OpenTelemetry setup
│   ├── server.js                    # Main server entry point
│   ├── scheduler.js                 # Background job scheduler
│   ├── config/
│   │   └── passport.js              # Google OAuth strategy config
│   ├── routes/                      # API endpoints
│   │   ├── auth.js                  # GET /api/auth/google, /logout, /check
│   │   ├── chat.js                  # POST /api/chat/message
│   │   ├── orders.js                # POST/GET /api/order/* (user orders)
│   │   ├── merchant.js              # GET /api/merchant/* (seller dashboard)
│   │   ├── user.js                  # GET/POST /api/user/* (profile, insights)
│   │   └── autoOrder.js             # POST/GET /api/auto-order/* (auto rules)
│   ├── models/                      # MongoDB schemas
│   │   ├── User.js                  # User profile (Google OAuth)
│   │   ├── Product.js               # Product catalog
│   │   ├── Order.js                 # Purchase orders
│   │   ├── AutoOrderRule.js         # Auto-replenish rules per user
│   │   ├── MerchantRule.js          # Seller-specific upsell rules
│   │   ├── ChatQueryLog.js          # AI chat history
│   │   ├── AuditLog.js              # Action audit trail
│   │   ├── MerchantInsight.js       # Seller analytics
│   │   └── MerchantInsight.js       # AI-generated insights
│   ├── cron/
│   │   └── insightCron.js           # Scheduled insight generation (every 6 hours)
│   ├── utils/
│   │   ├── aiBuyer.js               # AI recommendation engine
│   │   ├── analytics.js             # Order/revenue analytics
│   │   ├── email.js                 # Email sender via Nodemailer
│   │   └── insightGenerator.js      # Groq-powered insights
│   ├── scripts/
│   │   ├── seed.js                  # Populate initial products
│   │   ├── add-products.js          # Bulk product import
│   │   ├── ai-buyer.js              # Simulate AI customer orders
│   │   ├── reset-customer.js        # Clean user data
│   │   └── update-rules.js          # Modify auto-order rules
│   └── package.json
│
├── public/                          # Static files served by Express
│   ├── chat.html                    # Chat widget HTML
│   └── checkout.html                # Checkout embed
│
├── Dockerfile                       # Multi-stage Docker build
├── voice-assistant.patch            # Git patch file (voice feature)
└── README.md                        # Project documentation
```

---

## 🔄 Architecture & Data Flow

### User Authentication Flow
```
Landing Page → Google OAuth / Guest Sign-In
                    ↓
          Session + MongoDB Store
                    ↓
          Protected Routes (Chat, Dashboard, etc.)
```

### AI Chat & Shopping Flow
```
User Message (Chat.jsx)
    ↓
POST /api/chat/message
    ↓
Groq LLM (AI Assistant)
    ↓
Generate product recommendations
    ↓
Query MongoDB products
    ↓
Return recommendations + context
    ↓
Log to ChatQueryLog (audit trail)
```

### E-Commerce Order Flow
```
Storefront (Browse Products)
    ↓
Add to Cart / Create Order
    ↓
POST /api/order (payment)
    ↓
Razorpay Payment Gateway
    ↓
Create Order record in MongoDB
    ↓
Trigger auto-order rules check
    ↓
User Dashboard (view orders, insights)
```

### Auto-Order Intelligence
```
User sets AutoOrderRule:
  "Re-order coffee beans when stock < 3"
    ↓
Cron job runs every 6 hours
    ↓
Check user rules + product stock
    ↓
AI suggests reorder if conditions met
    ↓
Send email notification
    ↓
Auto-create order (with merchant upsell rules)
```

### Merchant Insights
```
Every 6 hours (node-cron)
    ↓
Groq generates AI insights:
  - Revenue trends
  - Top-selling categories
  - Customer behavior patterns
  - Spike alerts
    ↓
Store in MerchantInsight
    ↓
MerchantDashboard displays charts + insights
```

---

## 🗄️ Data Models (MongoDB Collections)

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `users` | User profiles | `googleId`, `name`, `email`, `razorpayCustomerId`, `savedPaymentToken` |
| `products` | Product catalog | `name`, `price`, `category`, `stock`, `imageUrl`, `style`, `color`, `material` |
| `orders` | Purchase records | `userId`, `items[]`, `totalAmount`, `status`, `razorpayOrderId`, `createdAt` |
| `autoorderrules` | Auto-replenish triggers | `userId`, `productId`, `minStock`, `autoOrder` |
| `merchantrules` | Seller upsell logic | `sellerId`, `conditions[]`, `upsellProduct` |
| `chatquerylogs` | AI chat history | `userId`, `query`, `response`, `timestamp` |
| `merchantinsights` | Seller analytics | `sellerId`, `revenue`, `trends`, `recommendations`, `generatedAt` |
| `auditlogs` | Action audit trail | `userId`, `action`, `resource`, `timestamp` |

---

## 🌐 API Endpoints

### Authentication
- `GET /api/auth/google` — Redirect to Google OAuth
- `GET /api/auth/callback` — OAuth callback handler
- `GET /api/auth/check` — Verify current session
- `POST /api/auth/logout` — Clear session

### Chat & AI
- `POST /api/chat/message` — Send message to AI, get recommendation

### Orders (User)
- `GET /api/order/list` — Get user's orders
- `POST /api/order/create` — Create new order
- `GET /api/order/:id` — Get order details

### User Profile
- `GET /api/user/profile` — Get user info
- `GET /api/user/insights` — Get AI-generated shopping insights
- `POST /api/user/auto-rules` — Save auto-order rules

### Auto-Order
- `GET /api/auto-order/rules` — Get user's auto rules
- `POST /api/auto-order/create` — Create rule
- `PUT /api/auto-order/:id` — Update rule

### Merchant (Seller Dashboard)
- `GET /api/merchant/dashboard` — Revenue, order count, upsell metrics
- `GET /api/merchant/analytics` — 30-day revenue trends
- `GET /api/merchant/insights` — AI-generated business insights
- `POST /api/merchant/insights/refresh` — Force insights regeneration
- `GET /api/merchant/products` — List seller's products
- `POST /api/merchant/products/add` — Add new product

---

## 🎨 Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Landing** | `/` | Marketing page with features, CTAs |
| **Sign In** | `/signin` | Google OAuth + Guest checkout |
| **Chat** | `/chat` | AI shopping assistant interface |
| **Storefront** | `/store` | Product catalog by category + carousel |
| **Dashboard** | `/dashboard` | User orders, insights, auto-rules |
| **Automation** | `/automation` | Setup auto-order rules |
| **Merchant Dashboard** | `/merchant` | Seller analytics, revenue charts |
| **Merchant Products** | `/merchant/products` | Manage seller's inventory |

---

## 🎨 Theme System

- **Light Mode** (default)
- **Dark Mode** (with smooth transitions)
- Stored in `localStorage` as `panya_theme`
- CSS Variables: `--bg-page`, `--bg-card`, `--text-primary`, `--accent`, `--border`, etc.
- Theme synced before React mounts (no flash)

---

## 🔐 Security & Session Management

- **Passport.js** with Google OAuth 2.0 strategy
- **Express Sessions** stored in MongoDB via `connect-mongo`
- **CORS** enabled for frontend origin
- **Secure Cookies** (with SameSite policy) in production
- **Environment Variables** for sensitive data (.env file)

---

## 📊 Observability & Monitoring

- **OpenTelemetry** auto-instrumentation for:
  - HTTP requests
  - Database queries
  - Express middleware
- **OTLP HTTP Exporter** sends traces to Jaeger (or compatible backend)
- **Graceful Shutdown** on SIGTERM (flushes traces before exit)

---

## 🚀 Deployment

### Docker
- **Multi-stage build**: React frontend compiled first, then bundled into backend
- **Node 20 Alpine** image for minimal size
- **Production mode**: Serves compiled frontend from Express static

### Environment Variables
```env
FRONTEND_URL=https://panya.example.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/panya
SESSION_SECRET=random_secret_key
SECURE_COOKIES=true
PORT=3001
NODE_ENV=production
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
RAZORPAY_KEY_ID=xxxxx
RAZORPAY_SECRET=xxxxx
GROQ_API_KEY=xxxxx
SMTP_HOST=smtp.gmail.com
SMTP_USER=xxxxx
SMTP_PASS=xxxxx
```

---

## 📦 Key Features Implemented

✅ **AI Shopping Assistant** — Groq-powered chat for product recommendations  
✅ **User Authentication** — Google OAuth + guest checkout  
✅ **Product Catalog** — Browse by category with dynamic carousel  
✅ **Payment Integration** — Razorpay for secure transactions  
✅ **Auto-Order Intelligence** — Scheduled replenishment with AI suggestions  
✅ **Merchant Analytics** — Real-time revenue trends & insights  
✅ **Dark Mode Toggle** — Theme persistence across sessions  
✅ **Distributed Tracing** — OpenTelemetry for observability  
✅ **Email Notifications** — Order confirmations, insights, reminders  
✅ **Responsive Design** — Mobile-first CSS with media queries  
✅ **Internationalization** — Multi-language support (i18n)  

---

## 🛠️ Development Commands

### Frontend
```bash
cd client
npm install          # Install dependencies
npm run dev         # Start Vite dev server (port 5173)
npm run build       # Production build
npm run lint        # Run oxlint
```

### Backend
```bash
cd server
npm install          # Install dependencies
npm run dev         # Start with nodemon (port 3001)
npm test            # Run tests (not configured)
```

### Scripts
```bash
cd server
node scripts/seed.js              # Populate sample products
node scripts/add-products.js      # Bulk import
node scripts/ai-buyer.js          # Simulate orders
node scripts/reset-customer.js    # Clear user data
node scripts/update-rules.js      # Modify auto-rules
```

---

## 🚀 Getting Started

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd panya
   npm install # for both client and server
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env
   # Fill in Google OAuth, Razorpay, Groq, MongoDB credentials
   ```

3. **Seed Database**
   ```bash
   cd server
   node scripts/seed.js
   ```

4. **Run Development Servers**
   ```bash
   # Terminal 1: Frontend
   cd client && npm run dev
   
   # Terminal 2: Backend
   cd server && npm run dev
   ```

5. **Access Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

---

## 📝 Recent Additions (Current Session)

- ✅ Added **CSS rules** for product cards, back button, promo carousel
- ✅ Added **theme sync script** to prevent light mode flash
- ✅ Created **ThemeToggle component** with light/dark switching
- ✅ Wired toggle into **shared nav**, **Merchant Dashboard**, **Sign In**
- ✅ Installed **OpenTelemetry packages** for distributed tracing
- ✅ Created **tracing.js** with SDK initialization and SIGTERM handler
- ✅ Integrated tracing at **server.js entry point**

---

## 🎯 Next Steps / Future Enhancements

- [ ] Add unit & integration tests (Jest, Vitest)
- [ ] Implement voice shopping interface
- [ ] Add real-time notifications (WebSockets)
- [ ] Expand merchant analytics (forecasting, ML)
- [ ] Implement product recommendation engine (collaborative filtering)
- [ ] Add order tracking & fulfillment workflow
- [ ] Enhance mobile app experience
- [ ] Setup CI/CD pipeline (GitHub Actions)

---

This is a **production-ready e-commerce platform** with AI at its core, designed for both customers and merchants with advanced analytics and automation.
