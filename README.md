# ShiftTrack — Workforce Operations Platform

A premium, production-grade **SaaS Manager Dashboard** for attendance, employee management, leave management, shift scheduling, reports, and real-time monitoring.

![tech](https://img.shields.io/badge/Next.js_15-App_Router-2563EB) ![tech](https://img.shields.io/badge/TypeScript-strict-2563EB) ![tech](https://img.shields.io/badge/Tailwind-Slate_System-2563EB) ![tech](https://pkg.pr.new/badge/zustand)

## ✦ Highlights

- **7 full pages**: Login, Overview, Employees, Shifts, Attendance, Leave, Reports
- **Real-time layer**: Socket.IO client with auto-reconnect, event bus, live toasts, live KPIs — with a built-in mock simulator so the demo runs fully offline
- **Enterprise UI system**: Shadcn-style primitives, command palette (`⌘K`), glassmorphic sticky headers, skeletons, empty/error states everywhere
- **Data architecture**: Axios client + service layer + TanStack Query hooks + Zustand stores, backed by a deterministic mock DB (swap 3 lines to go live)
- **Delight**: Framer Motion micro-interactions, animated counters, Recharts analytics, CSV/Excel/PDF exports

## ✦ Quick start

```bash
npm install
npm run dev      # → http://localhost:3100
```

Demo credentials: **manager@shifttrack.io** / any password with 8+ chars

## ✦ Going live with a real backend

1. Set `NEXT_PUBLIC_API_URL` to your server
2. Set `NEXT_PUBLIC_WS_URL` to your Socket.IO server
3. Delete `src/mock` — the services in `src/services` already speak REST

---

Built with Next.js 15 (App Router) · TypeScript · Tailwind · Shadcn UI · Framer Motion · TanStack Query · Zustand · Zod · Recharts · Socket.IO · Lucide
