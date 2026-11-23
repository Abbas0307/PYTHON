# Mindora 2.0 — Phase 5.20: UI/UX Design System & Accessibility Specification

**Document ID:** `DOC-P520-UIUX-008`  
**Date:** November 16, 2026  
**Status:** Verified & Active  
**Author:** Principal UI/UX Designer & WCAG 2.1 AA Auditor  

---

## 1. Visual Aesthetics & Palette Guidelines

Mindora 2.0 adopts a cohesive, calm, collegiate white-and-violet aesthetic designed to reduce psychological tension and cognitive fatigue during self-assessment.

### Core Color Palette:
- **Primary Violet:** `#7C3AED` (`violet-600`) — Primary calls to action, focus rings, and accents.
- **Deep Violet / Slate:** `#4C1D95` (`violet-900`) — Hero banners, titles, high-contrast text.
- **Card Background:** `#FFFFFF` with borders `#F3F4F6` (`gray-100`) and subtle shadows `shadow-sm`.
- **Soft Accent / Tints:** `#F5F3FF` (`violet-50`) — Selected states, info callouts.
- **Safety Emerald:** `#059669` (`emerald-600`) — Completion badges, active sessions, verified checks.
- **Urgent Amber / Rose:** `#D97706` (`amber-600`) / `#E11D48` (`rose-600`) — Crisis hotlines, warnings.

---

## 2. Header and Avatar Navigation Specification

The top application header features:
1. **Interactive Profile Avatar:**
   - Displays uploaded profile photo (`/api/profile/avatar/{filename}`).
   - Fallback: Crisp two-letter initials badge with high contrast.
   - Click opens interactive dropdown menu:
     - Student Full Name & Masked Email
     - "My Profile & Account" $\rightarrow$ Navigates to `profile_settings`.
     - "Guardian & Trusted Contacts" $\rightarrow$ Navigates to `guardian_support`.
     - "Privacy & Data Inventory" $\rightarrow$ Navigates to `privacy_center`.
     - "Log Out" $\rightarrow$ Clears tokens and session state cleanly.
2. **Global Crisis Quick Access:** Permanent crimson button providing instant 24/7 hotline overlay.
3. **National Crisis Selector:** Instant localization (India Tele-MANAS, US 988, UK 111, Canada 988, Australia Lifeline).

---

## 3. WCAG 2.1 AA Accessibility Standards

1. **Contrast Ratio:** Text on white backgrounds maintains $\ge 4.5:1$ contrast ratio ($\ge 7:1$ for large titles).
2. **Focus Indicators:** Interactive inputs feature visible `focus:ring-2 focus:ring-violet-500` rings for keyboard navigators.
3. **Screen Readers:** ARIA labels, semantic landmark elements (`<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`), and accessible role declarations.
4. **Motion Safety:** Respects `prefers-reduced-motion` to eliminate disorienting animations for sensitive students.
