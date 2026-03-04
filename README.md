# Grameena Krida Vasati Shaale Sharan Sirasgi - School Management System

A modern, full-stack school management system built with React, TypeScript, and Supabase.

## 🏫 School Information
- **Name:** Grameena Krida Vasati Shaale Sharan Sirasgi
- **Location:** Sharan Sirsagi, Kalaburagi

## 🏗️ Project Structure

```
gkvs-school-management/
├── apps/
│   └── admin-web/          # Admin web application (React + Vite)
├── packages/
│   ├── shared/             # Shared types and utilities
│   ├── ui/                 # Reusable UI components
│   └── supabase-client/    # Supabase client and helpers
├── package.json
├── turbo.json
└── tsconfig.json
```

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Monorepo:** Turborepo
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Vanilla CSS with CSS Modules
- **State Management:** React Context + Hooks

## 📦 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 🔧 Development

Each package and app can be developed independently:

```bash
# Develop specific app
cd apps/admin-web
npm run dev

# Develop specific package
cd packages/ui
npm run dev
```

## 📱 Applications

### Admin Web Application
- Student, Teacher, Parent management
- Class and Academic Year management
- Attendance tracking
- Exam and Marks management
- Fee collection and reporting
- Events and Notifications
- Analytics and Reports

## 🔐 Environment Variables

Create `.env.local` files in each app directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📄 License

Private - © 2026 Grameena Krida Vasati Shaale Sharan Sirasgi
