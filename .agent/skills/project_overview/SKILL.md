---
name: Project Overview
description: Comprehensive documentation for the School Management System, covering architecture, database schema, user roles, features, and UI/UX guidelines.
---

# 🎓 Complete School Management System - Project Blueprint

## 1. PROJECT OVERVIEW & OBJECTIVE
**Goal**: Build a cohesive, full-stack school management system with responsive web and mobile applications sharing a unified backend.

**Core Stack**:
- **Frontend (Web)**: React with TypeScript
- **Frontend (Mobile)**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **State Management**: Zustand or Redux Toolkit
- **UI Framework**:
  - **Web**: Tailwind CSS + Shadcn/ui
  - **Mobile**: React Native Paper or NativeBase
- **Authentication**: Supabase Auth with Row Level Security (RLS)

## 2. USER ROLES & ACCESS LEVELS
- **Admin (Desktop/Web App)**
  - Full system control
  - Desktop-optimized interface
  - Complete CRUD operations
- **Parents/Students (Mobile App)**
  - View-only access to student data
  - Payment notifications
  - Event calendar
  - Teacher ratings
- **Teachers (Mobile App)**
  - Attendance management
  - Homework assignment
  - Student profile viewing
  - Performance tracking

## 3. COMPLETE FEATURE BREAKDOWN

### 📱 ADMIN DASHBOARD (Desktop/Web)
#### 1. HOME DASHBOARD
- Fee Collection Metrics (Year-wise, Interactive graphs, Real-time notifications)
- Student Statistics (Gender breakdown, Monthly attendance, Live tracking)
- Teacher Attendance Graph (Monthly overview, Historical data)
- School Calendar (Events, Holidays, Exams)

#### 2. ACADEMIC YEARS
- Create/Transition academic years
- Historical data view (Fees, Attendance, Assignments)

#### 3. PROFILE CREATION
- Student/Teacher toggle
- Comprehensive details (Photo, Auto-generated Reg No, Secure Password)
- Database integration (Attendance, Fees, Marks)

#### 4. STUDENT LIST
- WhatsApp-style contact list
- Filters (Class-wise), Search (Reg No, Name)

#### 5. ATTENDANCE MANAGEMENT
- Visualization (Graphs, Gender breakdown)
- Bulk Upload (Excel/Google Sheets) with validation

#### 6. EXAM MANAGEMENT
- Create/Publish exams
- Auto-sync across roles

#### 7. MARKS ENTRY
- Bulk Upload (Excel)
- Filtering & Student Marks View
- Auto-Processing (Report cards, Profile updates)

#### 8. PROFILES
- View/Edit Student & Teacher profiles
- Download/Print options

#### 9. CERTIFICATION
- Generate certificates (Conduct, Type)
- Live preview

#### 10. BILLING
- Fee calculation & Receipt generation
- Auto-update profile

#### 11. SCHOOL SETTINGS
- Fee structure configuration

### 📱 PARENT/STUDENT APP (Mobile)
#### 1. HOME
- Pending Payments Banner
- Class Leaderboard
- Teacher Directory & Ratings
- Notifications (Admin updates, Exam schedules, Results)

#### 2. EVENTS/CALENDAR
- School calendar & distinct Events tab

#### 3. EXAM & RESULTS
- Upcoming exams & Published results

#### 4. STUDENT PROFILE
- Instagram-style layout
- Performance graphs & Marks sheets

### 📱 TEACHER APP (Mobile)
#### 1. HOME
- Homework Management
- Leaderboard (Teacher rankings)
- Notifications & Student Profiles

#### 2. EVENTS/CALENDAR
- Same as Parent view

#### 3. ATTENDANCE
- Class roster marking (Present/Absent)

#### 4. TEACHER PROFILE
- Dashboard with performance graphs & student feedback

## 4. DATABASE SCHEMA (Supabase)
### Core Tables
1.  **users**: `id`, `email`, `role`, `created_at`, `updated_at`
2.  **academic_years**: `id`, `year_name`, `start_date`, `end_date`, `is_current`, `created_by`
3.  **students**: `id`, `registration_number`, `user_id`, `full_name`, `dob`, `gender`, `class_id`, `section`, `roll_number`, `photo_url`, `parent_id`, `academic_year_id`, `address`, `phone`, `email`
4.  **parents**: `id`, `user_id`, `full_name`, `phone`, `email`, `relationship`, `occupation`
5.  **teachers**: `id`, `user_id`, `registration_number`, `full_name`, `photo_url`, `phone`, `email`, `subjects` (ARRAY), `doj`, `qualification`
6.  **classes**: `id`, `class_name`, `section`, `academic_year_id`, `class_teacher_id`
7.  **subjects**: `id`, `subject_name`, `subject_code`, `class_id`, `teacher_id`
8.  **attendance**: `id`, `student_id`, `class_id`, `date`, `status`, `subject_id`, `marked_by`
9.  **exams**: `id`, `exam_name`, `exam_type`, `class_id`, `academic_year_id`, `start_date`, `end_date`, `published`
10. **marks**: `id`, `student_id`, `exam_id`, `subject_id`, `marks_obtained`, `max_marks`, `grade`, `remarks`
11. **fees**: `fee_structure` (id, class_id, year_id, amount, installments), `student_fees`, `fee_payments`
12. **events**: `id`, `title`, `description`, `date`, `type`, `images`, `videos`
13. **homework**: `id`, `teacher_id`, `class_id`, `subject_id`, `title`, `description`, `due_date`, `attachments`
14. **notifications**: `id`, `user_id`, `title`, `message`, `type`, `read`, `action_url`
15. **teacher_ratings**: `id`, `teacher_id`, `student_id`, `rating`, `review`
16. **certificates**: `id`, `student_id`, `type`, `conduct`, `issue_date`, `issued_by`

## 5. FOLDER STRUCTURE
```
school-management-system/
├── backend/ (Supabase migrations, functions, seed)
├── web/ (React Admin Dashboard)
│   ├── src/components/ (ui, dashboard, students, etc.)
│   ├── src/layouts/
│   ├── src/pages/
│   ├── src/lib/ (supabase.ts, utils.ts)
│   └── src/store/
├── mobile/ (React Native - Parents/Students/Teachers)
│   ├── src/components/
│   ├── src/navigation/
│   ├── src/screens/
│   ├── src/lib/
│   └── src/store/
└── shared/ (types, utils)
```

## 6. SECURITY & BEST PRACTICES
- **Row Level Security (RLS)**:
  - Admin: Full access
  - Parents: View own children
  - Teachers: View assigned students
  - Students: View own profile
- **Security Measures**:
  - Strong password requirements
  - JWT Session management
  - File upload restrictions (Virus scan, size limits)
  - API Rate limiting & Input validation

## 7. KEY IMPLEMENTATION DETAILS
- **Auto-Update Attendance**: Supabase Edge Function to process bulk uploads.
- **Report Card Generation**: Database Trigger checks if all marks are entered.
- **Fee Payment Notification**: Real-time subscription triggers notifications.

## 8. UI/UX DESIGN SYSTEM (Detailed guidance in `uiux.md`)
### Admin Web App (Apple-Inspired)
- **Philosophy**: Minimalism, White Space, Typography, Subtle Animations.
- **Colors**: 
  - Brand Primary: #007AFF (Apple Blue)
  - Secondary: #5856D6 (Purple)
  - Background: #FFFFFF (Primary), #F5F5F7 (Secondary)
  - Text: #1D1D1F (Primary), #86868B (Secondary)
- **Typography**: SF Pro Display / Inter.
- **Components**:
  - **Sidebar**: Fixed left, clean separation.
  - **Cards**: Minimal border, subtle shadow.
  - **Tables**: Clean rows, clear headers.

### Mobile App
- **Design**: Modern, colorful, easy navigation.
- **Bottom Tabs**: Large, accessible.
- **Features**: Gestures (Swipe, pull-to-refresh), Offline Support.

## 9. DEVELOPMENT ROADMAP
- **Phase 1**: Foundation (Supabase, Auth, RLS, Layouts)
- **Phase 2**: Admin Core (Dashboard, Profiles, Academic Years)
- **Phase 3**: Academic Features (Attendance, Exams, Marks, Fees)
- **Phase 4**: Mobile Apps (Parent & Teacher apps)
- **Phase 5**: Advanced Features (Calendar, Certifications, Analytics)
- **Phase 6**: Testing & Deployment
