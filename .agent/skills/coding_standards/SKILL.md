---
name: Coding Standards & Best Practices
description: Comprehensive collection of non-negotiable coding rules, principles, typescript standards, and best practices for the project.
---

# 🎯 STRICT CODING RULES & STANDARDS

This skill defines the NON-NEGOTIABLE coding standards for the School Management System. Adherence to these rules is critical for code quality, maintainability, and security.

## ⚠️ CRITICAL: READ BEFORE WRITING ANY CODE
These rules are **MANDATORY**. Breaking any rule requires immediate stop and rewrite.

---

## 📋 GENERAL CODING PRINCIPLES

### **RULE 1: ONE RESPONSIBILITY PER FILE**
- Each file does **ONE** thing only.
- **Split** files with multiple responsibilities.
- **Components:** Only component logic.
- **Hooks:** Only hook logic.
- **Utilities:** Only related helper functions.

### **RULE 2: MAXIMUM FILE LENGTH**
- **Components:** MAX 250 lines.
- **Hooks:** MAX 100 lines.
- **Utilities:** MAX 150 lines.
- **Action:** STOP and refactor if limit is exceeded.

### **RULE 3: NO MAGIC NUMBERS OR STRINGS**
- **NEVER** hardcode values.
- **ALWAYS** use constants or enums.
- **Store** in `constants/` or define locally if specific to a single file and small.

### **RULE 4: NO CODE DUPLICATION**
- **Extract** repeated code into shared utilities or hooks.
- **NEVER** copy-paste blocks of logic.

### **RULE 5: DESCRIPTIVE NAMING**
- Use **full, descriptive** names.
- **NO** abbreviations (except `id`, `url`, `api`).
- Name variables/functions to explain their purpose.
- **Examples:** `fetchStudentAttendance` (✅) vs `getData` (❌).

---

## 🔧 TYPESCRIPT RULES

### **RULE 6: STRICT TYPESCRIPT - NO 'any'**
- **NEVER** use `any`.
- **NEVER** use `@ts-ignore` or `@ts-expect-error`.
- Use `unknown` + type guarding if type is uncertain.

### **RULE 7: INTERFACE NAMING**
- **Props:** `ComponentNameProps`
- **Data:** Descriptive name (e.g., `Student`, `AttendanceRecord`).
- **NO** `I` prefix (e.g., `IStudent` ❌).

### **RULE 8: TYPE EVERYTHING**
- **EVERY** function parameter must have a type.
- **EVERY** function must have a return type.
- **EVERY** variable should have an explicit or correctly inferred type.

### **RULE 9: USE ENUMS FOR FIXED VALUES**
- Use `enum` for status, roles, or types with fixed options.
- Avoid repeated string literals.

### **RULE 10: PROPER EXPORTS**
- Export types where defined.
- Use **barrel exports** (`index.ts`) for public APIs.

---

## ⚛️ REACT & REACT NATIVE RULES

### **RULE 11: FUNCTIONAL COMPONENTS ONLY**
- **NEVER** use class components.
- Use `React.FC` or explicit props typing.

### **RULE 12: COMPONENT STRUCTURE ORDER**
1. **Imports** (React -> Third-party -> Internal -> Types)
2. **Types/Interfaces**
3. **Constants**
4. **Component Definition**
5. **Exports**

### **RULE 13: HOOKS RULES**
- Follow Rules of Hooks (top level only).
- Custom hooks MUST start with `use`.
- Return **objects**, not arrays (e.g., `{ data, isLoading }`).

### **RULE 14: PROPS DESTRUCTURING**
- **ALWAYS** destructure props in the function signature.
- **NEVER** use `props.something`.

### **RULE 15: STATE MANAGEMENT**
- `useState`: Local component state.
- `Zustand`: Shared global state.
- **Limit** prop drilling to 2 levels.

### **RULE 16: EFFECT DEPENDENCIES**
- **ALWAYS** include all dependencies in `useEffect`.
- **NEVER** disable `exhaustive-deps` rule.

### **RULE 17: EVENT HANDLERS**
- Prefix with `handle` (e.g., `handleClick`).
- **Type** event parameters properly (`React.MouseEvent<...>`).
- **No** inline arrow functions for complex handlers.

### **RULE 18: CONDITIONAL RENDERING**
- Use **ternaries** for simple conditions.
- Use **early returns** for complex logic.
- **NEVER** use `&&` with numbers (avoids rendering `0`).

### **RULE 19: KEY PROP IN LISTS**
- use **stable, unique IDs** as keys.
- **NEVER** use array index.

### **RULE 20: MEMOIZATION**
- Use `useMemo`/`useCallback` only for expensive calculations or reducing re-renders.
- Don't premature optimize.

---

## 🎨 STYLING RULES (Tailwind)

### **RULE 21: CLASS ORDER**
1. **Layout** (display, position)
2. **Box Model** (margin, padding, size)
3. **Typography** (font, text)
4. **Visual** (color, border, shadow)
5. **Misc** (cursor, transition)

### **RULE 22: NO INLINE STYLES**
- **ALWAYS** use Tailwind classes.
- Use `style={{}}` only for dynamic values (e.g., coordinates).

### **RULE 23: RESPONSIVE DESIGN**
- **Mobile-first** approach.
- Use `sm:`, `md:`, `lg:` prefixes.

### **RULE 24: CONSISTENT SPACING**
- Use Tailwind spacing scale (4, 8, 12, 16...).
- Avoid arbitrary values (`w-[123px]`) unless strictly necessary.

---

## 🗄️ STATE MANAGEMENT (Zustand)

### **RULE 25: STORE STRUCTURE**
- One slice per feature (`authSlice`, `studentSlice`).
- Combine in `store/index.ts`.

### **RULE 26: ACTION NAMING**
- Verb-noun pattern: `setStudents`, `updateProfile`.
- Use specific names, not generic `setData`.

### **RULE 27: IMMUTABLE UPDATES**
- **NEVER** mutate state directly.
- Always return new objects/arrays.

---

## 🔌 API & DATA FETCHING

### **RULE 28: SUPABASE PATTERNS**
- Handle errors explicitly.
- Type the response data.
- Use `async/await`.

### **RULE 29: FEEDBACK STATES**
- Every fetch needs **loading** and **error** states.
- Show UI feedback to the user.

### **RULE 30: NO FETCH IN RENDER**
- **NEVER** call API in component body.
- Use `useEffect` or custom hooks.

### **RULE 31: VALIDATION**
- **ALWAYS** validate API responses (Zod).
- **NEVER** trust external data structure.

---

## 🛡️ SECURITY RULES

### **RULE 32: NO SENSITIVE DATA**
- **NEVER** store passwords/keys in client state or `localStorage`.
- **NEVER** log sensitive info.

### **RULE 33: SANITIZATION**
- Sanitize user inputs.
- Validate on both client and server.

### **RULE 34: XSS PREVENTION**
- **NEVER** use `dangerouslySetInnerHTML`.
- Escape user content.

### **RULE 35: AUTH CHECKS**
- Verify auth state and roles before rendering protected routes.

---

## 📝 FORM HANDLING (React Hook Form)

### **RULE 36: USE LIBRARIES**
- Use `react-hook-form` + `zod`.
- Avoid manual state for complex forms.

### **RULE 37: VALIDATION**
- Validate on submit.
- Show clear, inline error messages.

### **RULE 38: SUBMISSION STATE**
- Disable buttons during submission.
- Handle success/error feedback.

---

## 🧪 ERROR HANDLING

### **RULE 39: ERROR BOUNDARIES**
- Prevent app crashes with boundaries.
- Provide fallback UI.

### **RULE 40: TRY-CATCH**
- Wrap async code in `try-catch`.
- Log errors and alert user.

### **RULE 41: USER MESSAGES**
- Show friendly, actionable error messages.
- Hide technical details.

---

## 🔄 ASYNC/AWAIT

### **RULE 42: CONSISTENCY**
- Use `async/await` over `.then()`.

### **RULE 43: PARALLELISM**
- Use `Promise.all` for independent fetches.
- Use sequential `await` only when dependent.

---

## 📦 IMPORT/EXPORT

### **RULE 44: IMPORT ORDER**
1. React
2. Third-party
3. Internal Components
4. Internal Hooks/Utils
5. Types
6. Assets

### **RULE 45: NAMED EXPORTS**
- **ALWAYS** use named exports (`export const Foo = ...`).
- **NO** default exports (except Next.js pages).

### **RULE 46: BARREL EXPORTS**
- Use `index.ts` to export public API of a feature.

---

## 🚀 PERFORMANCE & DEPLOYMENT

### **RULE 47: LAZY LOADING**
- Lazy load routes and heavy components.

### **RULE 48: IMAGE OPTIMIZATION**
- Use Next.js `<Image>` or optimized native components.
- Specify dimensions.

### **RULE 49: RENDER OPTIMIZATION**
- Avoid creating objects/arrays inside render.
- Define static config outside component.

### **RULE 50: BUNDLE SIZE**
- Tree-shakeable imports.
- Import only needed functions (`import { debounce } from 'lodash'`).

---

## 📱 MOBILE SPECIFIC (React Native)

### **RULE 51: PLATFORM CODE**
- Use `Platform.select`.
- Keep platform-specific logic minimal.

### **RULE 52: SAFE AREA**
- Use `SafeAreaView`.

### **RULE 53: KEYBOARD**
- Use `KeyboardAvoidingView`.
- Handle dismiss on scroll.

### **RULE 54: NAVIGATION**
- Type your navigation params.

---

## 🗃️ DATABASE

### **RULE 55: RLS**
- **ALWAYS** enable RLS.
- Test policies thoroughly.

### **RULE 56: QUERY OPTIMIZATION**
- Select ONLY needed columns.
- Use indexes.

---

## 🧹 CODE QUALITY

### **RULE 63: NO CONSOLE LOGS**
- **NEVER** commit `console.log`.

### **RULE 64: NO COMMENTED CODE**
- Delete unused code.

### **RULE 65: FORMATTING**
- Use Prettier.
- Consistent style.

### **RULE 66: LINTING**
- Fix **ALL** ESLint/TS errors.
- **NEVER** disable rules without good reason.

---

## 🎓 COMMANDMENTS
1. **TYPE EVERYTHING** - No `any`.
2. **HANDLE ERRORS** - Expect failure.
3. **NAME DESCRIPTIVELY** - Be clear.
4. **KEEP IT SIMPLE** - Split complex logic.
5. **TEST THY CODE** - Verify before done.
