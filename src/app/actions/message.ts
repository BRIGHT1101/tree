'use server';

import { createServerClient } from '@/lib/supabase-server';

export interface MessageData {
  id: string;
  tree_id: string;
  messages: string;
  type: string;
  created_at: string;
}

export async function getMessages(treeId: string): Promise<MessageData[]> {
  const supabase = createServerClient();
  
  // treeId가 short_id인 경우, 먼저 실제 UUID를 찾아야 함
  const { data: treeData } = await supabase
    .from('tree')
    .select('id')
    .eq('short_id', treeId)
    .single();
  
  if (!treeData) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('message')
    .select('*')
    .eq('tree_id', treeData.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

export async function createMessage(
  treeId: string,
  messages: string,
  type: string = 'snowflake'
) {
  const supabase = createServerClient();
  
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
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    throw new Error('메시지 작성에 실패했습니다.');
  }

  return data;
}

