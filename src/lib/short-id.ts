import { nanoid } from 'nanoid';

// 짧은 ID 생성 (기본 8자리)
export function generateShortId(size: number = 8): string {
  return nanoid(size);
}

