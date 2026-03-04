---
name: UI/UX Guidelines & Design System
description: Comprehensive guide for the project's visual design, component library usage, responsiveness, and user experience standards.
---

# 🎨 UI/UX GUIDELINES & DESIGN SYSTEM

This skill serves as the primary reference for all visual design and user experience decisions in the School Management System. It ensures consistency, accessibility, and a premium "wow" factor across both web and mobile platforms.

## 🌟 CORE DESIGN PHILOSOPHY

### **1. Premium & Trustworthy Aesthetic**
- **Primary Vibe:** Professional, Clean, Secure, Modern.
- **Key Emotion:** "Trust in Education" - Balanced with modern tech feel.
- **Visual Style:** Glassmorphism accents, soft shadows, ample whitespace, and smooth transitions.
- **Anti-Patterns:** No clutter, no jarring colors, no dense text blocks.

### **2. Platform-Specific Experience**
- **Web (Admin):** Data-heavy but scannable. focus on productivity and clarity. Desktop-first.
- **Mobile (Parent/Student/Teacher):** Touch-optimized, gesture-driven, visually engaging. Mobile-first.

---

## 🎨 VISUAL IDENTITY

### **1. Color Palette**
Based on the "Trust & Education" theme (Blue/White dominant).

| Variable | Color Code | Usage |
| :--- | :--- | :--- |
| `primary` | `#2563EB` (Blue-600) | Main actions, active states, branding |
| `primary-hover` | `#1D4ED8` (Blue-700) | Hover states for primary buttons |
| `secondary` | `#64748B` (Slate-500) | Secondary text, inactive icons |
| `accent` | `#F59E0B` (Amber-500) | Warnings, highlights, stars |
| `success` | `#10B981` (Emerald-500) | Completion, positive trends |
| `danger` | `#EF4444` (Red-500) | Errors, delete actions |
| `background` | `#F8FAFC` (Slate-50) | App background (Web) |
| `surface` | `#FFFFFF` (White) | Cards, modals, sidebars |
| `text-main` | `#0F172A` (Slate-900) | Headings, primary text |
| `text-muted` | `#64748B` (Slate-500) | Subtitles, helper text |

### **2. Typography**
Use modern, sans-serif fonts for readability.

- **Font Family:** `Inter`, `Roboto`, or `Outfit` (Select one and stick to it).
- **Headings:** Bold/Semi-bold, tight letter-spacing.
- **Body:** Regular/Medium, comfortable line-height (1.5).

### **3. Shadows & Depth**
Use soft shadows to create hierarchy.
- **Card Shadow:** `shadow-sm` or `shadow` (Tailwind).
- **Hover Shadow:** `shadow-md` + slight push up (`-translate-y-1`).
- **Modal/Dropdown:** `shadow-xl`.

---

## 🧩 COMPONENT LIBRARY & FRAMEWORKS

### **Web (Admin Dashboard)**
- **Framework:** React + Tailwind CSS.
- **Component Library:** **Shadcn/UI** (Primary choice).
- **Icons:** Lucide React or Heroicons.
- **Charts:** Recharts or Chart.js.
- **Tables:** TanStack Table (React Table) for complex data.
- **Forms:** React Hook Form + Zod.

### **Mobile (React Native)**
- **Framework:** Expo + React Native.
- **UI Kit:** React Native Paper or NativeBase.
- **Navigation:** Expo Router (File-based).
- **Icons:** Expo Vector Icons (Ionicons/MaterialCommunityIcons).
- **Gestures:** React Native Reanimated.

---

## 📏 LAYOUT & RESPONSIVENESS

### **1. Web Layout (Admin)**
- **Sidebar:** Fixed/Collapsible on left. Dark or Light depending on theme.
- **Top Bar:** Search, Notifications, User Profile.
- **Main Content:** Max-width container, centered or fluid.
- **Grid System:** Use CSS Grid for dashboards (e.g., `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).

### **2. Mobile Layout**
- **Safe Area:** Always respect top notch and bottom home bar.
- **Tab Bar:** Bottom navigation for main sections.
- **Header:** Standard stack header or custom "Instagram-style" profile header.
- **Scroll:** Smooth vertical scrolling, horizontal carousels for cards.

---

## ⚡ INTERACTION DESIGN (The "Wow" Factor)

### **1. Micro-animations**
- **Buttons:** Scale down slightly on click (`active:scale-95`).
- **Cards:** Lift on hover (Web) or press (Mobile).
- **Lists:** Staggered fade-in on load.
- **Modals:** Smooth fade + scale entry.

### **2. Feedback States**
- **Loading:** Skeleton screens (pulse effect) instead of spinners where possible.
- **Success:** Toast notifications (top-right web, bottom mobile).
- **Error:** Inline validation messages + red border.
- **Empty States:** Custom illustration + clear "Create" action.

### **3. Transitions**
- **Pages:** Subtle fade-in/slide-in transition.
- **Tabs:** Smooth slide or cross-fade.

---

## 📱 FEATURE-SPECIFIC GUIDELINES

### **1. Dashboards**
- **Data Visualization:** Use cards for key metrics. Use charts for trends.
- **Clarity:** Don't overwhelm. Use tabs or "View All" links for details.

### **2. Forms**
- **Layout:** Vertical stack for mobile, Grid for desktop.
- **Validation:** Real-time validation (on blur).
- **Actions:** Primary button on right (Web) or bottom (Mobile).

### **3. Tables (Web)**
- **Features:** Pagination, Search, Sort, Filter.
- **Actions:** Row hover actions (Edit/Delete).
- **Density:** Comfortable padding, not too condensed.

### **4. Profiles**
- **Header:** Large photo/avatar, clear name and role.
- **Tabs:** Separate "Info", "Activity", "Settings".

---

## ✅ ACCESSIBILITY (A11y) CHECKLIST

- [ ] **Contrast:** Text vs Background ratio > 4.5:1.
- [ ] **Focus States:** Visible focus ring for keyboard navigation.
- [ ] **Alt Text:** All meaningful images have alt text.
- [ ] **Tap Targets:** Buttons/Links > 44x44px on mobile.
- [ ] **Labels:** All form inputs have visible labels.
- [ ] **Semantic HTML:** Use `<button>`, `<nav>`, `<main>`, etc.

---

## 🚫 "DON'T" LIST

❌ **Don't** use generic browser alerts (`window.alert`). Use Toasts/Modals.
❌ **Don't** use pure black (`#000000`) for text. Use Dark Gray (`#0F172A`).
❌ **Don't** clutter with too many primary buttons. One per view.
❌ **Don't** ignore loading states. Buttons should show spinners when processing.
❌ **Don't** use low-resolution images. Consistency is key.
