-- message 테이블에 type 컬럼 추가
-- Supabase 대시보드의 SQL Editor에서 실행하세요

ALTER TABLE message 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'snowflake';

-- type 컬럼에 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_message_type ON message(type);

