---
name: Monorepo Structure & Component Architecture
description: Comprehensive guide on the project's monorepo structure, folder organization, component architecture, naming conventions, and state management rules.
---

# 🏗️ MONOREPO STRUCTURE & COMPONENT ARCHITECTURE

This skill provides the definitive guide for the School Management System's architecture. Use this when creating new components, features, or understanding where files should be placed.

## PROJECT STRUCTURE RULE

### **Use Turborepo for Monorepo Management**

```
school-management-system/
│
├── apps/
│   ├── web/                          # Admin Dashboard (Next.js/Vite)
│   ├── mobile/                       # Parent/Teacher/Student App (Expo)
│   └── docs/                         # Documentation Site (Optional)
│
├── packages/
│   ├── ui/                           # Shared UI Components
│   ├── config/                       # Shared Configurations
│   ├── database/                     # Supabase Schema & Types
│   ├── utils/                        # Shared Utilities
│   ├── types/                        # TypeScript Type Definitions
│   └── auth/                         # Authentication Logic
│
├── supabase/                         # Supabase Backend
│   ├── migrations/                   # Database Migrations
│   ├── functions/                    # Edge Functions
│   ├── seed/                         # Seed Data
│   └── config.toml                   # Supabase Config
│
├── .github/                          # CI/CD Workflows
├── turbo.json                        # Turborepo Config
├── package.json                      # Root Package
├── pnpm-workspace.yaml              # PNPM Workspaces
└── README.md
```

---

## 📁 COMPLETE FOLDER STRUCTURE (DETAILED)

```
school-management-system/
│
├── apps/
│   │
│   ├── web/                                    # ADMIN WEB APP
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── favicon.ico
│   │   │
│   │   ├── src/
│   │   │   │
│   │   │   ├── app/                           # Next.js App Router (or Pages)
│   │   │   │   ├── (auth)/                    # Auth Group
│   │   │   │   │   ├── login/
│   │   │   │   │   └── layout.tsx
│   │   │   │   │
│   │   │   │   ├── (dashboard)/               # Dashboard Group
│   │   │   │   │   ├── home/
│   │   │   │   │   ├── academic-years/
│   │   │   │   │   ├── create-profile/
│   │   │   │   │   ├── students/
│   │   │   │   │   ├── teachers/
│   │   │   │   │   ├── attendance/
│   │   │   │   │   ├── exams/
│   │   │   │   │   ├── marks/
│   │   │   │   │   ├── profiles/
│   │   │   │   │   ├── certification/
│   │   │   │   │   ├── billing/
│   │   │   │   │   ├── settings/
│   │   │   │   │   └── layout.tsx
│   │   │   │   │
│   │   │   │   ├── api/                       # API Routes
│   │   │   │   │   ├── attendance/
│   │   │   │   │   ├── marks/
│   │   │   │   │   └── fees/
│   │   │   │   │
│   │   │   │   ├── layout.tsx                 # Root Layout
│   │   │   │   └── page.tsx                   # Root Page
│   │   │   │
│   │   │   ├── components/                    # Web-Specific Components
│   │   │   │   │
│   │   │   │   ├── layouts/
│   │   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   │   ├── AuthLayout.tsx
│   │   │   │   │   └── Sidebar.tsx
│   │   │   │   │
│   │   │   │   ├── features/                  # Feature-Based Components
│   │   │   │   │   │
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── students/
│   │   │   │   │   ├── teachers/
│   │   │   │   │   ├── attendance/
│   │   │   │   │   ├── exams/
│   │   │   │   │   ├── marks/
│   │   │   │   │   ├── billing/
│   │   │   │   │   ├── certification/
│   │   │   │   │   └── academic-years/
│   │   │   │   │
│   │   │   │   └── shared/                    # Web-Specific Shared Components
│   │   │   │
│   │   │   ├── hooks/                         # Web-Specific Hooks
│   │   │   ├── lib/                           # Web-Specific Utilities
│   │   │   ├── store/                         # State Management
│   │   │   └── styles/
│   │   │
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   │
│   ├── mobile/                                 # MOBILE APP (EXPO)
│   │   │
│   │   ├── src/
│   │   │   │
│   │   │   ├── navigation/                    # Navigation Structure
│   │   │   ├── screens/                       # Screens by Role
│   │   │   ├── components/                    # Mobile-Specific Components
│   │   │   ├── hooks/                         # Mobile Hooks
│   │   │   ├── lib/                           # Mobile Utilities
│   │   │   ├── store/                         # State Management
│   │   │   ├── constants/
│   │   │   └── types/
│   │   │
│   │   ├── .env
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│
│   ... (Shared Packages & Supabase Backend as detailed in the source file)
```

---

## 🧩 COMPONENT ARCHITECTURE RULES

### **1. ATOMIC DESIGN PATTERN**

```
Components Hierarchy:
├── Atoms (Basic building blocks)
│   ├── Button
│   ├── Input
│   ├── Badge
│   ├── Avatar
│   └── Icon
│
├── Molecules (Simple combinations)
│   ├── FormField (Label + Input + Error)
│   ├── SearchBar (Input + Icon + Button)
│   ├── UserCard (Avatar + Name + Badge)
│   └── StatCard (Icon + Title + Value)
│
├── Organisms (Complex components)
│   ├── NavigationBar
│   ├── DataTable
│   ├── StudentProfile
│   ├── AttendanceSheet
│   └── MarksEntryForm
│
└── Templates (Page layouts)
    ├── DashboardLayout
    ├── AuthLayout
    └── ProfileLayout
```

---

### **2. FILE STRUCTURE FOR EACH COMPONENT**

```typescript
// Example: Button Component Structure

packages/ui/src/components/Button/
├── Button.tsx                 // Main component
├── Button.types.ts            // TypeScript interfaces
├── Button.styles.ts           // Styled components (if not using Tailwind)
├── Button.stories.tsx         // Storybook stories (optional)
├── Button.test.tsx            // Unit tests
└── index.ts                   // Export barrel
```

---

### **3. NAMING CONVENTIONS**

#### **Components:**
- PascalCase (e.g., `StudentListTable.tsx`)
- Descriptive names (e.g., `CreateStudentForm.tsx` instead of `create-student.tsx`)

#### **Hooks:**
- camelCase starting with 'use' (e.g., `useAuth.ts`, `useStudents.ts`)

#### **Utils:**
- camelCase descriptive verbs (e.g., `formatDate.ts`, `validateEmail.ts`)

#### **Types:**
- camelCase with `.types.ts` suffix (e.g., `student.types.ts`)

---

### **4. COMPONENT STRUCTURE RULES**

#### **A. Feature-Based Organization**
Group components by feature, not by type.
```
src/components/features/
├── students/
├── teachers/
└── attendance/
```

#### **B. Each Feature Folder Must Have:**
- `ComponentName.tsx`
- `ComponentName.types.ts` (if complex)
- `ComponentName.test.tsx`
- `hooks/` (feature-specific)
- `utils/` (feature-specific)
- `index.ts` (exports)

---

### **5. IMPORT/EXPORT RULES**

#### **Use Barrel Exports:**
Always export from `index.ts` to allow cleaner imports.

#### **Path Aliases:**
Use configured path aliases (e.g., `@/components/*`, `@school/ui`) instead of relative paths.

---

### **6. STATE MANAGEMENT STRUCTURE**

Use Zustand for state management.
- Create slices for each domain (e.g., `studentSlice.ts`, `authSlice.ts`).
- Combine slices in the main store.
- Use persistence middleware for auth state.

---

### **7. HOOK PATTERNS**

- **Data Fetching:** Encapsulate Supabase queries in custom hooks.
- **Forms:** Use `react-hook-form` + `zod` for validation.

---

### **8. PACKAGE DEPENDENCIES**

- Use `turbo` for managing tasks.
- Shared configs in `packages/config`.
- Shared UI in `packages/ui`.
- Database schema/types in `packages/database`.

---

## 🎯 SUMMARY OF RULES

### **DO:**
✅ Use monorepo structure with Turborepo
✅ Feature-based component organization
✅ Barrel exports for clean imports
✅ TypeScript for everything
✅ Shared packages for reusable code
✅ Atomic design pattern
✅ Consistent naming conventions
✅ Path aliases for cleaner imports
✅ Separate concerns (hooks, utils, types)
✅ Test alongside components

### **DON'T:**
❌ Mix components from different features
❌ Create god components (>300 lines)
❌ Duplicate code across apps
❌ Ignore TypeScript errors
❌ Skip prop validation
❌ Hardcode values
❌ Forget error handling
❌ Skip accessibility
❌ Ignore mobile responsiveness
❌ Commit .env files
