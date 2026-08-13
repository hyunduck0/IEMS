import { Pool } from "pg";

let pool: Pool | null = null;

/** 지연 초기화된 커넥션 풀. 빌드 타임에는 DATABASE_URL을 읽지 않도록 요청 시점에만 생성한다. */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return pool;
}
