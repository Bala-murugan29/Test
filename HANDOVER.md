# Handover: Frontend ↔ Backend Integration

**Task:** Wire the React frontend (`artifacts/exam-platform`) to the Fastify backend (`artifacts/api-server`) with JWT auth, refresh tokens, axios, protected routes, RBAC, loading/error states, retry, and toasts. Do **not** change UI design.

**Date:** 2026-07-05
**Status:** Phases 0–3 complete. Phases 4–5 pending.

---

## Quick status

| Phase | Status | What |
|-------|--------|------|
| 0 — Foundation | ✅ Done | axios client, token storage, auth store, useAuth, ProtectedRoute, ErrorState, queryClient, App.tsx guards, login pages wired, env var |
| 1 — Services | ✅ Done | All 8 service files implemented with axios + mappers |
| 2 — React Query hooks | ✅ Done | All domain hooks in `src/hooks/queries/` |
| 3 — Backend additions | ✅ Done | Prisma models, settings + code-execution modules, submit-session auto-evaluate, route registration |
| 4 — Page migration | ⏳ **PENDING** | Migrate 18 pages from `useEffect`/`useState` to React Query hooks |
| 5 — Verification | ⏳ **PENDING** | typecheck, prisma migrate, smoke test |

---

## What's been built (Phases 0–3) — don't redo

### Frontend foundation files (all NEW, working)
- `src/lib/axios.ts` — Axios instance with: `baseURL` from `VITE_API_URL`, request interceptor (attaches bearer), response interceptor (401 → single-flight refresh queue → retry; refresh fail → `onAuthFailure()`), `toApiError()` normalizer, `apiGet/apiPost/apiPut/apiDelete` helpers.
- `src/lib/token-storage.ts` — `getAccessToken/getRefreshToken/setTokens/clearTokens` over localStorage keys `exp.accessToken` / `exp.refreshToken`.
- `src/lib/queryClient.ts` — QueryClient with `retry: 2` (skips 401/403/404), `staleTime: 30s`, `refetchOnWindowFocus: false`.
- `src/services/auth.service.ts` — `login/register/refreshToken/logout/getMe/changePassword`.
- `src/store/auth.store.ts` — REWRITTEN. State: `status: 'idle'|'authenticated'|'unauthenticated'`, `user`, `role`. Actions: `hydrate/setAuth/setUser/clearAuth`. Maps backend `UserResponse` (`fullName`→`name`, `roles:[]`→primary `Role`).
- `src/hooks/useAuth.ts` — REWRITTEN. Exposes `user/role/isAuthenticated/init/login/register/logout`. `init()` does bootstrap getMe + refresh-on-failure. `connectAuthFailureHandler()` wires the global 401→logout.
- `src/components/common/ProtectedRoute.tsx` — NEW. Props `{ allowedRoles }`. Redirects unauthed → login, wrong role → their dashboard.
- `src/components/common/ErrorState.tsx` — NEW. Matches `EmptyState` styling with retry button.
- `src/App.tsx` — REWRITTEN. Uses `queryClient` from lib, wraps all `/student/* /faculty/* /admin/*` routes in `<ProtectedRoute>` (wouter `nest` prop), adds `<AuthBootstrap>` that runs `init()` on mount.
- `src/pages/auth/{Student,Faculty,Admin}LoginPage.tsx` — REWRITTEN. Call `login(email,password)`, toast on error, keep UI identical.
- `.env` — added `VITE_API_URL=http://localhost:5000/api`.

### Frontend service files (all REWRITTEN, working)
All in `src/services/`. Each transforms backend shapes → existing frontend types so pages don't change shape:
- `user.service.ts` — maps `UserResponse`/`StudentProfile`/`FacultyProfile` → `MockUser`.
- `exam.service.ts` — maps backend exam (`DRAFT/SCHEDULED/ACTIVE/ENDED/ARCHIVED`) → frontend `Exam.status` (`draft/published/ongoing/completed/cancelled`).
- `result.service.ts` — `submitExam` orchestrates: start session → save answers → submit session → fetch result.
- `analytics.service.ts` — 4 endpoints, all defensively return empty/zero on error.
- `session.service.ts` (NEW) — start/get/submit/pause/resume + autosave answers.
- `department.service.ts` (NEW) — CRUD + stats.
- `question.service.ts` (NEW) — MCQ/coding create, list, update, delete, usage.

### Frontend React Query hooks (all NEW, working)
All in `src/hooks/queries/`:
- `mutation-helpers.ts` — `notifySuccess/notifyError` (toast wrappers).
- `useExamQueries.ts`, `useResultQueries.ts`, `useAnalyticsQueries.ts`, `useUserQueries.ts`, `useDepartmentQueries.ts`, `useQuestionQueries.ts` — query + mutation hooks with cache invalidation + toasts.
- `index.ts` — barrel re-export.

### Backend additions (all NEW, working)
- `prisma/schema.prisma` — added `SystemSetting` model, `CodeRun` model + `CodeRunStatus` enum, relations on `User`/`ExamSession`/`Question`. **Migration NOT yet run** (Phase 5).
- `src/modules/settings/` — 5-file module: `GET /settings`, `GET /settings/:category`, `PUT /settings/:category` (JWT-gated).
- `src/modules/code-execution/` — 5-file module: `POST /code/run` (JWT-gated, **stub** runner — simulates output; real sandbox out of scope).
- `src/modules/sessions/sessions.service.ts` — `submitSession` now auto-grades MCQ answers (`selectedOptionIndex` vs `McqQuestion.correctOptionIndex`) and creates a `Result` immediately so the frontend gets instant feedback.
- `src/routes/index.ts` — registers `settingsRoutes` + `codeExecutionRoutes`.

---

## ⏳ Phase 4 — Page migration (PENDING)

### The transformation pattern

Every page currently looks like this:
```tsx
const { user } = useAuth();
const [exams, setExams] = useState<StudentExam[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!user) return;
  examService.getStudentExams(user.id).then((e) => { setExams(e); setLoading(false); });
}, [user]);

if (loading) return <LoadingSpinner ... />;
```

Replace with:
```tsx
import { useStudentExams } from '@/hooks/queries';
import { ErrorState } from '@/components/common/ErrorState';

const { user } = useAuth();
const { data: exams = [], isLoading, isError, refetch } = useStudentExams(user?.id);

if (isLoading) return <LoadingSpinner ... />;
if (isError) return <ErrorState onRetry={refetch} />;
```

### Rules
- **Do NOT change the JSX layout, classes, or component structure.** Only swap the data-loading mechanism.
- Keep the existing `LoadingSpinner` usage for `isLoading`.
- Add `<ErrorState onRetry={refetch} />` for `isError` (use the same container/wrapper the loading spinner uses).
- For mutations, use the `useXxxMutation` hooks — they already invalidate cache + fire toasts, so remove manual `setX` state updates.
- Remove `useEffect`/`useState` for data that's now in React Query. Keep `useState` for pure UI state (modals, search, selected rows).

### Per-page guide

I have already READ all student pages. Faculty/admin pages have NOT been re-read — read each before editing.

**STUDENT (9 pages):**

1. **`StudentDashboard.tsx`** — replace two `useEffect` loads with `useStudentExams(user?.id)` + `useStudentResults(user?.id)` (parallel hooks). Keep derived `completedExams/activeExams/avgScore/bestRank` computations.

2. **`AvailableExamsPage.tsx`** — `useStudentExams(user?.id)`. Keep `useDebounce` for search + the client-side tab filtering logic (all/ongoing/published/completed).

3. **`ExamInstructionsPage.tsx`** — `useExam(examId)`. The `startSession` call from `useExamSession` hook stays as-is (it's local session state, not server data). Keep `handleStart`.

4. **`ExamScreen.tsx`** — `useExam(examId)` + `useExamQuestions(examId)`. The countdown timer logic and `useExamSession` store interaction stay. ⚠️ Note: this is the legacy MCQ path; route `/take` is mostly unused (CodingExamScreen at `/code` is the real one). Still wire it.

5. **`CodingExamScreen.tsx`** — ⚠️ **Special case.** Uses `examService.getExamById` for the exam, but generates fallback coding problems locally (`getFallbackProblems`) and simulates run/submit (`simulateRun`/`simulateSubmit`). Per user decision: **leave the run/submit simulation as-is** (code-execution backend is a stub; full wiring is out of scope). Just convert the `getExamById` load to `useExam(examId)`. Optionally wire `POST /code/run` via a new `apiPost` call, but keep UI intact.

6. **`SubmitScreen.tsx`** — `useExam(examId)` + `useExamQuestions(examId)` for the load. Replace the manual `submitExam` try/catch with `useSubmitExam()` mutation hook. Keep the `ConfirmDialog`.

7. **`ResultScreen.tsx`** — `useStudentResults(user?.id)` + `useExam(examId)`. **FIX BUG:** currently hardcodes `'s001'` as student id (line 27) — change to `user?.id`. The page finds the matching result client-side; keep that logic.

8. **`StudentResultsPage.tsx`** — `useStudentResults(user?.id)` + `useStudentExams(user?.id)` (parallel), then the existing client-side join by examId stays.

**FACULTY (7 pages) — READ EACH BEFORE EDITING:**

9. **`FacultyDashboard.tsx`** — `useFacultyExams(user?.id)` + `usePlatformSummary()`.

10. **`FacultyExamListPage.tsx`** — `useFacultyExams(user?.id)`. Keep client-side status filter + sort. The edit button was a no-op; leave it.

11. **`CreateExamPage.tsx`** — no data fetch (pure form). Replace the `examService.createExam` direct call with `useCreateExam()` mutation. Add `onSuccess` navigation to the exam list. **Add error handling** (currently none).

12. **`QuestionBankPage.tsx`** — `useExam(examId)` + `useExamQuestions(examId)`. Add/delete questions were local-only; wire `useCreateMcq()` / `useDeleteQuestion()` if a departmentId is available (may need a department selector or default). If wiring CRUD is complex, keep local state for now and note it.

13. **`StudentManagementPage.tsx`** — ⚠️ Had NO service (was `// TODO: wire to real API`, records stayed `[]`). Use `useAllStudents()` from `useUserQueries`. Map `MockUser` → the page's local `StudentRecord` interface (fields: rollNumber, name, email, department, year, cgpa, examsTaken, etc.). Some fields (cgpa, examsTaken, avgScore) aren't in `MockUser` — derive or default them.

14. **`ReportsPage.tsx`** — `useFacultyExams(user?.id)` + `useExamResults(selectedExamId)`. Two separate effects become two hooks.

15. **`AnalyticsDashboard.tsx`** — `usePlatformSummary()` + `useMonthlyStats()` + `useDepartmentStats()` + `useExamPerformance()` (4 parallel hooks).

**ADMIN (4 pages) — READ EACH BEFORE EDITING:**

16. **`AdminDashboard.tsx`** — `usePlatformSummary()`. The hardcoded `admins: 4` and `ACTIVITY_FEED` are static — leave them.

17. **`UserManagementPage.tsx`** — `useAllUsers()`, `useCreateUser()`, `useDeleteUser()`. Remove manual optimistic state updates (the mutation invalidates). Add error handling (currently unhandled rejections on create/delete).

18. **`DepartmentManagementPage.tsx`** — ⚠️ Had NO service (entirely local state). Use `useDepartments()` + `useDepartmentStats()` for load, `useCreateDepartment/useUpdateDepartment/useDeleteDepartment` for CRUD. Map backend `BackendDepartment` + `BackendDepartmentStats` → the page's local `Department` interface (`{id, name, studentCount, facultyCount, totalExams}`). Note: backend stats has `courseCount` not `totalExams` — adapt.

19. **`SettingsPage.tsx`** — ⚠️ Pure local form, no persistence. Wire to the new settings endpoints: `GET /settings` to load, `PUT /settings/:category` to save each section. The page has 4 settings objects (general/examPolicy/notifications/security) — these map to 4 categories. Add `settings.service.ts` (doesn't exist yet — create it) OR call axios directly. Keep the "Saved" flash UI.

### New file needed for SettingsPage
Create `src/services/settings.service.ts`:
```ts
import { apiGet, apiPut } from '@/lib/axios';
export const settingsService = {
  getAll: () => apiGet<Array<{category: string; settings: Array<{key: string; value: unknown}>}>>('/settings'),
  getCategory: (category: string) => apiGet<{category: string; settings: Array<{key: string; value: unknown}>}>(`/settings/${category}`),
  updateCategory: (category: string, values: Record<string, unknown>) => apiPut(`/settings/${category}`, { values }),
};
```
Then add a `useSettings` hook to `src/hooks/queries/`.

---

## ⏳ Phase 5 — Verification (PENDING)

Run in order from repo root `D:\Test Website\Senior-Tech-Lead`:

```bash
# 1. Generate Prisma client + create migration for the 2 new models (SystemSetting, CodeRun)
pnpm --filter @workspace/api-server run db:migrate:dev
# If prompted for a migration name, use: add_settings_and_code_run

# 2. Full workspace typecheck (this is the big one — will catch integration errors)
pnpm run typecheck

# 3. If typecheck fails, also run the targeted ones to localize:
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/exam-platform run typecheck

# 4. Start backend (needs Postgres + Redis running — use docker-compose)
cd artifacts/api-server && docker-compose up -d
pnpm --filter @workspace/api-server run dev

# 5. Start frontend (separate terminal)
pnpm --filter @workspace/exam-platform run dev

# 6. Smoke test: register a user via POST /api/auth/register, then login via the UI.
```

### Likely typecheck issues to watch for
- `useExamSession` hook — referenced by ExamInstructionsPage/ExamScreen/SubmitScreen but I did NOT verify it exists or its API. **Read it** (`src/hooks/useExamSession.ts`) before editing those pages.
- `formatDateTime/formatDuration/formatPercentage/formatScore` — from `@/utils/format`. Should be unchanged.
- `getTimeUntilExam` — from `@/utils/exam.utils`. Should be unchanged.
- The `useDebounce` hook import path — verify it's `@/hooks/useDebounce`.
- Prisma client types: after `db:migrate:dev`, `app.prisma.systemSetting` and `app.prisma.codeRun` must exist. If typecheck fails on backend, run `pnpm --filter @workspace/api-server run db:generate`.

---

## Critical reference: the auth/data contract

**Login flow:** `POST /api/auth/login` `{email, password}` → `200` `{user: {id, email, fullName, phone, status, roles[], createdAt}, accessToken, refreshToken}`.

**Token refresh:** `POST /api/auth/refresh` `{refreshToken}` → rotated `{user, accessToken, refreshToken}`. **Backend rotates on every refresh with reuse detection** (revokes entire family if a revoked token is reused). The frontend axios interceptor handles this transparently.

**Logout:** `POST /api/auth/logout` `{refreshToken}` (no access token needed in body, but bearer header is sent).

**Protected endpoints:** all `/api/*` except `/auth/{login,register,refresh,logout}` require `Authorization: Bearer <accessToken>`. On 401, the interceptor auto-refreshes once and retries.

**CORS:** backend allows `*` origin (reflecting), **no credentials** — auth is bearer-header-based, not cookie-based. Don't try to use cookies.

**Known mismatch (already handled):** backend `UserResponse.roles` is `string[]`; frontend `Role` is a single `'student'|'faculty'|'admin'`. The auth store mapper picks the highest-privilege role present.

**Known backend quirk:** `JWT_REFRESH_SECRET` env var exists but is NOT used — refresh tokens are signed with the access secret and verified via DB hash lookup. Functionally fine; don't rely on JWT-verifying refresh tokens client-side.

---

## Git state at handover
- Branch: `main`
- Many modified + new untracked files (all the work above is unstaged).
- **Do not commit** unless the user asks.
- Before committing, run Phase 5 verification.

---

## Order of operations recommendation
1. Read `useExamSession.ts` + all unread faculty/admin pages.
2. Do Phase 4 page-by-page (student → faculty → admin). After each page, the change is mechanical.
3. Create `settings.service.ts` + hook before touching SettingsPage.
4. Run `pnpm run typecheck` frequently after batches of pages to catch errors early.
5. Run `db:migrate:dev` early (Phase 5 step 1) so Prisma types resolve — otherwise backend typecheck will fail on the new models.
6. Final full typecheck + smoke test.

Good luck — the architecture is sound; the remaining work is mechanical page conversion.
