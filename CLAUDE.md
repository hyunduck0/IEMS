# CLAUDE.md

## 명령어

- `npm run dev` — 개발 서버 실행 (http://localhost:3000)
- `npm run build` — 프로덕션 빌드
- `npm run start` — 빌드된 앱 실행
- `npm run lint` — ESLint 검사
- `npm run typecheck` — TypeScript 타입 검사 (`tsc --noEmit`)
- `npm run db:migrate` — `db/migrations/`의 SQL을 로컬 PostgreSQL(`iems` 데이터베이스)에 적용
- `npm run db:seed` — `equipment_events` 테이블을 샘플 데이터로 초기화(TRUNCATE 후 재삽입)

## 구조

- `PLAN.md` — 프로젝트 범위·Phase·승인 지점의 기준이다
- `SPEC.md` — 화면 흐름·데이터 구조·제약·완료 조건의 기준이다
- `backlog.json` — 작업 목록과 상태의 유일한 SSOT다
- `tools/backlog.mjs` — `backlog.json`을 읽고 쓰는 유일한 도구다
- `db/migrations/0001_init.sql` — `equipment_events` 테이블 스키마의 기준이다
- `db/migrations/0002_action_reports.sql` — `action_reports`(조치 보고) 테이블 스키마의 기준이다
- `db/seed.ts` — 샘플 데이터 생성 스크립트의 기준이다 (`npm run db:seed`)
- `lib/assignees.ts` — 조치 보고 담당자 선택지의 기준이다
- `lib/db.ts` — PostgreSQL 커넥션 풀(지연 초기화)의 기준이다
- `.env.local` — `DATABASE_URL` 등 환경변수 (git에 커밋하지 않음, `.env.local.example` 참고)
- `lib/types.ts` — `LogRecord` 타입 정의의 기준이다
- `lib/data.ts` — DB 조회·가동률 계산 로직의 기준이다 (모든 함수가 비동기)
- `lib/status.ts` — 상태 색상·아이콘 매핑의 기준이다 (DB에 의존하지 않아 클라이언트 컴포넌트에서도 안전하게 import 가능)
- `app/` — 라우트별 화면(대시보드/이력/통계/사용자관리)의 기준이다
- `components/` — 화면에서 재사용하는 UI 조각의 기준이다

## 항상 지킬 것

- 설비 상태 데이터(`equipment_events`)는 로컬 PostgreSQL이 유일한 기준이며 화면에서 입력·수정·삭제하지 않는다 (조회 전용). 조치 보고(`action_reports`)만 예외로 `/history/[id]`에서 입력·저장할 수 있다 (새 보고 추가만 가능, 수정·삭제는 없음)
- 상태가 멈춤·알람인 레코드는 원인(cause)이 필수다 (100자 이내) — DB `check` 제약으로 강제된다
- 상태가 알람인 레코드는 조치 상태(actionStatus)가 필수다 (확인전/확인중/조치완료/조치불가 추가 확인 필요) — DB `check` 제약으로 강제된다
- 상태 색상은 알람 > 멈춤 > 정상 순으로 우선한다
- 실 설비·PLC 연동, 외부(클라우드) API 연동은 하지 않는다. DB는 이 기기에서 직접 실행하는 로컬 PostgreSQL만 사용한다
- `backlog.json`은 손으로 고치지 않고 `tools/backlog.mjs`로만 읽고 쓴다
- `lib/data.ts`는 `pg`(DB 접근, Node 전용 모듈 사용)를 포함하므로 클라이언트 컴포넌트(`"use client"`)에서 직접 import하지 않는다 — 색상·아이콘만 필요하면 `lib/status.ts`를 쓴다

## 막히면

- `npm run dev`가 안 뜨면 `package.json`의 scripts와 `node_modules` 설치 여부를 먼저 확인한다
- 화면에 데이터가 안 보이면 PostgreSQL 서비스가 떠 있는지(`brew services list`), `.env.local`의 `DATABASE_URL`이 맞는지, `equipment_events`에 데이터가 있는지(`npm run db:seed`) 확인한다
- `backlog.json` 형식이 의심되면 `node tools/backlog.mjs validate`로 원인을 확인한다
- 색상이 이상하면 `lib/status.ts`의 상태 우선순위 로직(알람>멈춤>정상)을 먼저 확인한다
- 클라이언트 컴포넌트에서 번들 오류(`node:` 내장 모듈 관련)가 나면 `lib/data.ts`를 잘못 import한 것이니 `lib/status.ts`로 바꾼다

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
