'use server';

import { createServerClient } from '@/lib/supabase-server';
import { generateShortId } from '@/lib/short-id';

export async function createTree(nickname: string, userId: string) {
  try {
    if (!userId) {
      throw new Error('로그인이 필요합니다. 먼저 로그인해주세요.');
    }

    const supabase = await createServerClient();
    
    // 이미 트리가 있는지 확인
    const existingTree = await getTreeByUserId(userId);
    if (existingTree) {
      throw new Error('이미 트리가 있습니다. 한 사용자는 트리를 하나만 만들 수 있습니다.');
    }
    
    // 짧은 ID 생성 (8자리)
    const shortId = generateShortId(8);
    
    // 사용자 ID와 함께 트리 생성
    const { data, error } = await supabase
      .from('tree')
      .insert({ 
        nickname, 
        short_id: shortId,
        id: userId  // auth.users의 id를 tree 테이블의 id로 저장
      })
      .select('short_id')
      .single();

    if (error) {
      console.error('Error creating tree:', error);
      // 더 자세한 에러 메시지 전달
      throw new Error(
        error.message || '트리 생성에 실패했습니다. 데이터베이스 연결을 확인해주세요.'
      );
    }

    if (!data || !data.short_id) {
      throw new Error('트리 생성은 성공했지만 ID를 받아오지 못했습니다.');
    }

    return data.short_id;
  } catch (error) {
    // 환경 변수 체크
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
      console.error('Missing Supabase environment variables');
      throw new Error('Supabase 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.');
    }
    throw error;
  }
}

export async function getTree(treeId: string) {
  const supabase = await createServerClient();
  
  // short_id로 조회 (UUID가 아닌 짧은 ID)
  const { data, error } = await supabase
    .from('tree')
    .select('id, short_id, nickname, created_at')
    .eq('short_id', treeId)
    .single();

  if (error) {
    console.error('Error fetching tree:', error);
    return null;
  }

  return data;
}

export async function getTreeByUserId(userId: string) {
  const supabase = await createServerClient();
  
  // 사용자 ID로 트리 조회
  const { data, error } = await supabase
    .from('tree')
    .select('id, short_id, nickname, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    // 트리가 없는 경우 null 반환
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching tree by user id:', error);
    return null;
  }

  return data;
}

