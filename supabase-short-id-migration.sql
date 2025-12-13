-- tree 테이블에 short_id 컬럼 추가
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- short_id 컬럼 추가 (고유 인덱스 포함)
ALTER TABLE tree 
ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- 기존 데이터에 대한 short_id 생성 (선택사항)
-- 이미 있는 트리들에 대해서는 수동으로 업데이트하거나 새로 생성된 트리만 사용

-- short_id에 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_tree_short_id ON tree(short_id);

