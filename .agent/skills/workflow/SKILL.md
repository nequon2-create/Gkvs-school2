---
name: Step-by-Step Build Workflow
description: Comprehensive phase-by-phse workflow for building the School Management System, ensuring a structured and error-free development process.
---

# 🎯 AI AGENT STEP-BY-STEP BUILD WORKFLOW

This skill outlines the strict workflow to follow when building the School Management System. It ensures that development is phased, tested, and verified at every step.

## ⚠️ CRITICAL RULES FOR AI AGENT

### NEVER DO THIS:
❌ Don't build everything at once
❌ Don't skip phases
❌ Don't write code before completing current phase
❌ Don't move to next phase until current is 100% complete
❌ Don't hallucinate features not in requirements
❌ Don't assume database structure without confirmation
❌ Don't create files without proper folder structure first

### ALWAYS DO THIS:
✅ Complete one phase entirely before moving to next
✅ Ask for confirmation after each major milestone
✅ Test each component before moving forward
✅ Document what you built in each phase
✅ Follow the exact order given below
✅ Verify file structure before writing code
✅ Create small, focused components

---

## 📋 PHASE-BY-PHASE WORKFLOW

### PHASE 0: FOUNDATION SETUP
**Goal:** Create the project skeleton without any logic.
- **Step 0.1:** Initialize Monorepo (Turborepo, pnpm)
- **Step 0.2:** Create Apps Folder Structure (`apps/web`, `apps/mobile`)
- **Step 0.3:** Create Packages Folder Structure (`packages/ui`, `packages/database`, etc.)
- **Step 0.4:** Create Supabase Folder Structure (`supabase/migrations`, etc.)
- **Step 0.5:** Setup Configuration Files (`.env`, `eslint`, `tailwind`, `typescript`)

### PHASE 1: DATABASE FOUNDATION
**Goal:** Build complete database schema before any frontend.
- **Step 1.1:** Plan Database Schema (Tables & Relationships)
- **Step 1.2:** Create Migration Files (Table by Table)
- **Step 1.3:** Create Row Level Security (RLS) Policies
- **Step 1.4:** Create Database Functions
- **Step 1.5:** Create Database Triggers
- **Step 1.6:** Create Indexes for Performance
- **Step 1.7:** Generate TypeScript Types
- **Step 1.8:** Create Seed Data (Optional)

### PHASE 2: SHARED PACKAGES
**Goal:** Create reusable code that both web and mobile will use.
- **Step 2.1:** Database Package (Types, Schemas)
- **Step 2.2:** Utils Package (Date, String, Validation, Calculations)
- **Step 2.3:** Auth Package (Supabase Client, Hooks, Session, Permissions)
- **Step 2.4:** UI Package - Atoms (Button, Input, Card, etc.)
- **Step 2.5:** UI Package - Molecules (FormField, SearchBar, StatCard, etc.)

### PHASE 3: ADMIN WEB APP - AUTHENTICATION
**Goal:** Build complete login/logout before any features.
- **Step 3.1:** Setup Next.js Web App
- **Step 3.2:** Create Basic Layouts
- **Step 3.3:** Build Authentication Pages (Login)
- **Step 3.4:** Connect Authentication to Supabase
- **Step 3.5:** Implement Protected Routes
- **Step 3.6:** Create Basic Dashboard Layout (Sidebar)

### PHASE 4: ADMIN WEB APP - HOME DASHBOARD
**Goal:** Build first complete feature to establish patterns.
- **Step 4.1:** Plan Dashboard Components
- **Step 4.2:** Create Fee Collection Card
- **Step 4.3:** Create Student Statistics Graph
- **Step 4.4:** Create Teacher Attendance Graph
- **Step 4.5:** Create School Calendar Widget
- **Step 4.6:** Create Fee Notifications Panel
- **Step 4.7:** Assemble Dashboard Page

### PHASE 5: ADMIN WEB APP - ACADEMIC YEARS
**Goal:** Complete CRUD for academic years.
- **Step 5.1:** Create Academic Year List View
- **Step 5.2:** Create New Academic Year Form
- **Step 5.3:** Create Year Details Panel
- **Step 5.4:** Add Search and Filter
- **Step 5.5:** Assemble Academic Years Page

### PHASE 6: ADMIN WEB APP - PROFILE CREATION
**Goal:** Build profile creation with photo upload.
- **Step 6.1:** Create Profile Type Toggle
- **Step 6.2:** Create Student Form (incl. Photo Upload)
- **Step 6.3:** Create Teacher Form
- **Step 6.4:** Assemble Create Profile Page

### PHASE 7: ADMIN WEB APP - STUDENT & TEACHER LISTS
**Goal:** Display and search students/teachers.
- **Step 7.1:** Create Student List
- **Step 7.2:** Add Student Filters
- **Step 7.3:** Add Student Search
- **Step 7.4:** Create Teacher List
- **Step 7.5:** Add Profile Navigation (Clickable Cards)
- **Step 7.6:** Assemble Students/Teachers Pages

### PHASE 8: ADMIN WEB APP - ATTENDANCE MANAGEMENT
**Goal:** Attendance viewing and bulk upload.
- **Step 8.1:** Create Attendance Graph View
- **Step 8.2:** Create Attendance Filters
- **Step 8.3:** Create Attendance Statistics
- **Step 8.4:** Create Bulk Upload Modal (Excel Parser)
- **Step 8.5:** Implement Bulk Upload Logic
- **Step 8.6:** Assemble Attendance Page

### PHASE 9: ADMIN WEB APP - EXAM MANAGEMENT
**Goal:** Create and publish exams.
- **Step 9.1:** Create Exam List
- **Step 9.2:** Create Exam Form
- **Step 9.3:** Implement Exam Publishing (Notifications)
- **Step 9.4:** Create Exam Card
- **Step 9.5:** Assemble Exam Page

### PHASE 10: ADMIN WEB APP - MARKS ENTRY
**Goal:** Marks entry and report card generation.
- **Step 10.1:** Create Marks Entry Table
- **Step 10.2:** Create Marks Filters
- **Step 10.3:** Implement Individual Marks Entry
- **Step 10.4:** Create Bulk Marks Upload
- **Step 10.5:** Create Report Card Generator (Supabase Function)
- **Step 10.6:** Assemble Marks Page

### PHASE 11: ADMIN WEB APP - PROFILES
**Goal:** View and edit student/teacher profiles.
- **Step 11.1:** Create Student Profile View
- **Step 11.2:** Add Edit Capability
- **Step 11.3:** Create PDF Export
- **Step 11.4:** Create Teacher Profile View
- **Step 11.5:** Assemble Profiles Page

### PHASE 12: ADMIN WEB APP - CERTIFICATION
**Goal:** Generate certificates.
- **Step 12.1:** Create Certificate Form
- **Step 12.2:** Create Auto-Fill Logic
- **Step 12.3:** Create Certificate Template (Live Preview)
- **Step 12.4:** Generate Certificate PDF
- **Step 12.5:** Assemble Certification Page

### PHASE 13: ADMIN WEB APP - BILLING
**Goal:** Fee billing and receipts.
- **Step 13.1:** Create Billing Form
- **Step 13.2:** Display Fee Status
- **Step 13.3:** Create Payment Entry
- **Step 13.4:** Generate Receipt
- **Step 13.5:** Update Fee Records
- **Step 13.6:** Create Fee History
- **Step 13.7:** Assemble Billing Page

### PHASE 14: ADMIN WEB APP - SCHOOL SETTINGS
**Goal:** Configure school-wide settings.
- **Step 14.1:** Create Fee Structure Configuration
- **Step 14.2:** Add Other Settings
- **Step 14.3:** Assemble Settings Page

### PHASE 15: MOBILE APP - FOUNDATION
**Goal:** Initialize Expo app with navigation.
- **Step 15.1:** Initialize Expo App
- **Step 15.2:** Setup TypeScript and Config
- **Step 15.3:** Create Navigation Structure (Root, Auth, Role-based)
- **Step 15.4:** Create Bottom Tab Navigation
- **Step 15.5:** Create Placeholder Screens

### PHASE 16: MOBILE APP - AUTHENTICATION
**Goal:** Complete login flow for mobile.
- **Step 16.1:** Create Login Screen UI
- **Step 16.2:** Setup Supabase for Mobile
- **Step 16.3:** Implement Login Logic (Role-based Redirect)
- **Step 16.4:** Implement Session Persistence
- **Step 16.5:** Add Logout Functionality

### PHASE 17: MOBILE APP - PARENT HOME SCREEN
**Goal:** Complete parent home screen.
- **Step 17.1:** Create Pending Payments Banner
- **Step 17.2:** Create Leaderboard
- **Step 17.3:** Create Teacher Cards (Star Rating)
- **Step 17.4:** Create Notifications
- **Step 17.5:** Assemble Home Screen

### PHASE 18: MOBILE APP - PARENT EVENTS & CALENDAR
**Goal:** Complete events and calendar screens.
- **Step 18.1:** Create Calendar View
- **Step 18.2:** Create Events List
- **Step 18.3:** Create Event Details
- **Step 18.4:** Assemble Events Screen

### PHASE 19: MOBILE APP - PARENT EXAMS & PROFILE
**Goal:** Complete remaining parent screens.
- **Step 19.1:** Create Exams Screen
- **Step 19.2:** Create Student Profile (Graphs)
- **Step 19.3:** Add Logout
- **Step 19.4:** Final Testing (Parent App)

### PHASE 20: MOBILE APP - TEACHER SCREENS
**Goal:** Complete teacher app.
- **Step 20.1:** Create Teacher Home Screen (Homework, Leaderboard)
- **Step 20.2:** Create Teacher Events Screen
- **Step 20.3:** Create Attendance Screen (Marking)
- **Step 20.4:** Create Teacher Profile (Graphs, Ratings)
- **Step 20.5:** Final Testing (Teacher App)

### PHASE 21: NOTIFICATIONS & REAL-TIME
**Goal:** Setup push notifications and real-time updates.
- **Step 21.1:** Setup Push Notifications
- **Step 21.2:** Create Notification Functions (Edge Functions)
- **Step 21.3:** Setup Real-Time Subscriptions

### PHASE 22: TESTING & BUG FIXES
**Goal:** Quality Assurance.
- **Step 22.1:** Admin Web App Testing
- **Step 22.2:** Mobile App Testing
- **Step 22.3:** Integration Testing
- **Step 22.4:** Security Testing

### PHASE 23: DEPLOYMENT
**Goal:** Deploy to production.
- **Step 23.1:** Prepare for Deployment
- **Step 23.2:** Deploy Web App
- **Step 23.3:** Deploy Mobile Apps
- **Step 23.4:** Setup Monitoring

---

## 🎯 SUCCESS CRITERIA

Each phase is only complete when:
- ✅ All code compiles without errors
- ✅ All features work as specified
- ✅ All tests pass
- ✅ No console errors
- ✅ User confirms phase is complete
