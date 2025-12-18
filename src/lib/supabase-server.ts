import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// 서버 사이드용 Supabase 클라이언트
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in your .env.local file.'
    );
  }

  const cookieStore = await cookies();
  
  // Supabase 쿠키 키 형식: sb-<project-ref>-auth-token
  const supabaseUrlObj = new URL(supabaseUrl);
  const projectRef = supabaseUrlObj.hostname.split('.')[0];
  const authTokenKey = `sb-${projectRef}-auth-token`;
  
  // 모든 Supabase 관련 쿠키를 수집하는 함수
  const getAllSupabaseCookies = () => {
    const allCookies: Record<string, string> = {};
    // 모든 쿠키를 순회하면서 Supabase 관련 쿠키 찾기
    cookieStore.getAll().forEach((cookie) => {
      if (cookie.name.startsWith(`sb-${projectRef}-`)) {
        allCookies[cookie.name] = cookie.value;
      }
    });
    return allCookies;
  };
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          // 직접 키로 찾기
          const directCookie = cookieStore.get(key);
          if (directCookie) {
            return directCookie.value;
          }
          
          // Supabase 관련 쿠키 모두 확인
          const supabaseCookies = getAllSupabaseCookies();
          if (supabaseCookies[key]) {
            return supabaseCookies[key];
          }
          
          // auth-token 쿠키 확인 (메인 토큰)
          const authCookie = cookieStore.get(authTokenKey);
          if (authCookie) {
            return authCookie.value;
          }
          
          // 분할된 쿠키 확인 (큰 토큰이 여러 쿠키로 분할될 수 있음)
          for (let i = 0; i < 10; i++) {
            const splitCookie = cookieStore.get(`${authTokenKey}.${i}`);
            if (splitCookie) {
              return splitCookie.value;
            }
          }
          
          return null;
        },
        setItem: (key: string, value: string) => {
          // 서버 액션에서는 쿠키를 직접 설정할 수 없으므로 무시
          // 클라이언트에서 자동으로 설정됨
        },
        removeItem: (key: string) => {
          // 서버 액션에서는 쿠키를 직접 삭제할 수 없으므로 무시
        },
      },
    },
  });
}

