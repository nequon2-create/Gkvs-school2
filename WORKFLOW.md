🎯 AI AGENT STEP-BY-STEP BUILD WORKFLOW
⚠️ CRITICAL RULES FOR AI AGENT
NEVER DO THIS:
❌ Don't build everything at once
 ❌ Don't skip phases
 ❌ Don't write code before completing current phase
 ❌ Don't move to next phase until current is 100% complete
 ❌ Don't hallucinate features not in requirements
 ❌ Don't assume database structure without confirmation
 ❌ Don't create files without proper folder structure first
ALWAYS DO THIS:
✅ Complete one phase entirely before moving to next
 ✅ Ask for confirmation after each major milestone
 ✅ Test each component before moving forward
 ✅ Document what you built in each phase
 ✅ Follow the exact order given below
 ✅ Verify file structure before writing code
 ✅ Create small, focused components

📋 PHASE-BY-PHASE WORKFLOW

PHASE 0: FOUNDATION SETUP
Duration: Setup Only
Goal: Create the project skeleton without any logic
Step 0.1: Initialize Monorepo
Create root folder school-management-system
Initialize with pnpm init
Create pnpm-workspace.yaml file
Create turbo.json configuration
Create .gitignore file
Create root package.json with workspaces
STOP - Verify folder exists and configs are correct
Step 0.2: Create Apps Folder Structure
Create apps/ directory
Create apps/web/ directory
Create apps/mobile/ directory
Inside each, create basic folder structure:
src/
public/ (web only)
assets/ (mobile only)
STOP - Verify all folders exist
Step 0.3: Create Packages Folder Structure
Create packages/ directory
Create these subdirectories:
packages/ui/
packages/database/
packages/config/
packages/utils/
packages/auth/
packages/types/
Inside each package create:
src/ folder
package.json
tsconfig.json
STOP - Verify all package folders exist
Step 0.4: Create Supabase Folder Structure
Create supabase/ directory at root
Create these subdirectories:
supabase/migrations/
supabase/functions/
supabase/seed/
supabase/tests/
Create config.toml file
STOP - Verify Supabase structure is ready
Step 0.5: Setup Configuration Files
Create root .env.example with all required variables
Create .env.local for web app
Create .env for mobile app
Create ESLint config in packages/config/eslint/
Create Tailwind config in packages/config/tailwind/
Create TypeScript configs in packages/config/typescript/:
base.json
nextjs.json
react-native.json
STOP - Verify all config files exist and are valid
Checkpoint 0:
[ ] Monorepo structure exists
[ ] All main folders created
[ ] All config files in place
[ ] No code written yet, only structure
[ ] Get confirmation before proceeding

PHASE 1: DATABASE FOUNDATION
Duration: Database Only
Goal: Build complete database schema before any frontend
Step 1.1: Plan Database Schema
Review all requirements from document
List all tables needed:
users
students
teachers
parents
classes
subjects
attendance
exams
marks
fees
events
notifications
homework
teacher_ratings
certificates
academic_years
Document relationships between tables
STOP - Get schema approval before writing SQL
Step 1.2: Create Migration Files (One Table at a Time)
Create 001_users_table.sql - ONLY users table
STOP - Test this migration in Supabase
Create 002_academic_years.sql - ONLY academic years
STOP - Test this migration
Create 003_classes.sql - ONLY classes
STOP - Test this migration
Create 004_students.sql - ONLY students
STOP - Test this migration
Create 005_teachers.sql - ONLY teachers
STOP - Test this migration
Create 006_parents.sql - ONLY parents
STOP - Test this migration
Create 007_subjects.sql - ONLY subjects
STOP - Test this migration
Create 008_attendance.sql - ONLY attendance
STOP - Test this migration
Create 009_exams.sql - ONLY exams
STOP - Test this migration
Create 010_marks.sql - ONLY marks
STOP - Test this migration
Create 011_fee_structure.sql - fee tables
STOP - Test this migration
Create 012_events.sql - ONLY events
STOP - Test this migration
Create 013_homework.sql - ONLY homework
STOP - Test this migration
Create 014_notifications.sql - ONLY notifications
STOP - Test this migration
Create 015_teacher_ratings.sql - ONLY ratings
STOP - Test this migration
Create 016_certificates.sql - ONLY certificates
STOP - Test this migration
Step 1.3: Create Row Level Security (RLS) Policies
Create 020_rls_students.sql - RLS for students table only
STOP - Test these policies
Create 021_rls_teachers.sql - RLS for teachers table only
STOP - Test these policies
Create 022_rls_attendance.sql - RLS for attendance
STOP - Test these policies
Create 023_rls_marks.sql - RLS for marks
STOP - Test these policies
Continue for each table with RLS needs
STOP - Verify all RLS policies work correctly
Step 1.4: Create Database Functions
Create 030_function_auto_update_attendance.sql
STOP - Test this function
Create 031_function_generate_report_card.sql
STOP - Test this function
Create 032_function_calculate_attendance_percentage.sql
STOP - Test this function
Create 033_function_calculate_grades.sql
STOP - Test this function
Step 1.5: Create Database Triggers
Create 040_trigger_update_attendance_on_insert.sql
STOP - Test this trigger
Create 041_trigger_generate_report_on_marks_complete.sql
STOP - Test this trigger
Create 042_trigger_send_notification_on_fee_payment.sql
STOP - Test this trigger
Step 1.6: Create Indexes for Performance
Create 050_indexes_students.sql
Create 051_indexes_attendance.sql
Create 052_indexes_marks.sql
STOP - Verify indexes improve query performance
Step 1.7: Generate TypeScript Types
Run Supabase CLI to generate types
Place generated types in packages/database/src/types/database.types.ts
STOP - Verify types are generated correctly
Step 1.8: Create Seed Data (Optional)
Create seed/01_academic_years.sql with sample year
Create seed/02_classes.sql with sample classes
Create seed/03_subjects.sql with sample subjects
STOP - Don't seed students/teachers yet
Checkpoint 1:
[ ] All database tables created
[ ] All RLS policies active
[ ] All functions working
[ ] All triggers tested
[ ] TypeScript types generated
[ ] Database fully functional
[ ] Get confirmation before proceeding to shared packages

PHASE 2: SHARED PACKAGES (Build Foundation Before Apps)
Duration: Shared Code Only
Goal: Create reusable code that both web and mobile will use
Step 2.1: Database Package
In packages/database/src/types/:
Create student.types.ts with Student interfaces
STOP - Verify types compile
Create teacher.types.ts with Teacher interfaces
STOP - Verify types compile
Create attendance.types.ts
STOP - Verify types compile
Create exam.types.ts
STOP - Verify types compile
Create fee.types.ts
STOP - Verify types compile
Create event.types.ts
STOP - Verify types compile
Create notification.types.ts
STOP - Verify types compile
Create barrel export in index.ts
STOP - Verify all types can be imported
Step 2.2: Database Package - Schemas
In packages/database/src/schemas/:
Create student.schema.ts with Zod validation
STOP - Test schema validation
Create teacher.schema.ts with Zod validation
STOP - Test schema validation
Create attendance.schema.ts
STOP - Test schema validation
Create exam.schema.ts
STOP - Test schema validation
Continue for all entities
Create barrel export
STOP - Verify all schemas validate correctly
Step 2.3: Utils Package
In packages/utils/src/date/:
Create formatDate.ts function
STOP - Test with sample dates
Create calculateAge.ts function
STOP - Test with sample dates
Create getAcademicYear.ts function
STOP - Test function
In packages/utils/src/string/:
Create slugify.ts
Create capitalize.ts
Create truncate.ts
In packages/utils/src/validation/:
Create email.ts validator
Create phone.ts validator
Create registrationNumber.ts validator
In packages/utils/src/calculations/:
Create attendance.ts (calculate percentage)
STOP - Test with sample data
Create grades.ts (calculate grade from marks)
STOP - Test with sample data
Create fees.ts (calculate pending amount)
STOP - Test with sample data
Create barrel exports
STOP - Verify all utils work independently
Step 2.4: Auth Package
Create packages/auth/src/lib/supabase.ts:
Setup Supabase client configuration
STOP - Test connection
Create packages/auth/src/hooks/useAuth.ts:
Basic auth hook structure
STOP - Don't implement yet, just types
Create packages/auth/src/utils/session.ts:
Session management utilities
Create packages/auth/src/utils/permissions.ts:
Role-based permission checks
STOP - Test permission logic
Step 2.5: UI Package - Atoms (Basic Components Only)
Create packages/ui/src/components/Button/:
Create Button.tsx component
Create Button.types.ts
Create barrel export
STOP - Build and test Button in isolation
Create packages/ui/src/components/Input/:
Create Input.tsx
Create Input.types.ts
STOP - Test Input component
Create packages/ui/src/components/Card/:
Create Card.tsx
STOP - Test Card component
Create packages/ui/src/components/Badge/:
Create Badge.tsx
STOP - Test Badge component
Create packages/ui/src/components/Avatar/:
Create Avatar.tsx
STOP - Test Avatar component
Create barrel export for all atoms
STOP - Verify all atoms render correctly
Step 2.6: UI Package - Molecules (Combinations)
Create packages/ui/src/components/FormField/:
Combine Input + Label + Error message
STOP - Test FormField
Create packages/ui/src/components/SearchBar/:
Combine Input + Search icon + Clear button
STOP - Test SearchBar
Create packages/ui/src/components/StatCard/:
Combine Icon + Title + Value + Trend
STOP - Test StatCard
STOP - Verify molecules work with atoms
Checkpoint 2:
[ ] Database package complete with types and schemas
[ ] Utils package complete with all helpers
[ ] Auth package foundation ready
[ ] UI package has working atoms and molecules
[ ] All packages compile without errors
[ ] All packages can be imported by apps
[ ] Get confirmation before building apps

PHASE 3: ADMIN WEB APP - AUTHENTICATION
Duration: Auth Flow Only
Goal: Build complete login/logout before any features
Step 3.1: Setup Next.js Web App
Initialize Next.js in apps/web/
Install dependencies (Next.js, React, TypeScript, Tailwind)
Configure next.config.js
Configure tailwind.config.js to use shared config
Configure tsconfig.json to use shared config and path aliases
STOP - Verify app starts with npm run dev
Step 3.2: Create Basic Layouts
Create apps/web/src/app/layout.tsx - Root layout only
Create apps/web/src/app/page.tsx - Simple redirect to login
STOP - Verify app renders
Step 3.3: Build Authentication Pages
Create apps/web/src/app/(auth)/login/page.tsx:
Import Button and Input from @school/ui
Create simple login form (email + password)
STOP - Verify form renders, no logic yet
Create apps/web/src/app/(auth)/layout.tsx:
Simple centered layout for auth pages
STOP - Verify layout works
Add form validation with react-hook-form and Zod
STOP - Verify validation works
STOP - Don't connect to Supabase yet
Step 3.4: Connect Authentication to Supabase
Create apps/web/src/lib/supabase.ts:
Import from @school/auth
Setup client-side Supabase client
STOP - Test connection
Create apps/web/src/hooks/useAuth.ts:
Implement login function
STOP - Test login with real user
Implement logout function
STOP - Test logout
Implement session check
STOP - Test session persistence
Connect login form to Supabase
STOP - Test complete login flow
Step 3.5: Implement Protected Routes
Create middleware for route protection
Test that unauthenticated users redirect to login
Test that authenticated admins can access dashboard
STOP - Verify auth flow is bulletproof
Step 3.6: Create Basic Dashboard Layout
Create apps/web/src/app/(dashboard)/layout.tsx:
Header with logo and logout button
Sidebar with navigation (empty links for now)
Main content area
STOP - Verify layout renders for authenticated users
Create apps/web/src/components/layouts/Sidebar.tsx:
List of 11 navigation items (Home, Academic Years, etc.)
No functionality yet, just UI
STOP - Verify sidebar looks good
Checkpoint 3:
[ ] Web app initialized and running
[ ] Login page complete and working
[ ] Supabase authentication connected
[ ] Protected routes working
[ ] Basic dashboard layout created
[ ] Sidebar navigation visible
[ ] Can login and see dashboard
[ ] Can logout and return to login
[ ] Get confirmation before building features

PHASE 4: ADMIN WEB APP - HOME DASHBOARD
Duration: Dashboard Page Only
Goal: Build first complete feature to establish patterns
Step 4.1: Plan Dashboard Components
List what needs to be displayed:
Fee collection card
Student statistics graph
Teacher attendance graph
School calendar widget
Fee payment notifications
STOP - Get confirmation on design approach
Step 4.2: Create Fee Collection Card
Create apps/web/src/components/features/dashboard/FeeCollectionCard.tsx:
Display year-wise total (static data first)
STOP - Verify component renders
Create hook apps/web/src/hooks/useFees.ts:
Fetch total fees from Supabase
STOP - Test data fetching
Connect component to real data
STOP - Verify real data displays
Add click handler to show detailed table
STOP - Test interaction
Step 4.3: Create Student Statistics Graph
Install Recharts library
Create apps/web/src/components/features/dashboard/StudentStatsGraph.tsx:
Create static bar chart (boys vs girls)
STOP - Verify chart renders
Create hook apps/web/src/hooks/useStudentStats.ts:
Fetch student count by gender
STOP - Test data fetching
Connect real data to chart
STOP - Verify chart updates with real data
Add filtering by month/year
STOP - Test filters
Step 4.4: Create Teacher Attendance Graph
Create apps/web/src/components/features/dashboard/AttendanceGraph.tsx:
Create line chart for monthly attendance
STOP - Verify chart renders
Create hook apps/web/src/hooks/useTeacherAttendance.ts:
Fetch teacher attendance data
STOP - Test data
Connect to real data
STOP - Verify chart accuracy
Step 4.5: Create School Calendar Widget
Create apps/web/src/components/features/dashboard/SchoolCalendar.tsx:
Display upcoming events and holidays
STOP - Verify renders with static data
Create hook apps/web/src/hooks/useEvents.ts:
Fetch events from database
STOP - Test data fetching
Connect to real data
STOP - Verify events display correctly
Step 4.6: Create Fee Notifications Panel
Create apps/web/src/components/features/dashboard/FeeNotifications.tsx:
Scrollable list of recent payments
STOP - Verify UI
Setup real-time subscription for fee payments:
Use Supabase real-time
STOP - Test real-time updates
Display notifications
STOP - Verify notifications appear in real-time
Step 4.7: Assemble Dashboard Page
Create apps/web/src/app/(dashboard)/home/page.tsx:
Import all dashboard components
Layout in responsive grid
STOP - Verify all components render together
Test responsiveness on different screen sizes
STOP - Verify dashboard is fully functional
Checkpoint 4:
[ ] Dashboard page complete
[ ] All widgets display real data
[ ] Charts render correctly
[ ] Real-time notifications work
[ ] Filters work properly
[ ] Page is responsive
[ ] No errors in console
[ ] Get confirmation before next feature

PHASE 5: ADMIN WEB APP - ACADEMIC YEARS
Duration: Academic Years Feature Only
Goal: Complete CRUD for academic years
Step 5.1: Create Academic Year List View
Create apps/web/src/components/features/academic-years/AcademicYearList.tsx:
Table showing all academic years
STOP - Verify table renders with static data
Create hook apps/web/src/hooks/useAcademicYears.ts:
Fetch all academic years
STOP - Test data fetching
Connect to real data
STOP - Verify years display
Step 5.2: Create New Academic Year Form
Create apps/web/src/components/features/academic-years/CreateYearModal.tsx:
Form with year name, start date, end date
STOP - Verify form renders
Add validation with Zod schema
STOP - Test validation
Create submit handler:
Insert into Supabase
STOP - Test year creation
Add auto-transition logic (set is_current flag)
STOP - Test transition
Step 5.3: Create Year Details Panel
Create apps/web/src/components/features/academic-years/YearDetailsPanel.tsx:
Show year statistics (students, fees, etc.)
STOP - Verify panel renders
Fetch year-specific data:
Total students in that year
Total fees collected
Attendance summary
STOP - Verify data accuracy
Step 5.4: Add Search and Filter
Add search input to filter years
STOP - Test search
Add filter by status (current/past)
STOP - Test filter
Step 5.5: Assemble Academic Years Page
Create apps/web/src/app/(dashboard)/academic-years/page.tsx:
Combine list, create modal, details panel
STOP - Verify page works end-to-end
Checkpoint 5:
[ ] Can view all academic years
[ ] Can create new academic year
[ ] Can view year details
[ ] Search and filter work
[ ] Academic year transition works
[ ] Get confirmation before next feature

PHASE 6: ADMIN WEB APP - STUDENT/TEACHER PROFILE CREATION
Duration: Profile Creation Only
Goal: Build profile creation with photo upload
Step 6.1: Create Profile Type Toggle
Create apps/web/src/components/features/create-profile/ProfileTypeToggle.tsx:
Switch between Student/Teacher
STOP - Verify toggle works
Step 6.2: Create Student Form
Create apps/web/src/components/features/students/CreateStudentForm.tsx:
All fields from requirements (name, DOB, class, etc.)
STOP - Verify form renders
Add photo upload:
Setup Supabase Storage bucket
STOP - Test storage bucket
Create upload component
STOP - Test photo upload
Add validation with Zod
STOP - Test all validations
Generate registration number automatically
STOP - Test number generation
Create password generation
STOP - Test password creation
Create submit handler:
Create user in auth
Insert student record
Upload photo
STOP - Test complete student creation
Step 6.3: Create Teacher Form
Create apps/web/src/components/features/teachers/CreateTeacherForm.tsx:
Teacher-specific fields (subjects, qualification, etc.)
STOP - Verify form renders
Reuse photo upload component
Add validation
STOP - Test validation
Generate teacher registration number
STOP - Test generation
Create submit handler
STOP - Test teacher creation
Step 6.4: Assemble Create Profile Page
Create apps/web/src/app/(dashboard)/create-profile/page.tsx:
Toggle + conditional form rendering
STOP - Verify both forms work
Add success notifications
Add error handling
STOP - Test error scenarios
Checkpoint 6:
[ ] Can create student profiles
[ ] Can create teacher profiles
[ ] Photo upload works
[ ] Registration numbers generated
[ ] Passwords created
[ ] Profiles saved to database
[ ] Forms validate correctly
[ ] Get confirmation before next feature

PHASE 7: ADMIN WEB APP - STUDENT & TEACHER LISTS
Duration: List Views Only
Goal: Display and search students/teachers
Step 7.1: Create Student List
Create apps/web/src/components/features/students/StudentCard.tsx:
WhatsApp-style card with photo, name, class
STOP - Verify card renders
Create apps/web/src/components/features/students/StudentListTable.tsx:
Grid of student cards
STOP - Verify grid renders with static data
Create hook apps/web/src/hooks/useStudents.ts:
Fetch all students
STOP - Test data fetching
Connect to real data
STOP - Verify students display
Step 7.2: Add Student Filters
Create apps/web/src/components/features/students/StudentFilters.tsx:
Filter by class
STOP - Test class filter
Filter by section
STOP - Test section filter
Filter by academic year
STOP - Test year filter
Connect filters to list
STOP - Verify filtering works
Step 7.3: Add Student Search
Add search input
Search by:
Registration number
Name
Parent phone
STOP - Test all search types
Step 7.4: Create Teacher List
Create apps/web/src/components/features/teachers/TeacherCard.tsx:
Similar to student card
STOP - Verify renders
Create teacher list view
STOP - Verify list displays
Add teacher filters and search
STOP - Test filters
Step 7.5: Add Profile Navigation
Make cards clickable
Navigate to profile page (create placeholder)
STOP - Test navigation
Step 7.6: Assemble Students/Teachers Pages
Create apps/web/src/app/(dashboard)/students/page.tsx
Create apps/web/src/app/(dashboard)/teachers/page.tsx
STOP - Verify both pages work
Checkpoint 7:
[ ] Student list displays all students
[ ] Teacher list displays all teachers
[ ] Filters work correctly
[ ] Search works for all criteria
[ ] Cards are clickable
[ ] Lists are performant with many records
[ ] Get confirmation before next feature

PHASE 8: ADMIN WEB APP - ATTENDANCE MANAGEMENT
Duration: Attendance Feature Only
Goal: Attendance viewing and bulk upload
Step 8.1: Create Attendance Graph View
Create apps/web/src/components/features/attendance/AttendanceGraph.tsx:
Monthly class-wise bar chart
STOP - Verify chart renders
Create hook apps/web/src/hooks/useAttendance.ts:
Fetch attendance data
STOP - Test data
Connect to real data
STOP - Verify accuracy
Step 8.2: Create Attendance Filters
Create apps/web/src/components/features/attendance/AttendanceFilters.tsx:
Year, class, month filters
STOP - Verify filters render
Connect filters to graph
STOP - Test filtering
Step 8.3: Create Attendance Statistics
Calculate and display:
Total present/absent
Boys present/absent
Girls present/absent
Average attendance percentage
STOP - Verify calculations
Step 8.4: Create Bulk Upload Modal
Create apps/web/src/components/features/attendance/BulkUploadModal.tsx:
File upload input
STOP - Verify modal opens
Add pre-upload form:
Select month
Select class
Select subject
STOP - Verify form works
Create Excel parser:
Parse uploaded file
Validate format
STOP - Test with sample Excel file
Create validation logic:
Check registration numbers exist
Check month is current or future
Check for duplicates
STOP - Test all validations
Step 8.5: Implement Bulk Upload Logic
Create Supabase function or API route:
Accept parsed data
Validate each record
Insert into attendance table
STOP - Test insertion
Trigger auto-update of student profiles:
Calculate new attendance percentage
Update student record
STOP - Test auto-update
Add progress indicator during upload
STOP - Test with large file
Step 8.6: Assemble Attendance Page
Create apps/web/src/app/(dashboard)/attendance/page.tsx:
Left: Graphs and stats
Right: Bulk upload button
STOP - Verify layout
Test complete flow:
Upload → Validate → Insert → Update profiles
STOP - Test end-to-end
Checkpoint 8:
[ ] Attendance graphs display correctly
[ ] Filters work
[ ] Statistics are accurate
[ ] Bulk upload accepts Excel files
[ ] Validation prevents bad data
[ ] Attendance records created
[ ] Student profiles auto-update
[ ] Get confirmation before next feature

PHASE 9: ADMIN WEB APP - EXAM MANAGEMENT
Duration: Exam Feature Only
Goal: Create and publish exams
Step 9.1: Create Exam List
Create apps/web/src/components/features/exams/ExamList.tsx:
Show past and live exams
STOP - Verify list renders
Create hook apps/web/src/hooks/useExams.ts:
Fetch exams
STOP - Test data
Step 9.2: Create Exam Form
Create apps/web/src/components/features/exams/CreateExamModal.tsx:
Exam name, type, date, time, class
STOP - Verify form renders
Add validation
STOP - Test validation
Create submit handler:
Insert exam
Set published flag
STOP - Test exam creation
Step 9.3: Implement Exam Publishing
When exam is published:
Create notifications for parents
Create notifications for teachers
Create notifications for students
STOP - Test notifications created
Verify notifications appear in respective apps
STOP - Test notification delivery
Step 9.4: Create Exam Card
Create apps/web/src/components/features/exams/ExamCard.tsx:
Display exam details
Show published status
STOP - Verify card renders
Step 9.5: Assemble Exam Page
Create apps/web/src/app/(dashboard)/exams/page.tsx:
List on left
Create button on right
STOP - Verify page works
Checkpoint 9:
[ ] Can view all exams
[ ] Can create new exam
[ ] Exam publishes to all users
[ ] Notifications sent
[ ] Get confirmation before next feature

PHASE 10: ADMIN WEB APP - MARKS ENTRY
Duration: Marks Feature Only
Goal: Marks entry and report card generation
Step 10.1: Create Marks Entry Table
Create apps/web/src/components/features/marks/MarksEntryTable.tsx:
Student list with marks columns
STOP - Verify table renders
Step 10.2: Create Marks Filters
Create apps/web/src/components/features/marks/MarksFilters.tsx:
Year, exam, class, subject filters
STOP - Test filters
Connect to table
STOP - Verify filtered data displays
Step 10.3: Implement Individual Marks Entry
Make marks cells editable
Save on blur:
Update marks in database
STOP - Test individual update
Trigger report card check:
If all subjects have marks, generate report
STOP - Test trigger
Step 10.4: Create Bulk Marks Upload
Create apps/web/src/components/features/marks/BulkMarksUpload.tsx:
Similar to attendance upload
STOP - Verify modal works
Parse Excel file
STOP - Test parsing
Validate registration numbers
STOP - Test validation
Insert marks:
Batch insert all marks
STOP - Test insertion
Trigger report card generation for completed students
STOP - Test auto-generation
Step 10.5: Create Report Card Generator
Create Supabase function generate_report_card:
Fetch all marks for student/exam
Calculate totals, percentages, grades
Store as JSON or PDF
STOP - Test generation
Mark report card as available in student profile
STOP - Test profile update
Step 10.6: Assemble Marks Page
Create apps/web/src/app/(dashboard)/marks/page.tsx:
Filters at top
Table in middle
Bulk upload button at right
STOP - Verify complete flow
Checkpoint 10:
[ ] Can view student marks
[ ] Can enter marks individually
[ ] Can upload marks in bulk
[ ] Report cards auto-generate
[ ] Student profiles update
[ ] Get confirmation before next feature

PHASE 11: ADMIN WEB APP - PROFILES
Duration: Profile Viewing Only
Goal: View and edit student/teacher profiles
Step 11.1: Create Student Profile View
Create apps/web/src/components/features/students/StudentProfile.tsx:
All student information displayed
STOP - Verify profile renders
Fetch student data by ID:
STOP - Test data fetching
Display all connected data:
Attendance records
Marks history
Fee status
STOP - Verify all data displays
Step 11.2: Add Edit Capability
Add edit mode toggle
Make fields editable
Save changes to database
STOP - Test editing
Step 11.3: Create PDF Export
Create apps/web/src/lib/pdf-generator.ts:
Use library like jsPDF or react-pdf
STOP - Test PDF generation
Add "Download Full Profile" button
STOP - Test download
Add "Download Marks Card Only" button
STOP - Test download
Step 11.4: Create Teacher Profile View
Similar to student profile
Show teacher-specific data:
Classes taught
Subjects
Student ratings
STOP - Verify renders
Step 11.5: Assemble Profiles Page
Create apps/web/src/app/(dashboard)/profiles/page.tsx:
Two tabs: Students | Teachers
Search and filter
Click to view profile
STOP - Verify navigation
Checkpoint 11:
[ ] Can view any student profile
[ ] Can view any teacher profile
[ ] Can edit profiles
[ ] Can download PDFs
[ ] All profile data accurate
[ ] Get confirmation before next feature

PHASE 12: ADMIN WEB APP - CERTIFICATION
Duration: Certification Feature Only
Goal: Generate certificates
Step 12.1: Create Certificate Form
Create apps/web/src/components/features/certification/CertificateForm.tsx:
Registration number input
Certificate type dropdown
Conduct rating
STOP - Verify form renders
Step 12.2: Create Auto-Fill Logic
On registration number entry:
Fetch student details
Auto-populate form
STOP - Test auto-fill
Step 12.3: Create Certificate Template
Create apps/web/src/components/features/certification/CertificateTemplate.tsx:
Design certificate layout
STOP - Verify template renders
Create live preview:
Show certificate as form is filled
STOP - Test preview updates
Step 12.4: Generate Certificate PDF
Add "Generate PDF" button
Create PDF from template
STOP - Test PDF generation
Save to database:
Store certificate record
STOP - Test save
Step 12.5: Assemble Certification Page
Create apps/web/src/app/(dashboard)/certification/page.tsx:
Form on left
Preview on right
STOP - Verify layout
Checkpoint 12:
[ ] Can generate certificates
[ ] Auto-fill works
[ ] Preview updates in real-time
[ ] PDF downloads correctly
[ ] Certificates saved to database
[ ] Get confirmation before next feature

PHASE 13: ADMIN WEB APP - BILLING
Duration: Billing Feature Only
Goal: Fee billing and receipts
Step 13.1: Create Billing Form
Create apps/web/src/components/features/billing/BillingForm.tsx:
Registration number input
STOP - Verify form renders
Step 13.2: Display Fee Status
On registration number entry:
Fetch student fee records
Display total, paid, pending
STOP - Test display
Step 13.3: Create Payment Entry
Add amount paid input
Calculate new pending amount
Create receipt preview
STOP - Test calculation
Step 13.4: Generate Receipt
Create apps/web/src/components/features/billing/PaymentReceiptPDF.tsx:
Receipt template with all details
STOP - Test template
Generate and download PDF
STOP - Test PDF
Step 13.5: Update Fee Records
On payment submission:
Insert payment record
Update student_fees table
Update student profile
STOP - Test all updates
Send notification to parent
STOP - Test notification
Step 13.6: Create Fee History
Create apps/web/src/components/features/billing/FeeHistory.tsx:
Show all past payments
STOP - Verify history displays
Step 13.7: Assemble Billing Page
Create apps/web/src/app/(dashboard)/billing/page.tsx:
Form at top
History at bottom
STOP - Verify complete flow
Checkpoint 13:
[ ] Can check fee status
[ ] Can record payments
[ ] Receipts generate correctly
[ ] Database updates properly
[ ] Notifications sent
[ ] Fee history displays
[ ] Get confirmation before next feature

PHASE 14: ADMIN WEB APP - SCHOOL SETTINGS
Duration: Settings Only
Goal: Configure school-wide settings
Step 14.1: Create Fee Structure Configuration
Create settings form:
Class selection
Fee amount input
STOP - Verify form
Save fee structure:
Insert into fee_structure table
STOP - Test save
Apply to existing students:
Update student_fees for that class
STOP - Test application
Step 14.2: Add Other Settings
School name and logo
Academic year settings
Notification preferences
STOP - Test each setting
Step 14.3: Assemble Settings Page
Create apps/web/src/app/(dashboard)/settings/page.tsx
STOP - Verify all settings work
Checkpoint 14:
[ ] Fee structure can be configured
[ ] Settings save correctly
[ ] Changes apply system-wide
[ ] Admin web app is COMPLETE
[ ] Get confirmation before mobile app

PHASE 15: MOBILE APP - FOUNDATION
Duration: Mobile Setup Only
Goal: Initialize Expo app with navigation
Step 15.1: Initialize Expo App
Run npx create-expo-app in apps/mobile/
Install dependencies (React Native, Expo Router, etc.)
Configure app.json
STOP - Verify app runs on simulator/device
Step 15.2: Setup TypeScript and Config
Configure tsconfig.json with path aliases
Setup babel.config.js
STOP - Verify TypeScript works
Step 15.3: Create Navigation Structure
Create src/navigation/RootNavigator.tsx:
Auth stack vs Main stack logic
STOP - Verify navigation skeleton
Create src/navigation/AuthNavigator.tsx:
Login screen route
STOP - Test navigation
Create role-based navigators:
ParentNavigator.tsx
TeacherNavigator.tsx
STOP - Verify both created
Step 15.4: Create Bottom Tab Navigation
For ParentNavigator:
4 tabs: Home, Events, Exams, Profile
STOP - Verify tabs render
For TeacherNavigator:
4 tabs: Home, Events, Attendance, Profile
STOP - Verify tabs render
Step 15.5: Create Placeholder Screens
Create all screen files with simple text:
src/screens/auth/LoginScreen.tsx
src/screens/parent/HomeScreen.tsx
src/screens/parent/EventsScreen.tsx
src/screens/parent/ExamsScreen.tsx
src/screens/parent/ProfileScreen.tsx
src/screens/teacher/HomeScreen.tsx
src/screens/teacher/EventsScreen.tsx
src/screens/teacher/AttendanceScreen.tsx
src/screens/teacher/ProfileScreen.tsx
STOP - Verify all screens accessible via navigation
Checkpoint 15:
[ ] Mobile app initialized
[ ] Navigation structure complete
[ ] All screens created as placeholders
[ ] Can navigate between screens
[ ] Get confirmation before building screens

PHASE 16: MOBILE APP - AUTHENTICATION
Duration: Mobile Auth Only
Goal: Complete login flow for mobile
Step 16.1: Create Login Screen UI
Create login form in LoginScreen.tsx:
Email input
Password input
Login button
STOP - Verify UI renders
Step 16.2: Setup Supabase for Mobile
Create src/lib/supabase.ts:
Configure Supabase client for React Native
STOP - Test connection
Step 16.3: Implement Login Logic
Create src/hooks/useAuth.ts:
Login function
STOP - Test login
Get user role
STOP - Test role detection
Navigate based on role:
Parent → ParentNavigator
Teacher → TeacherNavigator
STOP - Test navigation
Step 16.4: Implement Session Persistence
Store session in AsyncStorage
Check session on app launch
Auto-navigate if logged in
STOP - Test persistence
Step 16.5: Add Logout Functionality
Add logout in profile screens
STOP - Test logout
Checkpoint 16:
[ ] Login screen complete
[ ] Authentication works
[ ] Role-based navigation works
[ ] Session persists
[ ] Logout works
[ ] Get confirmation before parent features

PHASE 17: MOBILE APP - PARENT HOME SCREEN
Duration: Parent Home Only
Goal: Complete parent home screen
Step 17.1: Create Pending Payments Banner
Create src/components/features/parent/PendingPaymentsBanner.tsx:
Show pending amount
STOP - Verify renders
Fetch student fee data
STOP - Test data
Step 17.2: Create Leaderboard
Create src/components/features/parent/LeaderboardCard.tsx:
Display student rank
STOP - Verify renders
Fetch class rankings
STOP - Test data
Step 17.3: Create Teacher Cards
Create src/components/features/parent/TeacherCard.tsx:
Photo, name, subject, stars
STOP - Verify renders
Create star rating component:
Interactive stars
STOP - Test rating
Save rating to database
STOP - Test save
Step 17.4: Create Notifications
Fetch notifications from database
Display list
Make clickable:
Navigate based on notification type
STOP - Test navigation
Step 17.5: Assemble Home Screen
Complete HomeScreen.tsx:
All components in scrollable view
STOP - Verify complete home screen
Checkpoint 17:
[ ] Pending payments display
[ ] Leaderboard shows rank
[ ] Teacher cards render
[ ] Star rating works
[ ] Notifications clickable
[ ] Get confirmation before next parent screen

PHASE 18: MOBILE APP - PARENT EVENTS & CALENDAR
Duration: Events Screens Only
Goal: Complete events and calendar screens
Step 18.1: Create Calendar View
Install calendar library (react-native-calendars)
Create calendar component:
Mark event dates
Mark holidays
Mark exam dates
STOP - Verify calendar renders
Fetch events from database
STOP - Test data
Step 18.2: Create Events List
Create src/components/features/events/EventCard.tsx:
Event title, date, thumbnail
STOP - Verify card renders
Create scrollable list
STOP - Verify list
Add search functionality
STOP - Test search
Step 18.3: Create Event Details
Create event details screen:
Full images
Videos (if any)
Description
Links
STOP - Verify details screen
Step 18.4: Assemble Events Screen
Complete EventsScreen.tsx:
Two tabs: Calendar | Events
STOP - Verify both tabs work
Checkpoint 18:
[ ] Calendar displays marked dates
[ ] Events list shows all events
[ ] Search works
[ ] Event details open correctly
[ ] Get confirmation before next screen

PHASE 19: MOBILE APP - PARENT EXAMS & PROFILE
Duration: Remaining Parent Screens
Goal: Complete parent app
Step 19.1: Create Exams Screen
Fetch upcoming exams
Display exam cards
STOP - Verify exams display
Fetch published results
Display result cards
STOP - Verify results display
Step 19.2: Create Student Profile
Create Instagram-style header:
Photo, name, class, roll number
STOP - Verify header
Create attendance graph
STOP - Verify graph
Create performance graph
STOP - Verify graph
Display latest marks sheets
STOP - Verify marks display
Create details view:
All student information
STOP - Verify details
Step 19.3: Add Logout
Add logout button at bottom of profile
STOP - Test logout
Step 19.4: Final Testing
Test complete parent app flow
Fix any bugs
STOP - Verify parent app is complete
Checkpoint 19:
[ ] Exams screen complete
[ ] Profile screen complete
[ ] All graphs work
[ ] Logout works
[ ] Parent app is COMPLETE
[ ] Get confirmation before teacher app

PHASE 20: MOBILE APP - TEACHER SCREENS
Duration: Teacher App
Goal: Complete teacher app
Step 20.1: Create Teacher Home Screen
Create homework section:
Form to add homework
Class and subject selector
STOP - Verify form
Submit homework:
Save to database
Send notifications to students
STOP - Test submission
Create teacher leaderboard:
Fetch teacher rankings
Show top 3 with medals
STOP - Verify leaderboard
Create notifications list
STOP - Verify notifications
Create student profiles link
Search and filter students
View student profile
STOP - Test student viewing
Step 20.2: Create Teacher Events Screen
Reuse parent events components
STOP - Verify works for teacher
Step 20.3: Create Attendance Screen
Create date/class/subject selector
Fetch class roster
Create checkbox list:
Each student with present/absent checkbox
STOP - Verify UI
Submit attendance:
Save to database
Auto-update student profiles
STOP - Test submission
Step 20.4: Create Teacher Profile
Create teacher dashboard:
Photo, name, subjects
STOP - Verify header
Create performance graphs
STOP - Verify graphs
Display star ratings breakdown:
5-star, 4-star, etc. counts
STOP - Verify ratings display
Show student feedback
STOP - Verify feedback
Step 20.5: Final Testing
Test complete teacher app
Fix bugs
STOP - Verify teacher app is complete
Checkpoint 20:
[ ] Teacher home complete
[ ] Homework submission works
[ ] Attendance marking works
[ ] Teacher profile complete
[ ] Teacher app is COMPLETE
[ ] Get confirmation before final phase

PHASE 21: NOTIFICATIONS & REAL-TIME
Duration: System-Wide Features
Goal: Setup push notifications and real-time updates
Step 21.1: Setup Push Notifications
Configure Expo push notifications
Get device tokens on login
Store tokens in database
STOP - Test token storage
Step 21.2: Create Notification Functions
Create Supabase Edge Function for notifications:
Send on fee payment
Send on exam publish
Send on result publish
Send on homework assigned
STOP - Test each notification type
Step 21.3: Setup Real-Time Subscriptions
In admin web app:
Subscribe to fee_payments
Update dashboard in real-time
STOP - Test real-time updates
In mobile apps:
Subscribe to notifications
Update badge counts
STOP - Test real-time
Checkpoint 21:
[ ] Push notifications work
[ ] All notification types send
[ ] Real-time updates work
[ ] Badge counts update
[ ] Get confirmation before testing

PHASE 22: TESTING & BUG FIXES
Duration: Quality Assurance
Goal: Test everything and fix bugs
Step 22.1: Admin Web App Testing
Test each feature end-to-end
Test on different screen sizes
Test with large datasets
Fix all bugs found
STOP - Get list of bugs
Fix one bug at a time
Test after each fix
Step 22.2: Mobile App Testing
Test parent app on iOS and Android
Test teacher app on iOS and Android
Test with poor network connection
Test offline functionality
Fix all bugs found
STOP - Get list of bugs
Fix one bug at a time
Test after each fix
Step 22.3: Integration Testing
Test data flow: Web → Mobile
Test data flow: Mobile → Web
Test real-time updates
Test notifications delivery
Fix integration issues
Step 22.4: Security Testing
Test RLS policies
Test authentication edge cases
Test data validation
Test file upload security
Fix security issues
Checkpoint 22:
[ ] All features work correctly
[ ] No critical bugs
[ ] Security verified
[ ] Performance acceptable
[ ] Get confirmation before deployment

PHASE 23: DEPLOYMENT
Duration: Go Live
Goal: Deploy to production
Step 23.1: Prepare for Deployment
Setup environment variables for production
Configure Supabase production instance
Migrate database to production
Test production database
STOP - Verify database works
Step 23.2: Deploy Web App
Build web app for production
Deploy to Vercel/Netlify
Test deployed app
Configure custom domain
STOP - Verify web app accessible
Step 23.3: Deploy Mobile Apps
Build Android APK/Bundle
Build iOS IPA
Submit to Google Play Store
Submit to Apple App Store
STOP - Wait for app store approval
Step 23.4: Setup Monitoring
Setup error tracking (Sentry)
Setup analytics
Setup uptime monitoring
STOP - Verify monitoring works
Final Checkpoint:
[ ] Web app deployed and accessible
[ ] Mobile apps submitted to stores
[ ] Database running in production
[ ] Monitoring active
[ ] PROJECT COMPLETE! 🎉

🎯 CRITICAL REMINDERS FOR AI AGENT
NEVER skip a phase or step
ALWAYS stop and verify after each step
NEVER write code for multiple features at once
ALWAYS test immediately after writing code
NEVER assume something works without testing
ALWAYS ask for confirmation before moving to next phase
NEVER hallucinate features not in requirements
ALWAYS follow the exact order given

✅ SUCCESS CRITERIA
Each phase is only complete when:
✅ All code compiles without errors
✅ All features work as specified
✅ All tests pass
✅ No console errors
✅ User confirms phase is complete
This workflow prevents hallucination and ensures a working product! 🎓

