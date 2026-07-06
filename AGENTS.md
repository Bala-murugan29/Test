# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project overview

This is a **pnpm monorepo** for an online exam platform (student, faculty, and admin roles). It runs on **Replit** with Node.js 24 and uses a workspace layout that separates deployable apps (`artifacts/`) from shared libraries (`lib/`).

The main product UI lives in `@workspace/exam-platform`. The backend is `@workspace/api-server`. API contracts are defined in OpenAPI and codegen drives shared client and validation packages.

See also `replit.md` for human-oriented run notes and placeholders for architecture decisions as the project evolves.

## Repository layout

```
Senior-Tech-Lead/
├── AGENTS.md                 # This file — agent instructions (root)
├── replit.md                 # Human runbook / project notes
├── package.json              # Root scripts (typecheck, build)
├── pnpm-workspace.yaml       # Workspace packages + dependency catalog
├── tsconfig.base.json        # Shared TypeScript compiler options
├── tsconfig.json             # Project references for lib packages
│
├── artifacts/                # Deployable applications
│   ├── exam-platform/        # Main React SPA (Vite) — exam UI
│   ├── api-server/           # Fastify 5 API server
│   └── mockup-sandbox/       # UI component sandbox (shadcn/Radix playground)
│
├── lib/                      # Shared libraries (consumed by artifacts)
│   ├── api-spec/             # OpenAPI source of truth + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks + customFetch
│   ├── api-zod/              # Generated Zod schemas for API validation
│   └── db/                   # Drizzle ORM schema + Postgres client
│
└── scripts/                  # Workspace utility scripts (post-merge, etc.)
```

### Package naming

All workspace packages use the `@workspace/*` scope:

| Package | Path | Purpose |
|---------|------|---------|
| `@workspace/exam-platform` | `artifacts/exam-platform` | Main frontend |
| `@workspace/api-server` | `artifacts/api-server` | Backend API |
| `@workspace/mockup-sandbox` | `artifacts/mockup-sandbox` | UI sandbox |
| `@workspace/api-spec` | `lib/api-spec` | OpenAPI + codegen |
| `@workspace/api-client-react` | `lib/api-client-react` | Generated API client |
| `@workspace/api-zod` | `lib/api-zod` | Generated Zod schemas |
| `@workspace/db` | `lib/db` | Database layer |
| `@workspace/scripts` | `scripts` | Utility scripts |

## Commands

Use **pnpm only** (npm/yarn are blocked by the root `preinstall` script).

```bash
# Install dependencies
pnpm install

# Full workspace typecheck (libs + artifacts + scripts)
pnpm run typecheck

# Typecheck shared libs only
pnpm run typecheck:libs

# Full build (typecheck + package builds)
pnpm run build

# API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Exam platform frontend (requires PORT and BASE_PATH env vars)
pnpm --filter @workspace/exam-platform run dev

# Regenerate API client + Zod schemas from OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Push DB schema to Postgres (dev only)
pnpm --filter @workspace/db run push
```

### Required environment

| Variable | Used by | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `@workspace/api-server` | Postgres connection string |
| `JWT_ACCESS_SECRET` | `@workspace/api-server` | JWT access token secret |
| `JWT_REFRESH_SECRET` | `@workspace/api-server` | JWT refresh token secret |
| `REDIS_URL` | `@workspace/api-server` | Redis connection string |
| `PORT` | `@workspace/exam-platform` (Vite) | Required at config load time |
| `BASE_PATH` | `@workspace/exam-platform` (Vite) | Required at config load time |

## Architecture

### API-first workflow

1. **Edit the contract** in `lib/api-spec/openapi.yaml`.
2. **Run codegen**: `pnpm --filter @workspace/api-spec run codegen`
3. **Implement routes** in `artifacts/api-server/src/modules/`
4. **Consume hooks** from `@workspace/api-client-react` in frontend apps
5. **Validate** with schemas from `@workspace/api-zod` on the server

Important constraints:

- Do **not** change the OpenAPI `info.title` from `"Api"` — Orval output paths depend on it (`api.ts`, import paths).
- Generated files live under `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` — **do not hand-edit**; regenerate instead.
- API routes are mounted at `/api` (see `artifacts/api-server/src/app.ts`).

### Database workflow

**Current state:** The project uses a dual ORM setup:

- **`@workspace/api-server`** uses **Prisma** (`@prisma/client`) with a comprehensive schema at `artifacts/api-server/prisma/schema.prisma` (23 models).
- **`@workspace/db`** uses **Drizzle ORM** with a PostgreSQL pool but has an empty schema (`export {}`).

The `@workspace/db` package is intended for Drizzle-based access but is not currently used by the api-server. The api-server manages its own Prisma setup independently.

- Prisma schema: `artifacts/api-server/prisma/schema.prisma`
- Drizzle schema: `lib/db/src/schema/` (currently empty)
- Dev schema push (Drizzle): `pnpm --filter @workspace/db run push`
- Prisma migrations: `pnpm --filter @workspace/api-server run db:migrate:dev`
- Post-merge hook (`scripts/post-merge.sh`) runs `pnpm install --frozen-lockfile` and `pnpm --filter @workspace/db run push`.

#### Prisma models (23 total)

| Domain | Models |
|--------|--------|
| Auth & Users | `User`, `RefreshToken` |
| Roles & Permissions | `Role`, `Permission`, `UserRole`, `RolePermission` |
| Departments & Courses | `Department`, `StudentProfile`, `FacultyProfile`, `Course`, `CourseInstructor` |
| Enrollments | `Enrollment` |
| Questions | `Question`, `McqQuestion`, `CodingQuestion` |
| Exams | `Exam`, `ExamQuestion` |
| Sessions | `ExamSession`, `StudentAnswer` |
| Results | `Result`, `Certificate` |
| Notifications | `Notification` |
| Audit | `AuditLog` |

### Frontend (`exam-platform`)

Stack: React 19, Vite 7, Tailwind CSS 4, shadcn/ui (Radix), Wouter (routing), TanStack Query, Zustand.

```
artifacts/exam-platform/src/
├── App.tsx              # Routes (wouter Switch/Route)
├── pages/               # Route-level pages by role (student, faculty, admin, auth)
├── components/
│   ├── ui/              # shadcn/ui primitives — prefer extending over reinventing
│   ├── layout/          # DashboardLayout, Sidebar, AuthLayout, ExamLayout
│   ├── exam/            # Exam-specific UI (CodeEditor, QuestionNavigator, etc.)
│   ├── common/          # Shared components (RoleGuard, PageHeader, etc.)
│   └── charts/          # Recharts wrappers
├── hooks/               # useAuth, useTimer, useTheme, use-toast
├── store/               # Zustand stores (auth, exam session, theme)
├── services/            # Data access layer (stub implementations — wire to API)
├── types/               # Domain TypeScript types
└── utils/               # Pure helpers
```

Path alias: `@/` → `src/` (configured in `vite.config.ts`).

**Current state:** The exam platform services are **stubbed** — all service methods throw "Not implemented — wire to API". The `data/` directory has been cleared of all mock data. When wiring real API calls, replace service implementations with `@workspace/api-client-react` hooks — keep the service layer as the integration boundary where possible.

Roles and routes are defined in `App.tsx`: student (`/student/*`), faculty (`/faculty/*`), admin (`/admin/*`).

### Backend (`api-server`)

```
artifacts/api-server/src/
├── index.ts             # Server entry - calls buildApp() and startApp()
├── app.ts               # Fastify app factory (CORS, helmet, cookie, JWT, rate-limit, /api prefix)
├── config/
│   └── env.ts           # Zod-validated environment variables
├── infrastructure/
│   ├── cache/
│   │   └── redis.ts     # Redis client
│   └── database/
│       └── prisma.ts    # PrismaClient instantiation
├── modules/
│   ├── auth/            # Authentication (register, login, refresh, logout, me, password)
│   ├── users/           # User management (CRUD, status, roles)
│   ├── students/        # Student profiles (CRUD, enrollments, results)
│   ├── faculty/         # Faculty profiles (CRUD, course assignments)
│   ├── departments/     # Departments & courses (CRUD, stats)
│   ├── exams/           # Exams (CRUD, publish, archive, questions)
│   ├── questions/       # Question bank (MCQ + coding, status, usage)
│   ├── sessions/        # Exam sessions (start, submit, pause, resume)
│   ├── autosave/        # Auto-save answers (single, batch)
│   ├── autosubmit/      # Auto-submit expired sessions
│   ├── results/         # Results & certificates (evaluate, issue)
│   ├── analytics/       # Analytics (summary, department, exam, monthly, student)
│   ├── reports/         # Reports (exam, student, department, CSV export)
│   └── health/          # Health check
├── routes/
│   └── index.ts         # Fastify plugin that registers all route modules
├── shared/
│   ├── errors/
│   │   └── http-error.ts
│   └── logger.ts        # Pino logger with pino-pretty in dev
└── types/
    └── fastify.d.ts     # Fastify type augmentation (prisma, redis, JWT)
```

Built with esbuild (`build.mjs`) to `dist/index.mjs` (ESM output). Uses **Prisma** for database access (`@prisma/client`), **Redis** for caching, and **bcrypt** for password hashing. Docker support available (`Dockerfile` + `docker-compose.yml` with Postgres 17 + Redis 7).

#### Module pattern

Each module follows this structure:

```
modules/<name>/
  <name>.schemas.ts      # Zod request/response schemas + inferred types
  <name>.repository.ts   # Prisma data access queries
  <name>.service.ts      # Business logic (receives FastifyInstance)
  <name>.controller.ts   # HTTP handlers (parses input, calls service, validates output)
  <name>.routes.ts       # FastifyPluginAsync registering routes on app
```

**Data flow:** `routes.ts` → `controller.ts` → `service.ts` → `repository.ts`. The `FastifyInstance` (with `prisma` and `redis`) is passed down via `request.server`. Controllers validate responses through Zod `.parse()`.

**Registration:** Import the routes plugin in `routes/index.ts` and register it with `await app.register(moduleRoutes)`.

#### API endpoints (83 total)

| Module | Method | Path | Description |
|--------|--------|------|-------------|
| **Auth** | POST | `/auth/register` | Register new user |
| | POST | `/auth/login` | Login (returns access + refresh tokens) |
| | POST | `/auth/refresh` | Refresh access token |
| | POST | `/auth/logout` | Revoke refresh token |
| | GET | `/auth/me` | Get current user profile |
| | PUT | `/auth/password` | Change password |
| **Users** | GET | `/users` | List users (paginated, filterable) |
| | GET | `/users/:id` | Get user by ID |
| | POST | `/users` | Create user |
| | PUT | `/users/:id` | Update user |
| | DELETE | `/users/:id` | Delete user |
| | PUT | `/users/:id/status` | Update user status |
| | GET | `/users/:id/roles` | Get user roles |
| | POST | `/users/:id/roles` | Assign role |
| | DELETE | `/users/:id/roles/:roleId` | Remove role |
| **Students** | GET | `/students` | List students |
| | GET | `/students/:userId` | Get student profile |
| | POST | `/students` | Create student profile |
| | PUT | `/students/:userId` | Update student profile |
| | GET | `/students/:userId/enrollments` | Get enrollments |
| | POST | `/students/:userId/enrollments` | Enroll in course |
| | DELETE | `/students/:userId/enrollments/:courseId` | Drop enrollment |
| | GET | `/students/:userId/results` | Get student results |
| **Faculty** | GET | `/faculty` | List faculty |
| | GET | `/faculty/:userId` | Get faculty profile |
| | POST | `/faculty` | Create faculty profile |
| | PUT | `/faculty/:userId` | Update faculty profile |
| | GET | `/faculty/:userId/courses` | Get course assignments |
| | POST | `/faculty/:userId/courses` | Assign course |
| | DELETE | `/faculty/:userId/courses/:courseId` | Unassign course |
| **Departments** | GET | `/departments` | List departments |
| | GET | `/departments/:id` | Get department |
| | POST | `/departments` | Create department |
| | PUT | `/departments/:id` | Update department |
| | DELETE | `/departments/:id` | Delete department |
| | GET | `/departments/:id/courses` | List courses |
| | POST | `/departments/:id/courses` | Create course |
| | GET | `/departments/:id/stats` | Department stats |
| **Exams** | GET | `/exams` | List exams |
| | GET | `/exams/:id` | Get exam |
| | POST | `/exams` | Create exam |
| | PUT | `/exams/:id` | Update exam |
| | PUT | `/exams/:id/publish` | Publish exam |
| | PUT | `/exams/:id/archive` | Archive exam |
| | GET | `/exams/:id/questions` | Get exam questions |
| | POST | `/exams/:id/questions` | Add question to exam |
| | DELETE | `/exams/:id/questions/:questionId` | Remove question |
| | PUT | `/exams/:id/questions/reorder` | Reorder questions |
| **Questions** | GET | `/questions` | List questions |
| | GET | `/questions/:id` | Get question |
| | POST | `/questions/mcq` | Create MCQ question |
| | POST | `/questions/coding` | Create coding question |
| | PUT | `/questions/:id` | Update question |
| | PUT | `/questions/:id/status` | Change status |
| | DELETE | `/questions/:id` | Delete question |
| | GET | `/questions/:id/usage` | Exam usage info |
| **Sessions** | POST | `/sessions` | Start exam session |
| | GET | `/sessions/:id` | Get session details |
| | GET | `/sessions/:id/questions` | Get session questions |
| | POST | `/sessions/:id/submit` | Submit exam |
| | GET | `/sessions/:id/status` | Get session status |
| | POST | `/sessions/:id/pause` | Pause session |
| | POST | `/sessions/:id/resume` | Resume session |
| | GET | `/exams/:examId/sessions` | List sessions for exam |
| **Auto Save** | PUT | `/sessions/:sessionId/answers` | Save answer(s) |
| | GET | `/sessions/:sessionId/answers` | Get saved answers |
| | PUT | `/sessions/:sessionId/answers/:questionId` | Save specific answer |
| **Auto Submit** | POST | `/autosubmit/trigger` | Trigger auto-submit |
| | GET | `/autosubmit/expired` | List expired sessions |
| | POST | `/autosubmit/sessions/:sessionId` | Auto-submit session |
| **Results** | GET | `/results` | List results |
| | GET | `/results/:id` | Get result |
| | POST | `/results/:id/evaluate` | Evaluate result |
| | POST | `/results/:id/certificate` | Issue certificate |
| | GET | `/results/:id/certificate` | Get certificate |
| | GET | `/students/:studentUserId/results` | Student results |
| | GET | `/exams/:examId/results` | Exam results |
| **Analytics** | GET | `/analytics/summary` | Platform summary |
| | GET | `/analytics/departments` | Department stats |
| | GET | `/analytics/exams` | Exam performance |
| | GET | `/analytics/monthly` | Monthly trends |
| | GET | `/analytics/students/:studentUserId` | Student performance |
| | GET | `/analytics/exams/:examId` | Single exam analytics |
| **Reports** | GET | `/reports/exam/:examId` | Exam report |
| | GET | `/reports/student/:studentUserId` | Student report |
| | GET | `/reports/department/:departmentId` | Department report |
| | GET | `/reports/export/exam/:examId` | Export exam CSV |
| | GET | `/reports/export/student/:studentUserId` | Export student CSV |

All authenticated routes require `Authorization: Bearer <token>` header.

### Mockup sandbox

`artifacts/mockup-sandbox` is a standalone Vite app for experimenting with UI components. It is **not** the main product — avoid putting product logic here.

### Docker workflow

The api-server includes Docker support for local development:

```bash
# Start Postgres 17 + Redis 7 + API server
cd artifacts/api-server
docker-compose up -d

# Run Prisma migrations inside the container
docker-compose exec api pnpm prisma migrate dev
```

Docker Compose services: `postgres` (5432), `redis` (6379), `api` (5000).

## Code conventions

### General

- **TypeScript strict mode** — shared options in `tsconfig.base.json`.
- **Minimize scope** — match existing patterns; don't refactor unrelated code.
- **pnpm catalog** — shared dependency versions live in `pnpm-workspace.yaml` under `catalog:`; reference as `"catalog:"` in package.json.
- Prefer **functional React components** and colocate logic in hooks or stores.

### Frontend patterns

- UI primitives: use `components/ui/*` (shadcn). Add new shadcn components via `components.json` if needed.
- Auth state: `useAuth()` hook backed by `store/auth.store.ts` (Zustand).
- Route guards: `components/common/RoleGuard.tsx`.
- Styling: Tailwind utility classes; `cn()` from `@/lib/utils` for conditional classes.
- Forms: react-hook-form + zod resolvers where forms exist.
- Services are stubbed — wire to `@workspace/api-client-react` hooks for real API calls.

### Backend patterns

- Add routes as Fastify plugins under `modules/<name>/<name>.routes.ts`, register in `routes/index.ts`.
- Feature modules follow the pattern: `schemas.ts` → `repository.ts` → `service.ts` → `controller.ts` → `routes.ts`.
- Validate request/response with Zod schemas (inline JSON Schema in route definitions for Swagger).
- Use the shared Pino logger — don't add ad-hoc `console.log` in production paths.
- All authenticated routes use JWT `preHandler`:
  ```ts
  const jwtPreHandler = async (req: { jwtVerify: () => Promise<void> }) => {
    await req.jwtVerify();
  };
  ```
- Use explicit type annotations for Prisma map callbacks to avoid implicit `any`.

### Generated code

After any OpenAPI change:

```bash
# Run codegen (from lib/api-spec directory to avoid Windows shell issues)
cd lib/api-spec
npx orval --config ./orval.config.ts

# Typecheck
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run typecheck
```

## Security and tooling guardrails

- **Do not disable** `minimumReleaseAge: 1440` in `pnpm-workspace.yaml` — it protects against supply-chain attacks.
- **Do not commit** secrets (`.env`, credentials). `DATABASE_URL` is env-only.
- **Do not hand-edit** files under `*/generated/` — regenerate via Orval.
- **Do not change** OpenAPI `info.title` from `"Api"`.
- Use `pnpm` exclusively; root `preinstall` rejects npm/yarn.
- `.local/` and `.cache/` are gitignored Replit runtime dirs — don't depend on them in source.
- Passwords are hashed with **bcrypt** (12 rounds). Never store plaintext passwords.
- JWT access tokens expire in **15 minutes**. Refresh tokens expire in **7 days** with rotation.

## Verification checklist

Before finishing a change:

1. Run `pnpm run typecheck` (or at minimum typecheck affected packages).
2. If OpenAPI changed, run codegen and confirm generated files updated.
3. If DB schema changed, run `pnpm --filter @workspace/api-server run db:migrate:dev`.
4. For frontend changes, confirm routes in `App.tsx` if adding new pages.
5. Keep diffs focused — no drive-by refactors or unrelated formatting.

## Where to make common changes

| Task | Location |
|------|----------|
| Add API endpoint | `lib/api-spec/openapi.yaml` → codegen → `artifacts/api-server/src/modules/<name>/` |
| Add backend module | `artifacts/api-server/src/modules/<name>/` (5 files) → register in `routes/index.ts` |
| Add DB table | `artifacts/api-server/prisma/schema.prisma` → `pnpm --filter @workspace/api-server run db:migrate:dev` |
| Add frontend page | `artifacts/exam-platform/src/pages/` → route in `App.tsx` |
| Add shared UI component | `artifacts/exam-platform/src/components/common/` or `components/ui/` |
| Wire frontend to API | `artifacts/exam-platform/src/services/*.service.ts` → use `@workspace/api-client-react` hooks |
| Add workspace dependency | Target package's `package.json` + run `pnpm install` |

## Nested instructions

For subdirectory-specific work, agents may also consult nested `AGENTS.md` files if present. More specific (deeper) instructions take precedence over this root file.
