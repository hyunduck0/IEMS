-- 멈춤·알람 이력에 대한 조치 보고. 한 이벤트에 여러 건이 누적될 수 있고(수정·삭제 없음, 새 보고만 추가),
-- 화면은 이벤트별 최신 1건만 보여준다.
create table if not exists action_reports (
  id bigint generated always as identity primary key,
  event_id bigint not null references equipment_events(id) on delete cascade,
  reported_at timestamptz not null,
  assignee text not null,
  status text not null check (status in ('확인전', '확인후', '조치완료')),
  result text check (result in ('조작 미스', '점검', '기타')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 이벤트별 최신 조치 보고 조회(distinct on)에 사용.
create index if not exists action_reports_event_id_reported_at_idx
  on action_reports (event_id, reported_at desc);
