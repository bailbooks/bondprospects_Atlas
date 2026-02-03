# Bail Bond Forms App

A standalone web application for digitizing bail bond intake forms. Customers fill out forms on their mobile devices, sign electronically, and submit - generating completed PDFs that are emailed to the bail bond agent.

## 🎯 Purpose

Replace the current workflow of:
1. Agent emails PDF forms to customer
2. Customer prints, handwrites, scans/photographs
3. Agent squints at blurry photos, manually enters data

With:
1. Agent sends customer a unique link
2. Customer fills out mobile-friendly forms
3. Forms validate input, capture e-signatures
4. System generates completed PDFs matching originals
5. PDFs emailed to agent (and optionally synced to Bailbooks)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BAIL FORMS APP                           │
│                   (Deployed on Railway)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │   React     │   │   Node.js   │   │  PostgreSQL │       │
│  │  Frontend   │──▶│   Express   │──▶│  Database   │       │
│  │             │   │   API       │   │             │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                           │                                 │
│                           ▼                                 │
│                    ┌─────────────┐                         │
│                    │  PDF Gen    │                         │
│                    │  (pdf-lib)  │                         │
│                    └─────────────┘                         │
│                           │                                 │
│                           ▼                                 │
│                    ┌─────────────┐                         │
│                    │   Email     │                         │
│                    │  (Resend)   │                         │
│                    └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Future: REST API
                            ▼
                   ┌─────────────────┐
                   │   BAILBOOKS     │
                   │   (Optional)    │
                   └─────────────────┘
```

## 📁 Project Structure

```
bail-forms-app/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── FormWizard/   # Multi-step form wizard
│   │   │   ├── SignaturePad/ # E-signature capture
│   │   │   ├── FormFields/   # Input components
│   │   │   └── Layout/       # Header, footer, etc.
│   │   ├── pages/            # Route pages
│   │   │   ├── IntakeForm/   # Main form wizard
│   │   │   ├── Confirmation/ # Success page
│   │   │   └── AgentDashboard/ # Agent view (future)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Helpers, validation
│   │   └── styles/           # Tailwind config, globals
│   ├── public/
│   └── package.json
│
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   │   ├── pdfService.js # PDF generation
│   │   │   ├── emailService.js # Email sending
│   │   │   └── bailbooksService.js # Bailbooks API (future)
│   │   ├── models/           # Database models
│   │   ├── utils/            # Helpers
│   │   └── templates/        # PDF templates (original forms)
│   └── package.json
│
├── shared/                   # Shared types/validation
│   └── schema.js             # Zod schemas for validation
│
├── docs/                     # Documentation
│   ├── FIELD_MAPPING.md      # Complete field mapping
│   └── API_SPEC.md           # API documentation
│
└── README.md
```

## 🚀 Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React 18 + Vite | Fast, modern, great DX |
| Styling | Tailwind CSS | Mobile-first, utility classes |
| Forms | React Hook Form + Zod | Performant forms with validation |
| Signatures | react-signature-canvas | Touch-friendly signature capture |
| Backend | Node.js + Express | Simple, good PDF libraries |
| Database | PostgreSQL | Railway's free tier, reliable |
| ORM | Prisma | Type-safe database access |
| PDF | pdf-lib | Fill PDF forms programmatically |
| Email | Resend | Modern email API, easy setup |
| Hosting | Railway | Easy deploy, handles everything |

## 📝 Supported Forms

1. **PRE-APPLICATION** - Quick intake form (1 page)
2. **BAIL BOND APPLICATION - INDEMNITOR** - Detailed indemnitor info (3 pages)
3. **IMMIGRATION BOND AGREEMENT** - Allegheny Casualty contract (2 pages)
4. **IMMIGRATION WAIVER** - Bilingual waiver (1 page)
5. **REFERENCE FORM** - Contact references (1 page)

## 🔧 Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Railway's)
- pnpm (recommended) or npm

### Setup

```bash
# Clone and install
git clone <repo>
cd bail-forms-app

# Install dependencies
cd frontend && pnpm install
cd ../backend && pnpm install

# Setup environment
cp backend/.env.example backend/.env
# Edit .env with your database URL, Resend API key, etc.

# Run database migrations
cd backend && pnpm prisma migrate dev

# Start development servers
cd frontend && pnpm dev    # http://localhost:5173
cd backend && pnpm dev     # http://localhost:3000
```

### Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/bailforms
RESEND_API_KEY=re_xxxxx
FRONTEND_URL=http://localhost:5173

# Optional: Bailbooks Integration
BAILBOOKS_API_URL=https://api.bailbooks.com
BAILBOOKS_API_KEY=xxxxx
```

## 📱 User Flow

### Customer Journey

1. **Receive Link** - Agent texts/emails: `forms.app.com/i/x7k9m2`
2. **Fill Forms** - Mobile-friendly multi-step wizard
3. **Sign** - Draw signature with finger
4. **Submit** - Generates PDFs, emails to agent
5. **Confirmation** - "Your agent will contact you"

### Agent Journey (Future)

1. **Login** - Secure agent dashboard
2. **Create Link** - Generate unique intake link
3. **Share** - Copy link or send via SMS/email
4. **Review** - See submitted forms, download PDFs
5. **Import** - Push to Bailbooks (when API ready)

## 🔒 Security Considerations

- **No SSN storage** - SSNs are used only for PDF generation, not stored
- **Encrypted at rest** - PostgreSQL encryption
- **HTTPS only** - TLS for all traffic
- **Rate limiting** - Prevent abuse
- **Link expiration** - Intake links expire after 7 days
- **IP logging** - Track signature IP for legal compliance

## 🚢 Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

Railway will automatically:
- Detect Node.js projects
- Build frontend and backend
- Provision PostgreSQL
- Set up environment variables
- Deploy with zero downtime

## 📊 Database Schema

```prisma
model Company {
  id        String   @id @default(cuid())
  name      String
  address   String
  phone     String
  email     String
  logo      String?
  intakes   Intake[]
  createdAt DateTime @default(now())
}

model Intake {
  id              String   @id @default(cuid())
  linkCode        String   @unique
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  status          String   @default("pending") // pending, completed, expired
  defendantData   Json
  indemnitorData  Json
  referencesData  Json
  bondData        Json
  signatures      Json
  submittedAt     DateTime?
  submitterIp     String?
  pdfUrls         Json?
  expiresAt       DateTime
  createdAt       DateTime @default(now())
}
```

## 🔮 Future Enhancements

### Phase 2: Agent Dashboard
- Login/authentication
- Create/manage intake links
- View submissions
- Download PDFs

### Phase 3: Bailbooks Integration
- REST API to push data to Bailbooks
- Create Customer, Indemnitor, References records
- Upload signed PDFs as Attachments

### Phase 4: Multi-tenant / White-label
- Multiple bail bond companies
- Custom branding per company
- Subdomain routing

## 📄 License

Proprietary - For Bailbooks customers only.

## 👥 Contributors

- Gary - DBA, Architecture
- Sheeraz - Bailbooks API Integration
- Claude - Initial Development
