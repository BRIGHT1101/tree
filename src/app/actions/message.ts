'use server';

import { createServerClient } from '@/lib/supabase-server';

export interface MessageData {
  id: string;
  tree_id: string;
  messages: string;
  type: string;
  is_private?: boolean;
  created_at: string;
}

export async function getMessages(treeId: string, currentUserId?: string): Promise<MessageData[]> {
  const supabase = await createServerClient();
  
  // treeId가 short_id인 경우, 먼저 실제 UUID를 찾아야 함
  const { data: treeData } = await supabase
    .from('tree')
    .select('id')
    .eq('short_id', treeId)
    .single();
  
  if (!treeData) {
    return [];
  }
  
  // 현재 사용자가 트리 주인인지 확인
  const isTreeOwner = currentUserId && treeData.id === currentUserId;
  
  const { data, error } = await supabase
    .from('message')
    .select('*')
    .eq('tree_id', treeData.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  // 비밀 메시지도 모두 반환하되, 날짜와 트리 주인 여부에 따라 내용을 숨김
  const now = new Date();
  const unlockDate = new Date('2026-01-01T00:00:00');
  const isUnlocked = now >= unlockDate;

  const processedMessages = (data || []).map((msg) => {
    // 비밀 메시지인 경우
    if (msg.is_private) {
      // 트리 주인이 아니거나 아직 열리지 않은 날짜인 경우, 메시지 내용을 숨김
      if (!isTreeOwner || !isUnlocked) {
        return {
          ...msg,
          messages: '🎁 시간이 지나면 열리는 특별한 선물이에요', // 내용 대신 비밀 메시지 표시
        };
      }
    }
    return msg;
  });

  return processedMessages;
}

export async function createMessage(
  treeId: string,
  messages: string,
  type: string = 'snowflake',
  isPrivate: boolean = false
) {
  const supabase = await createServerClient();
  
  // treeId가 short_id인 경우, 먼저 실제 UUID를 찾아야 함
  const { data: treeData, error: treeError } = await supabase
    .from('tree')
    .select('id')
    .eq('short_id', treeId)
    .single();
  
  if (treeError || !treeData) {
    throw new Error('트리를 찾을 수 없습니다.');
  }
  
  const { data, error } = await supabase
    .from('message')
    .insert({
      tree_id: treeData.id,
      messages,
      type,
      is_private: isPrivate,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    throw new Error('메시지 작성에 실패했습니다.');
  }

  return data;
}

