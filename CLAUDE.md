# CLAUDE.md

## 명령어

- `npm run dev` — 개발 서버 실행 (http://localhost:3000)
- `npm run build` — 프로덕션 빌드
- `npm run start` — 빌드된 앱 실행
- `npm run lint` — ESLint 검사
- `npm run typecheck` — TypeScript 타입 검사 (`tsc --noEmit`)

## 구조

- `PLAN.md` — 프로젝트 범위·Phase·승인 지점의 기준이다
- `SPEC.md` — 화면 흐름·데이터 구조·제약·완료 조건의 기준이다
- `backlog.json` — 작업 목록과 상태의 유일한 SSOT다
- `tools/backlog.mjs` — `backlog.json`을 읽고 쓰는 유일한 도구다
- `data/equipment-status.txt` — 18개 설비 현재 상태 스냅샷의 기준이다
- `data/alarm-history.txt` — 알람·멈춤 이력의 기준이다
- `lib/types.ts` — `LogRecord` 타입 정의의 기준이다
- `lib/data.ts` — 파싱·가동률 계산·색상 우선순위 로직의 기준이다
- `app/` — 라우트별 화면(대시보드/이력/통계/사용자관리)의 기준이다
- `components/` — 화면에서 재사용하는 UI 조각의 기준이다

## 항상 지킬 것

- `data/`의 샘플 파일은 화면에서 수정하지 않는다 (조회 전용, 입력·저장 기능 없음)
- 상태가 멈춤·알람인 레코드는 원인(cause)이 필수다 (100자 이내)
- 상태가 알람인 레코드는 조치 상태(actionStatus)가 필수다 (확인전/확인중/조치완료/조치불가 추가 확인 필요)
- 상태 색상은 알람 > 멈춤 > 정상 순으로 우선한다
- 실 설비·PLC·외부 DB·외부 API는 연동하지 않는다
- `backlog.json`은 손으로 고치지 않고 `tools/backlog.mjs`로만 읽고 쓴다

## 막히면

- `npm run dev`가 안 뜨면 `package.json`의 scripts와 `node_modules` 설치 여부를 먼저 확인한다
- 화면에 데이터가 안 보이면 `data/equipment-status.txt`·`data/alarm-history.txt`가 존재하고 파이프(`|`) 구분 형식인지 확인한다
- `backlog.json` 형식이 의심되면 `node tools/backlog.mjs validate`로 원인을 확인한다
- 색상이 이상하면 `lib/data.ts`의 상태 우선순위 로직(알람>멈춤>정상)을 먼저 확인한다

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
