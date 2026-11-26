# Domus — Contributor & AI Agent Guidelines

This document defines standing rules for all human contributors and AI coding agents working on **Domus**.

## 1. Keep `README.md` Always Up to Date (Mandatory)

- **Every meaningful change must update `README.md`.** Whenever you add a feature, redesign a screen, change an authentication/key flow, add new assets/miniatures, or modify setup/architecture, update `README.md` before finishing your task.
- Keep screenshots, miniature showcases, feature bullets, and the project structure tree in `README.md` aligned with the actual codebase.

## 2. Core Product & UX Principles

- **Real House Mental Model**:
  - One **House Key** (`DOMUS-XXXX`) is auto-minted per residence; every member (including the Head of Household on creation) gets an auto-minted **Personal Room Key**.
  - Never seed dummy data into production households; demo data belongs strictly inside `POST /api/demo` (`hh_demo_house`).
  - Required form inputs must be clearly marked with `*`.
  - Provide clear Cancel buttons and Escape dismissal on forms and modals.
- **Spatial Layout**:
  - Entering a house goes directly into the **Common Area** (no splash/promo cards, no cluttered top nav tabs).
  - Keep primary workspaces balanced within a single desktop viewport so growth (e.g., many shared lists or pinned notes) expands symmetrically across full-width grids rather than creating lopsided empty columns.
- **Night Mode & Wall Paint**:
  - Any new UI surface, badge, or pill must remain crisp and legible in both **Day Mode** and **Night Mode** (`html.dark`).
  - Never put `.domus-card` directly on an `absolute` dropdown inside the navbar (`.domus-card` sets `position: relative`); always wrap dropdowns in an outer `absolute` container or use a centered modal.

## 3. Verification Before Pushing

Always run:
```bash
pnpm typecheck && pnpm test
```
Do not run `next build` while `next dev` is running against the same `.next/` directory without stopping `next dev` first.
