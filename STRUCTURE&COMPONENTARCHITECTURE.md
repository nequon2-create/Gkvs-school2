# 🏗️ MONOREPO STRUCTURE & COMPONENT ARCHITECTURE

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
│   │   │   │   │   │   ├── FeeCollectionCard.tsx
│   │   │   │   │   │   ├── StudentStatsGraph.tsx
│   │   │   │   │   │   ├── AttendanceGraph.tsx
│   │   │   │   │   │   ├── SchoolCalendar.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── students/
│   │   │   │   │   │   ├── StudentListTable.tsx
│   │   │   │   │   │   ├── StudentCard.tsx
│   │   │   │   │   │   ├── StudentProfile.tsx
│   │   │   │   │   │   ├── StudentFilters.tsx
│   │   │   │   │   │   ├── CreateStudentForm.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── teachers/
│   │   │   │   │   │   ├── TeacherListTable.tsx
│   │   │   │   │   │   ├── TeacherCard.tsx
│   │   │   │   │   │   ├── TeacherProfile.tsx
│   │   │   │   │   │   ├── CreateTeacherForm.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── attendance/
│   │   │   │   │   │   ├── AttendanceCalendar.tsx
│   │   │   │   │   │   ├── AttendanceGraph.tsx
│   │   │   │   │   │   ├── AttendanceFilters.tsx
│   │   │   │   │   │   ├── BulkUploadModal.tsx
│   │   │   │   │   │   ├── AttendanceSheet.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── exams/
│   │   │   │   │   │   ├── ExamList.tsx
│   │   │   │   │   │   ├── CreateExamModal.tsx
│   │   │   │   │   │   ├── ExamCard.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── marks/
│   │   │   │   │   │   ├── MarksEntryTable.tsx
│   │   │   │   │   │   ├── BulkMarksUpload.tsx
│   │   │   │   │   │   ├── MarksFilters.tsx
│   │   │   │   │   │   ├── EditMarksModal.tsx
│   │   │   │   │   │   ├── ReportCardPreview.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── billing/
│   │   │   │   │   │   ├── BillingForm.tsx
│   │   │   │   │   │   ├── FeeStructureTable.tsx
│   │   │   │   │   │   ├── PaymentReceiptPDF.tsx
│   │   │   │   │   │   ├── FeeHistory.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── certification/
│   │   │   │   │   │   ├── CertificateForm.tsx
│   │   │   │   │   │   ├── CertificatePreview.tsx
│   │   │   │   │   │   ├── CertificateTemplate.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   └── academic-years/
│   │   │   │   │       ├── AcademicYearList.tsx
│   │   │   │   │       ├── CreateYearModal.tsx
│   │   │   │   │       ├── YearDetailsPanel.tsx
│   │   │   │   │       └── index.ts
│   │   │   │   │
│   │   │   │   └── shared/                    # Web-Specific Shared Components
│   │   │   │       ├── DataTable.tsx
│   │   │   │       ├── FileUpload.tsx
│   │   │   │       ├── PDFGenerator.tsx
│   │   │   │       ├── ChartWrapper.tsx
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── hooks/                         # Web-Specific Hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useStudents.ts
│   │   │   │   ├── useTeachers.ts
│   │   │   │   ├── useAttendance.ts
│   │   │   │   ├── useExams.ts
│   │   │   │   ├── useMarks.ts
│   │   │   │   ├── useFees.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── lib/                           # Web-Specific Utilities
│   │   │   │   ├── supabase.ts
│   │   │   │   ├── excel-parser.ts
│   │   │   │   ├── pdf-generator.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── store/                         # State Management
│   │   │   │   ├── slices/
│   │   │   │   │   ├── authSlice.ts
│   │   │   │   │   ├── studentSlice.ts
│   │   │   │   │   ├── teacherSlice.ts
│   │   │   │   │   └── uiSlice.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── styles/
│   │   │       ├── globals.css
│   │   │       └── themes.css
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
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   ├── fonts/
│   │   │   └── splash.png
│   │   │
│   │   ├── src/
│   │   │   │
│   │   │   ├── navigation/                    # Navigation Structure
│   │   │   │   ├── RootNavigator.tsx
│   │   │   │   ├── AuthNavigator.tsx
│   │   │   │   ├── ParentNavigator.tsx
│   │   │   │   ├── TeacherNavigator.tsx
│   │   │   │   └── StudentNavigator.tsx
│   │   │   │
│   │   │   ├── screens/                       # Screens by Role
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginScreen.tsx
│   │   │   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── parent/                    # Parent Screens
│   │   │   │   │   ├── HomeScreen.tsx
│   │   │   │   │   ├── EventsScreen.tsx
│   │   │   │   │   ├── CalendarScreen.tsx
│   │   │   │   │   ├── ExamsScreen.tsx
│   │   │   │   │   ├── ResultsScreen.tsx
│   │   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   │   ├── NotificationsScreen.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── teacher/                   # Teacher Screens
│   │   │   │   │   ├── HomeScreen.tsx
│   │   │   │   │   ├── HomeworkScreen.tsx
│   │   │   │   │   ├── LeaderboardScreen.tsx
│   │   │   │   │   ├── AttendanceScreen.tsx
│   │   │   │   │   ├── EventsScreen.tsx
│   │   │   │   │   ├── CalendarScreen.tsx
│   │   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   │   ├── StudentProfilesScreen.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   └── student/                   # Student Screens (if separate)
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── components/                    # Mobile-Specific Components
│   │   │   │   │
│   │   │   │   ├── features/                  # Feature Components
│   │   │   │   │   │
│   │   │   │   │   ├── parent/
│   │   │   │   │   │   ├── PendingPaymentsBanner.tsx
│   │   │   │   │   │   ├── LeaderboardCard.tsx
│   │   │   │   │   │   ├── TeacherCard.tsx
│   │   │   │   │   │   ├── StarRating.tsx
│   │   │   │   │   │   ├── NotificationItem.tsx
│   │   │   │   │   │   ├── StudentProfileCard.tsx
│   │   │   │   │   │   ├── AttendanceGraph.tsx
│   │   │   │   │   │   ├── PerformanceGraph.tsx
│   │   │   │   │   │   ├── MarksCard.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── teacher/
│   │   │   │   │   │   ├── HomeworkForm.tsx
│   │   │   │   │   │   ├── HomeworkCard.tsx
│   │   │   │   │   │   ├── TeacherLeaderboardCard.tsx
│   │   │   │   │   │   ├── AttendanceSheet.tsx
│   │   │   │   │   │   ├── StudentAttendanceItem.tsx
│   │   │   │   │   │   ├── ReviewItem.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   ├── events/
│   │   │   │   │   │   ├── EventCard.tsx
│   │   │   │   │   │   ├── EventDetails.tsx
│   │   │   │   │   │   ├── CalendarView.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   │
│   │   │   │   │   └── exams/
│   │   │   │   │       ├── ExamCard.tsx
│   │   │   │   │       ├── ResultCard.tsx
│   │   │   │   │       └── index.ts
│   │   │   │   │
│   │   │   │   └── shared/                    # Mobile Shared Components
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Card.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Avatar.tsx
│   │   │   │       ├── Badge.tsx
│   │   │   │       ├── Loader.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── hooks/                         # Mobile Hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useNotifications.ts
│   │   │   │   ├── useStudentData.ts
│   │   │   │   ├── useTeacherData.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── lib/                           # Mobile Utilities
│   │   │   │   ├── supabase.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── store/                         # State Management
│   │   │   │   ├── slices/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── constants/
│   │   │   │   ├── colors.ts
│   │   │   │   ├── fonts.ts
│   │   │   │   └── dimensions.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── navigation.ts
│   │   │
│   │   ├── .env
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   │
│   └── docs/                                   # DOCUMENTATION (OPTIONAL)
│       ├── src/
│       ├── package.json
│       └── README.md
│
│
├── packages/                                   # SHARED PACKAGES
│   │
│   ├── ui/                                     # Shared UI Components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.stories.tsx
│   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Card/
│   │   │   │   ├── Input/
│   │   │   │   ├── Select/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Table/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Avatar/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   ├── database/                               # Database Schema & Types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── database.types.ts          # Auto-generated by Supabase
│   │   │   │   ├── student.types.ts
│   │   │   │   ├── teacher.types.ts
│   │   │   │   ├── attendance.types.ts
│   │   │   │   ├── exam.types.ts
│   │   │   │   ├── fee.types.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── schemas/                       # Validation Schemas (Zod)
│   │   │   │   ├── student.schema.ts
│   │   │   │   ├── teacher.schema.ts
│   │   │   │   ├── attendance.schema.ts
│   │   │   │   ├── exam.schema.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   ├── config/                                 # Shared Configs
│   │   ├── eslint/
│   │   │   └── index.js
│   │   ├── typescript/
│   │   │   ├── base.json
│   │   │   ├── nextjs.json
│   │   │   └── react-native.json
│   │   ├── tailwind/
│   │   │   └── tailwind.config.js
│   │   └── package.json
│   │
│   │
│   ├── utils/                                  # Shared Utilities
│   │   ├── src/
│   │   │   ├── date/
│   │   │   │   ├── formatDate.ts
│   │   │   │   ├── calculateAge.ts
│   │   │   │   └── index.ts
│   │   │   ├── string/
│   │   │   │   ├── slugify.ts
│   │   │   │   ├── capitalize.ts
│   │   │   │   └── index.ts
│   │   │   ├── validation/
│   │   │   │   ├── email.ts
│   │   │   │   ├── phone.ts
│   │   │   │   └── index.ts
│   │   │   ├── calculations/
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── grades.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   ├── auth/                                   # Authentication Logic
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── SupabaseAuthProvider.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useUser.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── session.ts
│   │   │   │   ├── permissions.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   └── types/                                  # Shared TypeScript Types
│       ├── src/
│       │   ├── user.types.ts
│       │   ├── api.types.ts
│       │   ├── common.types.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
│
├── supabase/                                   # SUPABASE BACKEND
│   │
│   ├── migrations/                             # Database Migrations
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240102000000_users_and_roles.sql
│   │   ├── 20240103000000_students_teachers.sql
│   │   ├── 20240104000000_attendance.sql
│   │   ├── 20240105000000_exams_marks.sql
│   │   ├── 20240106000000_fees.sql
│   │   ├── 20240107000000_events_notifications.sql
│   │   ├── 20240108000000_rls_policies.sql
│   │   ├── 20240109000000_functions_triggers.sql
│   │   └── 20240110000000_indexes.sql
│   │
│   ├── functions/                              # Edge Functions
│   │   ├── auto-update-attendance/
│   │   │   └── index.ts
│   │   ├── generate-report-card/
│   │   │   └── index.ts
│   │   ├── send-notification/
│   │   │   └── index.ts
│   │   ├── bulk-marks-upload/
│   │   │   └── index.ts
│   │   └── generate-certificate/
│   │       └── index.ts
│   │
│   ├── seed/                                   # Seed Data
│   │   ├── 01_academic_years.sql
│   │   ├── 02_classes.sql
│   │   ├── 03_subjects.sql
│   │   ├── 04_students.sql
│   │   ├── 05_teachers.sql
│   │   └── 06_fee_structure.sql
│   │
│   ├── tests/                                  # Database Tests
│   │   └── database.test.sql
│   │
│   └── config.toml                             # Supabase Configuration
│
│
├── .github/                                    # CI/CD
│   └── workflows/
│       ├── web-deploy.yml
│       ├── mobile-build.yml
│       └── database-migration.yml
│
├── turbo.json                                  # Turborepo Config
├── pnpm-workspace.yaml                        # PNPM Workspaces
├── .gitignore
├── .env.example
├── package.json                                # Root Package
└── README.md
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

**Button.tsx Example:**
```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@school/utils';
import { ButtonProps, ButtonVariant } from './Button.types';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent hover:bg-gray-100',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg font-semibold transition-colors',
          buttonVariants[variant],
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-base',
          size === 'lg' && 'px-6 py-3 text-lg',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Button.types.ts:**
```typescript
import { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}
```

**index.ts:**
```typescript
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
```

---

### **3. NAMING CONVENTIONS**

#### **Components:**
```typescript
// ✅ CORRECT
StudentListTable.tsx
CreateStudentForm.tsx
AttendanceGraph.tsx
FeeCollectionCard.tsx

// ❌ WRONG
studentList.tsx
create-student.tsx
attendance_graph.tsx
```

#### **Hooks:**
```typescript
// ✅ CORRECT
useAuth.ts
useStudents.ts
useAttendance.ts

// ❌ WRONG
auth.ts
students.ts
```

#### **Utils:**
```typescript
// ✅ CORRECT
formatDate.ts
calculateGrade.ts
validateEmail.ts

// ❌ WRONG
dateFormatter.ts
gradeCalculator.ts
```

#### **Types:**
```typescript
// ✅ CORRECT
student.types.ts
teacher.types.ts
attendance.types.ts

// ❌ WRONG
StudentTypes.ts
teacherTypes.ts
```

---

### **4. COMPONENT STRUCTURE RULES**

#### **A. Feature-Based Organization**

```
src/components/features/
├── students/                    # Everything related to students
│   ├── StudentListTable.tsx
│   ├── StudentCard.tsx
│   ├── StudentProfile.tsx
│   ├── CreateStudentForm.tsx
│   └── index.ts                 # Barrel export
│
├── teachers/                    # Everything related to teachers
│   ├── TeacherListTable.tsx
│   ├── TeacherCard.tsx
│   └── index.ts
│
└── attendance/                  # Everything related to attendance
    ├── AttendanceCalendar.tsx
    ├── AttendanceGraph.tsx
    └── index.ts
```

#### **B. Each Feature Folder Must Have:**
```
feature/
├── ComponentName.tsx           # Main component
├── ComponentName.types.ts      # Types (if complex)
├── ComponentName.test.tsx      # Tests
├── hooks/                      # Feature-specific hooks
│   └── useComponentName.ts
├── utils/                      # Feature-specific utilities
│   └── helperFunction.ts
└── index.ts                    # Exports
```

---

### **5. IMPORT/EXPORT RULES**

#### **Use Barrel Exports:**
```typescript
// features/students/index.ts
export { StudentListTable } from './StudentListTable';
export { StudentCard } from './StudentCard';
export { StudentProfile } from './StudentProfile';
export { CreateStudentForm } from './CreateStudentForm';

// Then import like this:
import { StudentListTable, StudentCard } from '@/components/features/students';
```

#### **Path Aliases (tsconfig.json):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@school/ui": ["../../packages/ui/src"],
      "@school/database": ["../../packages/database/src"],
      "@school/utils": ["../../packages/utils/src"],
      "@school/auth": ["../../packages/auth/src"]
    }
  }
}
```

---

### **6. STATE MANAGEMENT STRUCTURE**

#### **Zustand Store Example:**
```typescript
// store/slices/studentSlice.ts
import { StateCreator } from 'zustand';
import { Student } from '@school/database';

export interface StudentSlice {
  students: Student[];
  selectedStudent: Student | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  selectStudent: (student: Student | null) => void;
}

export const createStudentSlice: StateCreator<StudentSlice> = (set) => ({
  students: [],
  selectedStudent: null,
  isLoading: false,
  error: null,
  
  setStudents: (students) => set({ students }),
  addStudent: (student) => set((state) => ({ 
    students: [...state.students, student] 
  })),
  updateStudent: (id, data) => set((state) => ({
    students: state.students.map((s) => 
      s.id === id ? { ...s, ...data } : s
    )
  })),
  deleteStudent: (id) => set((state) => ({
    students: state.students.filter((s) => s.id !== id)
  })),
  selectStudent: (student) => set({ selectedStudent: student }),
});
```

```typescript
// store/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { StudentSlice, createStudentSlice } from './slices/studentSlice';
import { TeacherSlice, createTeacherSlice } from './slices/teacherSlice';
import { AuthSlice, createAuthSlice } from './slices/authSlice';

type StoreState = StudentSlice & TeacherSlice & AuthSlice;

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createStudentSlice(...a),
        ...createTeacherSlice(...a),
        ...createAuthSlice(...a),
      }),
      {
        name: 'school-storage',
        partialize: (state) => ({ 
          // Only persist auth
          user: state.user,
          token: state.token,
        }),
      }
    )
  )
);
```

---

### **7. HOOK PATTERNS**

#### **Data Fetching Hook:**
```typescript
// hooks/useStudents.ts
import { useEffect } from 'react';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { Student } from '@school/database';

export function useStudents(classId?: string) {
  const { students, setStudents, isLoading, error } = useStore();

  useEffect(() => {
    async function fetchStudents() {
      let query = supabase.from('students').select('*');
      
      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) {
        useStore.setState({ error: error.message });
      } else {
        setStudents(data || []);
      }
    }

    fetchStudents();
  }, [classId]);

  return { students, isLoading, error };
}
```

#### **Form Hook:**
```typescript
// hooks/useStudentForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema } from '@school/database';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

export function useStudentForm() {
  const { addStudent } = useStore();
  
  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: '',
      email: '',
      // ...
    },
  });

  const onSubmit = async (data: any) => {
    const { data: student, error } = await supabase
      .from('students')
      .insert(data)
      .select()
      .single();

    if (!error && student) {
      addStudent(student);
    }
  };

  return { form, onSubmit };
}
```

---

### **8. PACKAGE DEPENDENCIES**

#### **Root package.json:**
```json
{
  "name": "school-management-system",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@turbo/gen": "^1.10.0",
    "turbo": "^1.10.0",
    "prettier": "^3.0.0",
    "eslint": "^8.50.0"
  },
  "packageManager": "pnpm@8.9.0",
  "engines": {
    "node": ">=18"
  }
}
```

#### **turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": []
    }
  }
}
```

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

---

**This structure ensures:**
- 🚀 Scalability
- 🧹 Clean code organization
- 🔄 Code reusability
- 🧪 Easy testing
- 📦 Simple deployment
- 👥 Team collaboration

**Ready to start building with this structure?** 🎓

