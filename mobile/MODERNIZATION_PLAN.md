# Workix Mobile Modernization Plan
## Field Technician Experience Refresh

**Date:** 2025-12-03  
**Owner:** Mobile Guild / Field Tech Taskforce  

---

## 1. Executive Summary
Current mobile experience requires 4–6 taps for core actions, lacks gesture shortcuts, and does not deliver the offline-first guarantees technicians rely on in remote facilities. This plan closes those gaps by introducing a technician-first navigation shell, a resilient offline engine, and high-velocity task tooling (scan, voice, quick templates) while remaining compatible with the existing CAFM backend.

---

## 2. Current State Assessment
| Area | Findings | Impact |
|------|----------|--------|
| Navigation & UX | Bottom tabs + deep stack; no swipe shortcuts, no FAB, dense cards on detail screens. | Slow task execution; two-handed use; cognitive load in low-light or high-pressure scenarios. |
| Task Processing | Status updates hidden in menus; manual data entry for observations/actions; no templates or quick-complete. | Increased tap count and inconsistent reporting. |
| Media Capture | Basic Expo Camera picker; no QR/barcode scan, annotation, or background upload. | Friction when documenting issues or identifying assets. |
| Offline & Sync | Async queue enqueues writes but fails promise; no conflict resolution, no telemetry; GETs fail without cache. | Technicians lose work offline; trust in app erodes. |
| Performance | Cold start >2s, multiple blocking fetches, heavy detail rendering. | Perceived sluggishness; battery drain from redundant requests. |
| Security/Access | SecureStore for token only; no biometric/PIN lock; offline queue stored plain in AsyncStorage. | Device loss risk; compliance exposure. |
| Notifications | No push infrastructure or priority alerts. | Missed escalations, delays in acknowledging new jobs. |
| Knowledge & Tools | No manuals, troubleshooting library, or hazard briefings embedded. | Techs rely on external apps/paper PDFs. |

---

## 3. Technician-Centric Experience Goals
1. **Two-Tap Action:** Accept, start, and complete a work order in ≤2 interactions.
2. **Offline Confidence:** Queue and sync tasks, notes, parts usage, and media with clear status regardless of connectivity.
3. **Rapid Input:** Scan-first workflows, voice dictation, templated text, and quick photo markup.
4. **Situational Awareness:** Real-time priority filters, hazard badges, and turn-by-turn routing to sites.
5. **Secure & Reliable:** Biometric unlock, encrypted storage, proactive conflict handling, and observable telemetry.

---

## 4. Target Architecture Overview
```
┌──────────────────────────────────────────────────────────┐
│ React Native (Expo SDK 54)                              │
│  • React Navigation 7 (gesture-enabled)                 │
│  • Tamagui/React Native Paper design system             │
│  • Zustand store → migrating to RTK Query for data      │
│    - Normalized cache + delta sync                      │
│  • Background tasks (expo-task-manager) for sync/media  │
│  • VisionCamera + ML Kit for QR/barcode + annotation    │
│  • React Native Voice for voice-to-text                 │
├───────────────────┬─────────────────────────────────────┤
│ Offline Layer      │ Workflows                          │
│  • SQLite/WatermelonDB (encrypted)                      │
│  • Conflict policies (last-write + manual review)       │
│  • Cached lists, task timelines, manuals                │
│  • Sync telemetry + retry/backoff                       │
├───────────────────┴─────────────────────────────────────┤
│ CAFM Backend (existing Express/Postgres APIs)           │
│  • New lightweight endpoints as needed (delta feeds,    │
│    media upload tokens, hazard summaries)               │
└──────────────────────────────────────────────────────────┘
```

Key Modules:
- **Navigation Shell:** Technician Home, My Queue, Search/Scan, Quick Actions overlay.
- **Sync Engine:** Queue manager, conflict reconciler, telemetry service.
- **Task Toolkit:** Media capture, voice dictation, note templates, parts lookup.
- **Knowledge Hub:** Offline manuals, hazard cards, micro-learning clips.

---

## 5. Feature Backlog & Prioritization
### Must-Have (Phase 1)
1. Technician Home dashboard with swipe-to-accept/complete, persistent FAB.
2. Offline-first work order list & detail (encrypted cache, sync indicators).
3. QR/barcode asset scanning linked to work order creation/assignment.
4. Voice-to-text for observations/actions, with templated quick notes.
5. Background photo capture + queued upload with basic annotation.
6. Biometric/PIN app unlock + encrypted offline queue.
7. Push notification scaffolding with priority badges.
8. Route-to-site with hazard summary cards.

### Should-Have (Phase 2)
1. Parts inventory lookup with quick check-in/out.
2. In-app manuals & troubleshooting guides (searchable, offline).
3. SLA timers + escalations (visual countdowns, alerts).
4. Sync conflict review UI (technician resolves, supervisor override).
5. Telemetry dashboard (sync success, offline duration, crash reports).

### Nice-to-Have (Phase 3)
1. Micro-learning video library (<60 sec) embedded in work order.
2. Wearable companion notifications (watch, heads-up display).
3. Predictive ETA suggestions based on task history + traffic.
4. AI-generated recommended actions using historical data.

---

## 6. Implementation Roadmap
| Sprint Window | Focus | Key Deliverables |
|---------------|-------|------------------|
| Weeks 0–2 | Discovery & Design | Tap-count baseline, navigation prototypes, color tokens for sun/dark, ergonomic testing. |
| Weeks 3–6 | Core Shell & Auth | New navigation stack, FAB, biometric/PIN lock, offline cache scaffolding, redux/RTK migration start. |
| Weeks 7–10 | Task Toolkit | Swipe actions, quick templates, QR scanning, voice notes, background media queue. |
| Weeks 11–14 | Logistics & Knowledge | Maps routing, hazard cards, manuals hub, push notifications MVP. |
| Weeks 15–18 | Hardening & Pilot | Sync conflict UI, telemetry integration, performance tuning, battery tests, beta rollout. |
| Weeks 19+ | Phase 2 Features | Inventory, SLA escalations, training content, predictive insights. |

Each sprint will include:
- Usability sessions with 3–5 technicians.
- Telemetry review (crash/logging) and regression tests (offline/online, sync).  
- Security review checkpoints (encrypted storage, secure transport).

---

## 7. Performance & Reliability KPIs
| Metric | Target |
|--------|--------|
| Cold start | ≤ 1.8 s on mid-tier Android (Hermes + prefetch). |
| Dashboard load | ≤ 800 ms from cache; ≤ 1.5 s fresh over 3G. |
| Sync success | ≥ 99% transactions within 10 s of connectivity return. |
| Tap count to complete work order | ≤ 6 interactions (from acceptance to completion). |
| Crash-free sessions | ≥ 99.5%. |
| Battery impact | ≤ 5% drain per active hour. |
| Offline coverage | All CRUD actions queue safely for ≥24 hours. |

---

## 8. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Existing APIs lack delta endpoints | Coordinate backend enhancements (delta feed, media upload tokens). |
| Device fragmentation (rugged hardware) | Set up device lab matrix; use responsive layout + haptics. |
| Offline conflicts produce data drift | Implement conflict policy (timestamp priority + manual review queue). |
| Adoption resistance | Run field pilot, gather feedback, provide micro-learning modules. |
| Budget constraints | Prioritize must-haves; reuse Expo ecosystem; leverage open-source libraries. |

---

## 9. Next Actions
1. Approve navigation & UI design explorations (thumb reach, FAB placements, dark/light tokens).
2. Align backend team on required delta-sync/media endpoints.
3. Stand up telemetry/analytics (Sentry + custom sync logs).
4. Schedule technician feedback loop (bi-weekly ride-alongs, remote interviews).
5. Kick off Sprint 1 with navigation shell and offline cache spike.

---

*Prepared by GitHub Copilot (GPT-5-Codex) – Workix mobile modernization partner.*
