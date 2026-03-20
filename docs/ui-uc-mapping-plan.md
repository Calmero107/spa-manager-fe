# UI UC Mapping Plan

This document maps the current backend capabilities to the frontend implementation plan for `spa-manager-fe`.

---

## 1. Current frontend base status

Already scaffolded:
- React + TypeScript + Vite
- React Router
- TanStack Query
- Axios API client
- Auth provider + login flow
- Protected route
- App shell / dashboard
- Customers page
- Scheduling playground page

Current mapped backend endpoints:
- `POST /auth/login`
- `GET /auth/me`
- `GET /customers`
- `GET /customers/{id}` (ready for future detail page)
- `POST /customers`
- `POST /scheduling/slots/query`
- `POST /scheduling/slots/lock`
- `POST /sessions/{sessionId}/schedule`
- `POST /appointments/{appointmentId}/cancel`
- `POST /appointments/{appointmentId}/reschedule`
- `POST /appointments/{appointmentId}/check-in`
- `POST /sessions/{sessionId}/complete`

---

## 2. Recommended UI slice order

### Slice 1 — Dashboard
Purpose:
- act as landing page after login
- show which backend capabilities are already usable
- provide quick links to operational screens

Screen:
- `/dashboard`

Contents:
- current backend capability summary
- quick navigation cards
- environment / backend status note
- latest login user / role info

Status:
- base screen already created

Next improvement:
- replace static feature list with real API health / profile / stats when available

---

### Slice 2 — Customers
Purpose:
- map the existing customer APIs into a practical operator-facing UI

Screens:
- `/customers`
- future: `/customers/new`
- future: `/customers/:customerId`

Backend mapping:
- `GET /customers?branchId=...`
- `GET /customers/{customerId}`
- `POST /customers`

Recommended UI scope:
1. customer list page
2. create customer drawer/modal/page
3. customer detail page

Immediate FE tasks:
- add create customer form
- add customer detail page
- add query invalidation after create

---

### Slice 3 — Scheduling
Purpose:
- map the scheduling core already present in backend

Screens:
- `/scheduling`
- future: `/scheduling/session/:sessionId`

Backend mapping:
- `POST /scheduling/slots/query`
- `POST /scheduling/slots/lock`
- `POST /sessions/{sessionId}/schedule`

Recommended UI flow:
1. choose or input session id
2. query available slots
3. select one slot
4. lock slot
5. confirm scheduling
6. show returned appointment id / booking result

Immediate FE tasks:
- add schedule confirmation action
- generate `X-Request-Id` in FE for write APIs
- show lock expiry countdown
- render success/error states clearly

---

### Slice 4 — Appointment lifecycle
Purpose:
- complete the operator workflow after scheduling

Screens:
- `/appointments/:appointmentId`
- future: `/appointments`

Backend mapping:
- `POST /appointments/{appointmentId}/cancel`
- `POST /appointments/{appointmentId}/reschedule`
- `POST /appointments/{appointmentId}/check-in`
- `POST /sessions/{sessionId}/complete`

Recommended UI flow:
1. show appointment detail summary
2. show action buttons depending on current state:
   - cancel
   - reschedule
   - check-in
   - complete session
3. for reschedule:
   - query new slots
   - lock new slot
   - submit reschedule
4. for complete session:
   - technician id input/select
   - result note input

Immediate FE tasks:
- add appointment lifecycle page
- create mutation hooks for cancel/reschedule/check-in/complete
- show transition-safe buttons only
- persist and display `appointmentId` / `sessionId` through the flow

---

## 3. Concrete implementation plan by phase

### Phase A — stabilize current base
- [x] project scaffold
- [x] auth provider
- [x] protected routes
- [x] dashboard page
- [x] customers list page
- [x] scheduling playground page
- [x] alias `@/*`
- [x] production build passing

### Phase B — customer management usability
- [ ] create customer form page/modal
- [ ] customer detail page
- [ ] reusable API error banner
- [ ] loading/empty states cleanup

### Phase C — scheduling usable flow
- [ ] add schedule submit mutation
- [ ] add `X-Request-Id` helper for write flows
- [ ] capture returned appointment id after scheduling
- [ ] show lock countdown
- [ ] nicer slot card / selection UX

### Phase D — appointment lifecycle screen
- [ ] appointment detail page
- [ ] cancel action UI
- [ ] reschedule action UI
- [ ] check-in action UI
- [ ] complete session UI

---

## 4. Data / state strategy recommendation

### Server state
Use TanStack Query for:
- customer list/detail
- current user
- scheduling query results
- appointment detail (when backend endpoint exists)

### Client state
Use local component state for:
- selected slot
- active lock id
- modal visibility
- temporary appointment id after scheduling

### Auth state
Keep in AuthProvider:
- access token
- current user bootstrap
- logout handling

---

## 5. Suggested next FE action

The most practical next implementation step is:

1. **finish scheduling screen** so it can fully schedule a session end-to-end
2. then build **appointment lifecycle page** to map cancel / reschedule / check-in / complete

That will give the frontend a usable operator workflow aligned with the backend currently implemented.
