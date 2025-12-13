-- Supabase RLS 정책 설정
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. tree 테이블 정책

-- 모든 사용자가 tree를 생성할 수 있도록 허용
CREATE POLICY "Allow public insert on tree"
ON tree
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 모든 사용자가 tree를 읽을 수 있도록 허용
CREATE POLICY "Allow public select on tree"
ON tree
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. message 테이블 정책

-- 모든 사용자가 message를 생성할 수 있도록 허용
CREATE POLICY "Allow public insert on message"
ON message
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 모든 사용자가 message를 읽을 수 있도록 허용
CREATE POLICY "Allow public select on message"
ON message
FOR SELECT
TO anon, authenticated
USING (true);

