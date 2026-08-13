-- 검사 설비 이벤트(정상/멈춤/알람) 단일 테이블.
-- 현재 상태 스냅샷과 이력을 별도 파일로 나누던 이전 구조 대신,
-- 이 테이블 하나에 대한 쿼리(최신 1건 vs 전체 이력)로 두 화면을 모두 지원한다.
create table if not exists equipment_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null,
  line smallint not null check (line between 1 and 9),
  position text not null check (position in ('정면', '배면')),
  status text not null check (status in ('정상', '멈춤', '알람')),
  cause text check (cause is null or char_length(cause) <= 100),
  action_status text check (action_status in ('확인전', '확인중', '조치완료', '조치불가 추가 확인 필요')),
  note text check (note is null or char_length(note) <= 150),
  created_at timestamptz not null default now(),

  -- 멈춤·알람은 원인 필수, 정상은 원인이 비어 있어야 한다.
  constraint cause_matches_status check (
    (status = '정상' and cause is null) or
    (status <> '정상' and cause is not null)
  ),
  -- 조치 상태는 알람일 때만 채워진다.
  constraint action_status_only_for_alarm check (
    (status = '알람') = (action_status is not null)
  )
);

-- 대시보드: 라인·설비별 최신 상태 조회(DISTINCT ON)에 사용.
create index if not exists equipment_events_line_position_occurred_at_idx
  on equipment_events (line, position, occurred_at desc);

-- 종합 이력: 정상이 아닌 이벤트를 최신순으로 조회할 때 사용.
create index if not exists equipment_events_occurred_at_idx
  on equipment_events (occurred_at desc)
  where status <> '정상';
