# SPEC.md — 검사 설비 현황 모니터링 시스템 기술 명세

`PLAN.md` 기반. 원래 조회/모니터링 전용으로 시작했으나, 멈춤·알람 이력에 대한 **조치 보고 입력**만 예외로 범위에 들어왔다 (아래 "결정 기록" 참조). 설비 상태 데이터(`equipment_events`) 자체는 여전히 읽기 전용이며, 조치 보고(`action_reports`)만 사용자가 입력·저장한다.

## 목적

라인 운영자·교대 근무자는 지금 2시간 간격으로 9라인 × 2대(정면/배면, 총 18개) 설비의 개발 로그를 직접 다운받아 정상/멈춤/알람 여부를 눈으로 판단하며, 전체 확인에 회당 약 20분이 걸린다. 이 시스템은 로그를 사람이 읽고 판단하는 과정을 없애고, 18개 설비의 상태를 색상(녹색=정상/노란색=멈춤/빨간색=알람, 알람 우선)으로 한 화면에서 즉시 보여주고, 알람의 원인과 조치 이력을 조회할 수 있게 한다.

## 화면 흐름

설비 상태 데이터는 **조회 전용**이다. 다만 멈춤·알람 이력에 대한 **조치 보고**는 사용자가 입력·저장할 수 있다 (아래 "제약" 참조).

1. **대시보드 (`/`)** 접속 — 9개 라인이 위에서부터 순서대로 나열되고, 각 라인의 정면/배면 설비가 상태 색상으로 표시된다.
2. 이상(노란색/빨간색) 설비를 발견하면 **종합 이력 (`/history`)** 으로 이동해 최근 알람 20건을 시간·라인·설비·상태·내용(원인)·조치 현황·조치 결과로 훑어보거나,
3. 특정 설비를 클릭해 **설비별 상세 이력 (`/equipment/[line]/[position]`)** 에서 그 설비의 알람 발생 시각·원인·조치 상태·조치 내용을 시간순으로 확인한다. 종합 이력에서 멈춤·알람 행을 클릭하면 **조치 보고 입력 (`/history/[id]`)** 화면에서 시각·담당자·조치 현황·조치 결과·조치 내용을 입력해 저장할 수 있다.
4. 필요하면 **통계 화면 (`/stats`)** 에서 일별/주별 전체·라인별 가동률을 그래프와 표로 확인한다.
5. (스트레치) **사용자 관리 (`/users`)** 에서 사용자 목록을 보고 추가/삭제한다.

## 데이터 구조

로컬 PostgreSQL(`iems` 데이터베이스)의 `equipment_events` 테이블 하나가 유일한 기준이다. 현재 상태 스냅샷과 이력을 별도 파일로 나누던 이전 구조 대신, 이 테이블에 대한 쿼리(라인·설비별 최신 1건 vs 전체 이력)로 두 화면(대시보드/이력)을 모두 지원한다. 스키마는 `db/migrations/0001_init.sql`이 기준이다.

```sql
create table equipment_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null,
  line smallint not null check (line between 1 and 9),
  position text not null check (position in ('정면', '배면')),
  status text not null check (status in ('정상', '멈춤', '알람')),
  cause text check (cause is null or char_length(cause) <= 100),
  action_status text check (action_status in ('확인전', '확인중', '조치완료', '조치불가 추가 확인 필요')),
  note text check (note is null or char_length(note) <= 150),
  created_at timestamptz not null default now()
);
```

애플리케이션 타입 (`lib/types.ts`, `lib/data.ts`가 DB 행을 이 타입으로 변환):

```ts
type EquipmentStatus = "정상" | "멈춤" | "알람";
type ActionStatus = "확인전" | "확인중" | "조치완료" | "조치불가 추가 확인 필요";

interface LogRecord {
  timestamp: string;            // occurred_at, ISO 8601
  line: number;                  // 1~9
  position: "정면" | "배면";
  status: EquipmentStatus;
  cause?: string;                // 멈춤/알람일 때만, 100자 이내
  actionStatus?: ActionStatus;   // 알람일 때만
  note?: string;                 // 조치 내용, 150자 이내
}
```

- **현재 상태(대시보드)**: 라인·설비별 `occurred_at`이 가장 최근인 1건 (`distinct on (line, position) ... order by occurred_at desc`).
- **이력(종합/상세 이력 화면)**: `status <> '정상'`인 행을 최신순으로 조회.

멈춤·알람 이력에 대한 조치 보고는 별도 테이블 `action_reports`에 쌓인다 (한 이벤트에 여러 건 누적 가능, 이력 화면은 최신 1건만 보여준다). 스키마는 `db/migrations/0002_action_reports.sql`이 기준이다.

```sql
create table action_reports (
  id bigint generated always as identity primary key,
  event_id bigint not null references equipment_events(id) on delete cascade,
  reported_at timestamptz not null,
  assignee text not null,
  status text not null check (status in ('확인전', '확인후', '조치완료')),
  result text check (result in ('조작 미스', '점검', '기타')),
  content text not null,
  created_at timestamptz not null default now()
);
```

```ts
interface ActionReport {
  id: number;
  eventId: number;
  reportedAt: string;   // ISO 8601, 입력 화면에서 기본값은 현재 시각
  assignee: string;
  status: "확인전" | "확인후" | "조치완료";
  result?: "조작 미스" | "점검" | "기타";
  content: string;
}
```

## 제약

- **원인(cause)은 상태가 멈춤·알람일 때만 필수**, 100자 이내. 정상 상태는 비워둔다. DB `check` 제약(`cause_matches_status`)으로 강제된다.
- **조치 상태(actionStatus)는 알람일 때만 필수** — 확인전 / 확인중 / 조치완료 / 조치불가 추가 확인 필요 중 하나. DB `check` 제약(`action_status_only_for_alarm`)으로 강제된다.
- **비고(조치 내용)는 150자 이내.**
- **설비 상태 데이터(`equipment_events`)는 화면에서 입력·수정·삭제하지 않는다.** 읽기 전용이며 시드 데이터는 `npm run db:seed`로만 채운다.
- **조치 보고(`action_reports`)만 예외로 입력을 허용한다.** `/history/[id]`에서 새 조치 보고를 추가할 수 있으며(수정·삭제는 없음, 항상 새 보고를 누적), 담당자는 정해진 목록(`lib/assignees.ts`)에서만 선택한다.
- 실 설비/PLC 연동, 알림 발송(푸시/문자 등), 모바일 대응은 하지 않는다 (PLAN ③ 그대로). DB는 이 기기에서 직접 실행하는 로컬 PostgreSQL만 사용하며, 클라우드 DB·외부 API는 연동하지 않는다.

## 완료 조건 (브라우저에서 확인, PLAN ④ Phase 완료 기준 그대로)

1. **샘플 데이터**: `npm run db:seed`로 `equipment_events`에 18개 설비 최신 스냅샷(정상 9·멈춤/알람 9 비율 유지)과 알람·멈춤 이력 20건 이상이 채워지고, 각 행이 위 필드·제약을 만족한다.
2. **대시보드**: `/` 접속 시 9개 라인이 순서대로 나열되고, 각 라인의 정면/배면 설비 현황이 상태 색상(알람 우선)으로 렌더링된다.
3. **종합 이력**: `/history`에서 최근 알람 20건이 시간·라인·설비·상태·내용·조치 현황·조치 결과를 포함한 표로 최신순 정렬되어 표시되고, 행을 클릭하면 조치 보고를 입력해 저장할 수 있다.
4. **설비별 상세 이력**: 설비를 클릭하면 `/equipment/[line]/[position]`에서 알람 발생 시각·원인·조치 내용이 시간순으로 표시된다.
5. **통계**: `/stats`에서 일별/주별 전체·라인별 가동률이 그래프와 표로 표시된다.
6. (스트레치) **배포**: Vercel에 배포되어 발급된 URL로 접속하면 대시보드가 정상 렌더링된다.
7. (스트레치) **사용자 관리**: `/users`에서 사용자 목록이 표시되고 추가/삭제가 된다.

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js (App Router, TypeScript) | 스트레치 목표인 Vercel 배포와 바로 연결됨 |
| 스타일 | Tailwind CSS | 색상 상태(녹색/노란색/빨간색) 표현이 빠름 |
| 차트 | react-chartjs-2 (Chart.js) | 통계 화면(Phase 5)의 가동률 그래프 |
| 데이터 | 로컬 PostgreSQL 16 (`iems` DB, `equipment_events` 테이블) | 관계형 제약(check)으로 필수 필드 규칙을 DB 단에서도 강제 |
| 데이터 읽기 | Server Component + `pg` (`lib/data.ts`, `lib/db.ts`) | 커넥션 풀을 지연 초기화해 로컬 완결, 별도 백엔드 서버 없음 |

## 폴더 구조

```
/app
  page.tsx                              # 대시보드
  history/page.tsx                      # 종합 이력
  history/[id]/page.tsx                 # 조치 보고 입력
  history/[id]/actions.ts               # 조치 보고 저장 Server Action
  equipment/[line]/[position]/page.tsx  # 설비별 상세
  stats/page.tsx                        # 통계
  users/page.tsx                        # (스트레치)
/components
  NavBar.tsx
  LineRow.tsx
  EquipmentCard.tsx
  EquipmentIcon.tsx
  AlarmHistoryTable.tsx
  AlarmHistoryExplorer.tsx
  EquipmentHistoryList.tsx
  UtilizationChart.tsx
  ActionReportForm.tsx
/lib
  db.ts          # PostgreSQL 커넥션 풀(지연 초기화)
  data.ts        # DB 조회, 최신 상태 계산, 가동률 계산 (전부 비동기)
  status.ts      # 상태 색상·아이콘 매핑 (DB 비의존, 클라이언트 컴포넌트에서도 import 가능)
  assignees.ts   # 조치 보고 담당자 선택지(정적 목록)
  types.ts
/db
  migrations/0001_init.sql        # equipment_events 테이블 스키마
  migrations/0002_action_reports.sql  # action_reports 테이블 스키마
  seed.ts                         # 샘플 데이터 생성 스크립트 (npm run db:seed)
```

## 결정 기록

| 결정 | 이유 |
|---|---|
| 트랙 A (풀스택 웹앱) | 18개 설비 상태를 브라우저 화면에서 색상으로 한눈에 보고 싶어서 |
| 줄이는 비용을 "검증"으로 정함 | 지금은 사람이 로그를 눈으로 보고 정상 여부를 판단 → 색상 UI가 기계적으로 판정하도록 대체 |
| 반드시 범위 = 대시보드 + 이력(종합/상세) + 통계, local 환경까지 | 6~8시간 안에 끝낼 수 있는 크기로 맞춤 |
| 배포는 "되면 좋은"(스트레치)으로, 통계 완료 후 진행 | 배포보다 로컬에서 통계 기능까지 완성하는 것을 우선순위로 둠 |
| 데이터를 스냅샷(`equipment-status.txt`)과 이력(`alarm-history.txt`)으로 분리 | Phase 1은 18건 스냅샷을, Phase 3은 알람 20건 이력을 요구해 개수가 다름 |
| 데이터 형식을 JSON이 아닌 파이프(`|`) 구분 텍스트로 유지 | 사용자가 지정한 원본 표 형식을 그대로 씀 |
| 기술 스택: Next.js + Tailwind + Recharts | 스트레치 목표인 Vercel 배포와 바로 연결됨 |
| 점검자가 OK/NG를 입력하고 조치 메모를 남겨 저장하는 기능은 이번 범위에 없음 | PLAN.md의 원래 목적은 조회/모니터링이며, 확인 결과 이 범위를 유지하기로 함 (본 SPEC 작성 중 재확인) |
| 데이터 저장소를 파이프 구분 텍스트에서 로컬 PostgreSQL로 전환 (외부 DB 연동 금지 제약은 "클라우드/타사 DB 연동 금지"로 재해석, 이 기기의 로컬 PostgreSQL은 허용) | 사용자가 데이터를 DB로 관리하길 원함. 스냅샷/이력 두 파일을 유지하며 최신 이력이 스냅샷과 항상 일치하도록 맞추던 수작업 동기화를 제거하기 위해, `equipment_events` 단일 테이블 + 쿼리로 단순화 |
| 차트 라이브러리를 Recharts에서 react-chartjs-2(Chart.js)로 교체 | 사용자 요청. 통계 화면의 모든 그래프에 적용 |
| 종합 이력에 조치 보고 입력 기능 추가 (기존 "입력·저장 기능 없음" 제약을 조치 보고에 한해 예외 처리) | 사용자 요청. 설비 상태 데이터(equipment_events)는 여전히 읽기 전용으로 유지하고, 별도 테이블(action_reports)에만 쓰기를 허용해 원래 결정의 취지(설비 데이터 무결성)는 지킨다 |
