🎯 STRICT CODING RULES FOR AI AGENT
⚠️ CRITICAL: READ BEFORE WRITING ANY CODE
These rules are NON-NEGOTIABLE. Breaking any rule requires immediate stop and rewrite.

📋 GENERAL CODING PRINCIPLES
RULE 1: ONE RESPONSIBILITY PER FILE
Each file does ONE thing only
If a file has multiple responsibilities, SPLIT IT
Component files: Only the component
Hook files: Only the hook logic
Utility files: Only related utilities
NEVER mix concerns in a single file
Example:
❌ WRONG: studentUtils.ts contains validation + formatting + API calls
✅ CORRECT: 
   - studentValidation.ts (only validation)
   - studentFormatting.ts (only formatting)
   - studentApi.ts (only API calls)

RULE 2: MAXIMUM FILE LENGTH
Components: MAX 250 lines (including imports/exports)
Hooks: MAX 100 lines
Utilities: MAX 150 lines
If exceeding limit, STOP and refactor into smaller files
RULE 3: NO MAGIC NUMBERS OR STRINGS
NEVER hardcode values directly in code
ALWAYS use constants or enums
Store constants in separate constant files
Example:
❌ WRONG: if (user.role === 'admin')
✅ CORRECT: 
   - Create constants/roles.ts with ROLES.ADMIN
   - Use: if (user.role === ROLES.ADMIN)

RULE 4: NO CODE DUPLICATION
If same code appears twice, extract it
Create shared utility/hook/component
NEVER copy-paste code blocks
RULE 5: DESCRIPTIVE NAMING - NO ABBREVIATIONS
Use full, descriptive names
NEVER use abbreviations except universal ones (id, url, api)
Name should explain what it does without comments
Example:
❌ WRONG: 
   - stud
   - getData
   - handleClick
   - temp
   - arr

✅ CORRECT:
   - student
   - fetchStudentAttendance
   - handleStudentProfileClick
   - temporaryStudentData
   - studentList


🔧 TYPESCRIPT RULES
RULE 6: STRICT TYPESCRIPT - NO 'any'
NEVER use any type
NEVER use @ts-ignore or @ts-expect-error
If you don't know the type, use unknown and type guard
ALWAYS define proper interfaces/types
If type is too complex, break it down into smaller types
Example:
❌ WRONG: const data: any = await fetch()
✅ CORRECT: 
   - Define interface StudentData
   - const data: StudentData = await fetch()

RULE 7: INTERFACE NAMING
Props interfaces: ComponentNameProps
Data interfaces: Descriptive name without 'I' prefix
Never use 'I' prefix (IStudent ❌)
Example:
✅ CORRECT:
   - StudentCardProps (for component props)
   - Student (for student data)
   - AttendanceRecord (for attendance data)
   - CreateStudentFormData (for form data)

RULE 8: TYPE EVERYTHING
EVERY function parameter must have a type
EVERY function must have a return type
EVERY variable should be typed (or inferred correctly)
NEVER rely on implicit any
Example:
❌ WRONG: 
   function calculateGrade(marks) { return marks / 100; }

✅ CORRECT:
   function calculateGrade(marks: number): number { 
     return marks / 100; 
   }

RULE 9: USE ENUMS FOR FIXED VALUES
Use enums for status, roles, types that have fixed values
NEVER use string literals repeatedly
Example:
✅ CORRECT:
   enum UserRole {
     ADMIN = 'admin',
     TEACHER = 'teacher',
     PARENT = 'parent',
     STUDENT = 'student'
   }

RULE 10: PROPER TYPE EXPORTS
Export types/interfaces from where they're defined
Use barrel exports (index.ts) for public API
NEVER re-export types you don't own

⚛️ REACT/REACT NATIVE RULES
RULE 11: FUNCTIONAL COMPONENTS ONLY
NEVER use class components
ALWAYS use functional components with hooks
Use React.FC or explicit typing for props
RULE 12: COMPONENT STRUCTURE ORDER
Every component file must follow this EXACT order:
Imports (grouped: React, third-party, internal, types)
Types/Interfaces
Constants (component-specific)
Component definition
Exports
Example Order:
1. // React imports
2. // Third-party imports
3. // Internal imports
4. // Type imports
5. 
6. interface ComponentProps { }
7. const COMPONENT_CONSTANTS = { }
8.
9. export const Component: React.FC<ComponentProps> = ({ }) => { }

RULE 13: HOOKS RULES
ALWAYS follow React hooks rules
Call hooks at top level only
NEVER call hooks conditionally
Custom hooks MUST start with "use"
NEVER return arrays from custom hooks (use objects)
Example:
❌ WRONG: return [data, loading, error]
✅ CORRECT: return { data, isLoading, error }

RULE 14: COMPONENT PROPS DESTRUCTURING
ALWAYS destructure props in function signature
NEVER use props.something inside component
Example:
❌ WRONG: 
   const StudentCard = (props) => {
     return <div>{props.name}</div>
   }

✅ CORRECT:
   const StudentCard = ({ name, age, className }: StudentCardProps) => {
     return <div>{name}</div>
   }

RULE 15: STATE MANAGEMENT
Use useState for local component state
Use context/Zustand for shared state
NEVER prop drill more than 2 levels
ALWAYS lift state to appropriate level (not too high, not too low)
RULE 16: EFFECT DEPENDENCIES
ALWAYS include all dependencies in useEffect
NEVER disable exhaustive-deps rule
If effect has no dependencies, add comment explaining why
RULE 17: EVENT HANDLERS
ALWAYS prefix with "handle": handleClick, handleSubmit
ALWAYS type event parameter properly
NEVER use inline arrow functions for event handlers (extract them)
Example:
❌ WRONG: 
   <button onClick={() => console.log('clicked')}>

✅ CORRECT:
   const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
     console.log('clicked');
   }
   <button onClick={handleButtonClick}>

RULE 18: CONDITIONAL RENDERING
Use ternary for simple conditions
Use early returns for complex conditions
NEVER use nested ternaries
NEVER use logical && with numbers (0 will render)
Example:
❌ WRONG: 
   {count && <div>{count}</div>} // Shows "0" if count is 0

✅ CORRECT:
   {count > 0 && <div>{count}</div>}
   OR
   {count ? <div>{count}</div> : null}

RULE 19: KEY PROP IN LISTS
ALWAYS use stable, unique keys
NEVER use array index as key
NEVER use random generated keys
Example:
❌ WRONG: 
   {students.map((s, index) => <div key={index}>{s.name}</div>)}

✅ CORRECT:
   {students.map((student) => (
     <div key={student.id}>{student.name}</div>
   ))}

RULE 20: MEMOIZATION
Use useMemo for expensive calculations only
Use useCallback for functions passed to memoized children
DON'T over-optimize (memoize everything)
ONLY memoize when you have proof of performance issue

🎨 STYLING RULES
RULE 21: TAILWIND CLASSES ORDER
Follow this order for Tailwind classes:
Layout (display, position, z-index)
Box model (width, height, padding, margin)
Typography (font, text)
Visual (background, border, shadow)
Misc (cursor, transition)
RULE 22: NO INLINE STYLES
NEVER use inline styles (style={})
ALWAYS use Tailwind classes
If custom styles needed, use CSS modules or styled-components
RULE 23: RESPONSIVE DESIGN
ALWAYS design mobile-first
Use Tailwind responsive prefixes: sm:, md:, lg:, xl:
Test on multiple screen sizes
RULE 24: CONSISTENT SPACING
Use Tailwind spacing scale (4, 8, 12, 16, etc.)
NEVER use arbitrary values unless absolutely necessary
Maintain consistent spacing throughout app

🗄️ STATE MANAGEMENT RULES
RULE 25: ZUSTAND STORE STRUCTURE
One slice per major feature
NEVER put everything in one store
Separate state from actions clearly
Structure:
store/
├── slices/
│   ├── authSlice.ts
│   ├── studentSlice.ts
│   └── teacherSlice.ts
└── index.ts

RULE 26: ACTIONS NAMING
Prefix with action type: set, add, update, delete, fetch
Be specific: setStudents, not setData
Use camelCase
Example:
✅ CORRECT:
   - setStudents
   - addStudent
   - updateStudent
   - deleteStudent
   - fetchStudents

RULE 27: IMMUTABLE STATE UPDATES
NEVER mutate state directly
ALWAYS create new objects/arrays
Use spread operator or array methods
Example:
❌ WRONG: 
   state.students.push(newStudent)

✅ CORRECT:
   set({ students: [...state.students, newStudent] })


🔌 API & DATA FETCHING RULES
RULE 28: SUPABASE QUERY STRUCTURE
ALWAYS handle errors explicitly
ALWAYS type the response
NEVER ignore error objects
Use async/await, NOT .then() chains
Example:
✅ CORRECT:
   const { data, error } = await supabase
     .from('students')
     .select('*')
     .eq('class_id', classId);
   
   if (error) {
     console.error('Error fetching students:', error);
     throw new Error(error.message);
   }
   
   return data as Student[];

RULE 29: LOADING AND ERROR STATES
EVERY data fetch must have loading state
EVERY data fetch must have error state
ALWAYS show user feedback (loading spinner, error message)
RULE 30: NO FETCH IN RENDER
NEVER call API directly in component body
ALWAYS use useEffect or custom hooks
NEVER fetch in loops
RULE 31: DATA VALIDATION
ALWAYS validate data from API before using
Use Zod schemas for validation
NEVER trust external data

🛡️ SECURITY RULES
RULE 32: NO SENSITIVE DATA IN CLIENT
NEVER store passwords in state/localStorage
NEVER log sensitive data
NEVER expose API keys in frontend code
RULE 33: INPUT SANITIZATION
ALWAYS sanitize user input before using
ALWAYS validate on both client and server
Use proper validation libraries (Zod, Yup)
RULE 34: XSS PREVENTION
NEVER use dangerouslySetInnerHTML
ALWAYS escape user-generated content
NEVER render unvalidated HTML
RULE 35: AUTHENTICATION
ALWAYS check authentication before rendering protected content
ALWAYS verify user role/permissions
NEVER trust client-side auth checks alone

📝 FORM HANDLING RULES
RULE 36: USE FORM LIBRARIES
ALWAYS use react-hook-form for forms
NEVER manage form state manually with useState
Combine with Zod for validation
RULE 37: FORM VALIDATION
ALWAYS validate on submit
Provide inline validation for better UX
Show clear error messages
NEVER use generic error messages
RULE 38: FORM SUBMISSION
ALWAYS disable submit button while submitting
Show loading state during submission
Handle success and error states
Clear form on successful submit (if appropriate)

🧪 ERROR HANDLING RULES
RULE 39: ERROR BOUNDARIES
Use error boundaries for component errors
NEVER let errors crash the entire app
Provide fallback UI
RULE 40: TRY-CATCH BLOCKS
ALWAYS wrap async operations in try-catch
ALWAYS log errors appropriately
ALWAYS show user-friendly error messages
Example:
✅ CORRECT:
   try {
     const data = await fetchStudents();
     setStudents(data);
   } catch (error) {
     console.error('Failed to fetch students:', error);
     setError('Unable to load students. Please try again.');
   }

RULE 41: ERROR MESSAGES
Make error messages user-friendly
NEVER show technical error details to users
Provide actionable guidance (what user should do)

🔄 ASYNC/AWAIT RULES
RULE 42: CONSISTENT ASYNC PATTERNS
ALWAYS use async/await
NEVER mix async/await with .then()
ALWAYS handle promise rejections
RULE 43: PARALLEL VS SEQUENTIAL
Use Promise.all() for parallel operations
Use sequential await for dependent operations
NEVER await in loops unnecessarily
Example:
✅ PARALLEL (independent operations):
   const [students, teachers] = await Promise.all([
     fetchStudents(),
     fetchTeachers()
   ]);

✅ SEQUENTIAL (dependent):
   const student = await fetchStudent(id);
   const attendance = await fetchAttendance(student.id);


📦 IMPORT/EXPORT RULES
RULE 44: IMPORT ORDER
Follow this EXACT order (with blank lines between groups):
React imports
Third-party library imports (alphabetically)
Internal component imports
Internal hook imports
Internal utility imports
Type imports
Asset imports (images, icons)
Example:
import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { useAuth } from '@/hooks/useAuth';

import { formatDate } from '@/lib/utils';

import type { Student } from '@school/database';

RULE 45: NAMED EXPORTS ONLY
ALWAYS use named exports
NEVER use default exports (except for Next.js pages)
Makes refactoring easier
Example:
❌ WRONG: export default Button
✅ CORRECT: export const Button = () => { }

RULE 46: BARREL EXPORTS
Create index.ts for each feature folder
Export public API only
NEVER export implementation details

🎯 PERFORMANCE RULES
RULE 47: LAZY LOADING
Lazy load routes/screens
Lazy load heavy components
Use React.lazy and Suspense
RULE 48: IMAGE OPTIMIZATION
ALWAYS use Next.js Image component (web)
ALWAYS use optimized images (React Native)
Specify width and height
Use appropriate formats (WebP when possible)
RULE 49: AVOID RE-RENDERS
Extract static content outside component
Use memo/useMemo/useCallback appropriately
DON'T create objects/arrays in render
Example:
❌ WRONG (creates new object every render):
   <Component config={{ theme: 'dark' }} />

✅ CORRECT:
   const CONFIG = { theme: 'dark' };
   <Component config={CONFIG} />

RULE 50: BUNDLE SIZE
Import only what you need
Use tree-shaking friendly imports
Example:
❌ WRONG: import _ from 'lodash'
✅ CORRECT: import { debounce } from 'lodash'


📱 MOBILE-SPECIFIC RULES (React Native)
RULE 51: PLATFORM-SPECIFIC CODE
Use Platform.select() for platform differences
Keep platform-specific code minimal
Document why platform-specific code is needed
RULE 52: SAFE AREA
ALWAYS use SafeAreaView for screens
Respect device notches and home indicators
RULE 53: KEYBOARD HANDLING
ALWAYS wrap forms in KeyboardAvoidingView
Dismiss keyboard on scroll (if appropriate)
Handle keyboard show/hide events
RULE 54: NAVIGATION
Use typed navigation (TypeScript)
NEVER use navigation without types
Pass minimal data through navigation params

🗃️ DATABASE RULES
RULE 55: ROW LEVEL SECURITY (RLS)
ALWAYS enable RLS on all tables
Test RLS policies thoroughly
NEVER bypass RLS in production
RULE 56: QUERY OPTIMIZATION
ALWAYS select only needed columns
Use indexes for frequently queried columns
NEVER do SELECT * in production
Example:
❌ WRONG: 
   .from('students').select('*')

✅ CORRECT:
   .from('students').select('id, full_name, class_id')

RULE 57: TRANSACTION HANDLING
Use transactions for multi-step operations
ALWAYS rollback on error
Keep transactions short

📄 FILE ORGANIZATION RULES
RULE 58: FOLDER NESTING
MAXIMUM 4 levels deep
If deeper, refactor structure
Group related files together
RULE 59: FILE NAMING
Components: PascalCase (StudentCard.tsx)
Hooks: camelCase with 'use' prefix (useStudents.ts)
Utils: camelCase (formatDate.ts)
Types: camelCase with .types.ts suffix (student.types.ts)
Constants: UPPER_SNAKE_CASE or camelCase (API_ENDPOINTS.ts)
RULE 60: CO-LOCATION
Keep related files together
Component + its styles/tests in same folder
Feature-based organization

💬 COMMENTS & DOCUMENTATION RULES
RULE 61: WHEN TO COMMENT
Comment WHY, not WHAT
Comment complex logic only
NEVER comment obvious code
NEVER leave TODO comments (use issue tracker)
Example:
❌ WRONG: 
   // Set students to empty array
   setStudents([]);

✅ CORRECT:
   // Clear students list to force re-fetch from server
   // This ensures we get the latest data after bulk update
   setStudents([]);

RULE 62: JSDoc FOR PUBLIC APIs
Document all public functions
Document complex types
Include examples for complex usage

🧹 CODE QUALITY RULES
RULE 63: NO CONSOLE LOGS IN PRODUCTION
NEVER commit console.log
Use proper logging library if needed
Remove debug statements before committing
RULE 64: NO COMMENTED CODE
NEVER commit commented-out code
Delete unused code
Use version control to recover old code
RULE 65: CONSISTENT FORMATTING
Use Prettier for formatting
NEVER mix formatting styles
Configure editor to auto-format on save
RULE 66: LINTING
Fix ALL ESLint errors
Fix ALL TypeScript errors
NEVER disable linting rules without good reason

🔐 ENVIRONMENT & CONFIG RULES
RULE 67: ENVIRONMENT VARIABLES
NEVER commit .env files
Use .env.example for documentation
Validate env vars on startup
RULE 68: CONFIGURATION
Store config in separate files
NEVER hardcode config values
Use TypeScript for config type safety

🧪 TESTING RULES (If Implementing Tests)
RULE 69: TEST FILE NAMING
Co-locate tests with components
Name: Component.test.tsx
NEVER put all tests in separate test folder
RULE 70: WHAT TO TEST
Test user interactions
Test error states
Test edge cases
DON'T test implementation details

🚀 BUILD & DEPLOYMENT RULES
RULE 71: BUILD CHECKS
ALWAYS ensure production build succeeds
Fix ALL build warnings
Test production build locally
RULE 72: DEPENDENCY MANAGEMENT
Keep dependencies up to date
Remove unused dependencies
Use exact versions in package.json (no ^)

⚠️ ABSOLUTE PROHIBITIONS (NEVER DO THESE)
FORBIDDEN PRACTICES:
❌ NEVER use any type
❌ NEVER use @ts-ignore
❌ NEVER use eval()
❌ NEVER use var (use const/let)
❌ NEVER mutate state directly
❌ NEVER use array index as key
❌ NEVER use inline styles
❌ NEVER use .then() chains (use async/await)
❌ NEVER commit console.logs
❌ NEVER commit commented code
❌ NEVER use default exports (except Next.js pages)
❌ NEVER use magic numbers/strings
❌ NEVER ignore errors silently
❌ NEVER use non-null assertion (!.) without comment explaining why
❌ NEVER create files over 300 lines
❌ NEVER nest ternaries
❌ NEVER use == (use ===)
❌ NEVER leave empty catch blocks
❌ NEVER use synchronous operations in async code
❌ NEVER store sensitive data in localStorage

✅ BEFORE COMMITTING ANY CODE
Checklist - EVERY file must pass:
[ ] All TypeScript errors resolved
[ ] All ESLint errors resolved
[ ] No console.logs
[ ] No commented code
[ ] No any types
[ ] All functions have return types
[ ] All components properly typed
[ ] Imports properly ordered
[ ] File length under limits
[ ] Naming conventions followed
[ ] Error handling implemented
[ ] Loading states implemented
[ ] No code duplication
[ ] No magic numbers/strings
[ ] Responsive design considered
[ ] Security rules followed
[ ] Performance optimizations applied
[ ] Code is readable and maintainable

🎯 CODE REVIEW QUESTIONS
Before declaring code "complete", answer these:
Can this code be understood by another developer in 6 months?
Is every edge case handled?
What happens if the API fails?
What happens with empty/null/undefined data?
Is the loading state clear to users?
Are error messages helpful?
Could this be split into smaller functions/components?
Is this the simplest solution?
Are all types correctly defined?
Would I be proud to show this code?

🚨 WHEN RULES CONFLICT
Priority Order:
Security rules (HIGHEST)
TypeScript rules
Performance rules
Code quality rules
Formatting rules (LOWEST)

📚 RULE ENFORCEMENT
If you break a rule:
STOP immediately
DELETE the code
REWRITE following the rules
TEST the corrected code
VERIFY no other rules broken
No exceptions unless:
Security requirement
Performance requirement (with proof)
Third-party library limitation (document why)

🎓 SUMMARY: THE 5 COMMANDMENTS
THOU SHALL TYPE EVERYTHING - No any, no exceptions
THOU SHALL HANDLE ERRORS - Every operation can fail
THOU SHALL NAME DESCRIPTIVELY - No abbreviations, be clear
THOU SHALL KEEP IT SIMPLE - If complex, split it
THOU SHALL TEST THY CODE - Before declaring complete

These rules ensure: Clean, Maintainable, Secure, Performant Code! 🎯
AI Agent: Follow these rules religiously. Breaking them is not allowed!

