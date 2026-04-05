# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Family Finance** is a multi-user family financial management PWA built with Next.js 16, React 19, TypeScript, Prisma ORM, and PostgreSQL. It enables families to track transactions, manage budgets, view insights via an AI-powered CFO engine, and earn gamification points.

### Key Architecture

- **Frontend**: Next.js App Router (src/app) with React Server/Client components
- **Backend**: API routes (src/app/api) handling business logic
- **Database**: Prisma ORM with PostgreSQL
- **AI Integration**: OpenAI APIs for chat, CFO analysis, and email parsing
- **PWA**: Configured via next-pwa for offline-first experience
- **Authentication**: JWT-based session management (src/lib/auth.ts)

### Data Model Core Entities

- **Family**: Root organization containing users, accounts, transactions, budgets, categories
- **User**: Family members with roles (ADMIN/MEMBER), gamification points/streak
- **Account**: Multiple account types (CASH, BANK, CREDIT_CARD) with balances and limits
- **Transaction**: Income/expense with optional recurring, installments, and billing cycles
- **Category**: Income/EXPENSE categorization with rules engine (JSON)
- **Budget**: Monthly category-level spending limits
- **Achievement**: Gamification badges earned by users
- **ChatMessage & AiUsageLog**: AI feature tracking

### Multi-tenancy Pattern

All models have `familyId` to enforce data isolation per family. Always filter queries by familyId to maintain data security.

## Development Commands

```bash
# Development (uses turbopack for faster rebuilds)
npm run dev
# Opens http://localhost:3000

# Production build (uses webpack for PWA support, runs prisma generate & db push)
npm run build

# Start production server
npm start

# Run eslint
npm run lint

# Seed database with initial data
npm run seed

# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (interactive database UI)
npx prisma studio
```

## Key File Organization

**src/lib/**
- `auth.ts`: JWT token generation/verification, session management
- `prisma.ts`: Prisma client singleton (important: use this, not direct import)
- `chat-engine.ts`: OpenAI integration for financial chat
- `cfo-engine.ts`: AI-powered CFO financial analysis
- `gamification.ts`: Achievement/points calculation logic
- `transaction-service.ts`: Business logic for transaction operations
- `ai-usage.ts`: Cost tracking for API usage
- `email-parser.ts`: Parse bank statements from emails
- `useDashboard.ts`: React hook for fetching dashboard data

**src/app/api/**
- `auth/{login,register}`: User authentication endpoints
- `auth/session`: Session validation
- `dashboard`: Aggregated financial data
- `transactions`: CRUD operations
- `accounts`: Account management
- `categories`: Category operations
- `chat`: Chat with AI about finances
- `cfo`: CFO analysis engine
- `gamification`: Points/achievements
- `family`: Family member operations
- `webhooks/transactions`: Email/webhook transaction imports

**src/app/dashboard/**
- Pages: accounts, transactions, categories, credit-cards, family, chat, cfo, gamification, settings
- `layout.tsx`: Dashboard navigation and shared layout

## Important Patterns

### Environment Variables
Database connection via `DATABASE_URL` (must be PostgreSQL). OpenAI API key via `OPENAI_API_KEY`.

### Naming & Conventions
- TypeScript strict mode enabled
- Components in src/components (currently minimal, most logic in pages)
- Utilities in src/lib
- API handlers return JSON with error messages
- Dates handled via date-fns

### Build Behavior
- **Dev**: Uses turbopack for fast iteration
- **Build**: Switches to webpack (required for PWA), runs `prisma generate` and `prisma db push` before build
- Note: next.config.ts has `ignoreBuildErrors: true` for TypeScript (be careful with this)

### Transaction Features
- **Recurring**: Set via `recurring` boolean and `recurringInterval`
- **Installments**: Tracked via `installmentGroupId` and `parentTransactionId` with installment counters
- **Credit Card Billing**: `billingMonth` field for credit card statement cycles
- **Status**: CONFIRMED/PENDING states for reconciliation

### Category Rules Engine
Categories can have `rules` field (stored as JSON string) for automated transaction categorization.

## Testing

No test suite configured. Add tests when needed with Jest or Vitest.

## PWA Configuration

The app is configured as a Progressive Web App:
- Manifest and service worker generated automatically
- Caching and offline support via next-pwa
- Webpack required for build (not turbopack) to properly generate PWA assets
- Navigate to `/<APP_NAME>.webmanifest` to verify manifest generation

## Common Tasks

**Add a new API endpoint:**
1. Create handler in src/app/api/[feature]/route.ts
2. Check familyId for multi-tenancy
3. Return JSON responses with proper status codes

**Add a new dashboard page:**
1. Create src/app/dashboard/[feature]/page.tsx
2. Fetch data from API or use useDashboard hook
3. Page automatically included in dashboard layout navigation

**Update database schema:**
1. Modify prisma/schema.prisma
2. Run `npx prisma migrate dev --name <description>` for migrations OR `npx prisma db push` for direct push
3. Run `npx prisma generate` to update Prisma client
4. Restart dev server

**Debug AI features:**
- Check `AiUsageLog` table for cost/token tracking
- OpenAI API responses logged in API handler console
- Use Prisma Studio to inspect database state: `npx prisma studio`
