# Elite Dock — Intelligent Asset Management

Elite Dock is a premium, high-fidelity knowledge library designed for professionals who demand clarity, depth, and efficient asset organization. Built with **Next.js 14**, **Prisma**, and **Next-Auth**, it transforms traditional bookmarking into a ritualistic asset management experience.

![Elite Luxe Branding](public/branding-hero.png) *<!-- Image placeholder for user -->*

## 💎 The Elite Difference

- **Elite Luxe Design**: High-density **320px** asset cards with deep glow physics, premium Ivory/Teal aesthetics, and glassmorphism.
- **Ritualistic Inbound**: A multi-step "Add Asset" flow (Origin → Decryption → Seal) that makes archiving feel intentional and professional.
- **Micro-Typography & Physics**: Every element is tuned for visual excellence, featuring smooth hover elevations and high-weight typography.
- **Intelligent Metadata**: Automatic extraction of 16:10 preview thumbnails, high-res favicons, and global site context.
- **Asset Taxonomy**: Deep organization via hierarchical folders, multi-tag systems, and intelligent filtering.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Security**: Next-Auth (Email Magic Links + Google OAuth)
- **Styling**: Custom "Elite Luxe" CSS (globals.css) with high-density grid logic.
- **Icons**: Lucide React + Premium SVGs

## 🛠️ Installation

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env.local
   ```
   *Note: Ensure `DATABASE_URL`, `NEXTAUTH_SECRET`, and OAuth credentials are provided.*

3. **Database Ritual**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Initialize Dock**:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

```text
app/                 # App Router (Origin, Decryption, Dashboard)
components/
  bookmarks/         # Elite Luxe Asset Components
  dashboard/         # Sidebar, Metrics, and Navigation
  ui/                # Premium Elite UI Primitives
lib/                 # Core Logic, Auth, and Metadata Engines
styles/              # Elite Luxe Design System (globals.css)
prisma/              # Data Schema
```

## 🏛️ License

This project is part of the Elite Dock suite. See LICENSE for details.

