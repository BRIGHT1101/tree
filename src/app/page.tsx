'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trees } from 'lucide-react';
import { createTree, getTreeByUserId } from '@/app/actions/tree';
import { LoginButtons } from '@/components/LoginButtons';
import { AuthButton } from '@/components/AuthButton';
import { createClient } from '@/lib/supabase';

export default function HomePage() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const hasCheckedTree = useRef(false);
  const isRedirecting = useRef(false);

  useEffect(() => {
    // 이미 체크했거나 리다이렉트 중이면 실행하지 않음
    if (hasCheckedTree.current || isRedirecting.current) {
      return;
    }

    // 현재 경로가 트리 페이지인 경우 리다이렉트하지 않음
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/tree/')) {
      setAuthLoading(false);
      return;
    }

    const supabase = createClient();

    // 현재 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      // 로그인한 사용자인 경우 트리 확인 (한 번만)
      if (session?.user?.id && !hasCheckedTree.current) {
        hasCheckedTree.current = true;
        try {
          const existingTree = await getTreeByUserId(session.user.id);
          if (existingTree && !isRedirecting.current) {
            isRedirecting.current = true;
            // 이미 트리가 있으면 트리 페이지로 리다이렉트
            router.replace(`/tree/${existingTree.short_id}`);
            return;
          }
        } catch (error) {
          console.error('Failed to check existing tree:', error);
          hasCheckedTree.current = false; // 에러 발생 시 다시 체크할 수 있도록
        }
      }
      
      setAuthLoading(false);
    });

    // 인증 상태 변경 감지 (리다이렉트는 하지 않음, 사용자 상태만 업데이트)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim() && !isLoading && user) {
      setIsLoading(true);
      try {
        const treeId = await createTree(nickname.trim(), user.id);
        router.push(`/tree/${treeId}`);
      } catch (error) {
        console.error('Failed to create tree:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : '트리 생성에 실패했습니다. 다시 시도해주세요.';
        alert(errorMessage);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Snow-covered forest background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background trees (silhouettes) */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`tree-${i}`}
            className="absolute opacity-15"
            style={{
              left: `${(i * 19.3) % 100}%`,
              bottom: '0%',
              width: `${25 + Math.random() * 35}px`,
              height: `${180 + Math.random() * 120}px`,
            }}
          >
            <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[100px] border-b-slate-700"></div>
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[75px] border-b-slate-700 -mt-2"></div>
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[50px] border-b-slate-700 -mt-2"></div>
          </div>
        ))}
        
        {/* Snow on ground */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-700/50 via-slate-600/40 to-transparent"></div>
        
        {/* Snowflakes */}
        {[...Array(80)].map((_, i) => (
          <div
            key={`snow-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
        
        {/* Stars */}
        {[...Array(40)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              opacity: Math.random() * 0.4 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        {/* Logout Button - Top Right (only when logged in) */}
        {user && (
          <div className="absolute top-4 right-4 z-20">
            <AuthButton />
          </div>
        )}

        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Trees className="w-32 h-32 text-green-500 animate-bounce-slow" />
          </div>
        </div>

        <h1 className="text-gray-200 text-shadow-lg mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-4xl md:text-5xl">
          크리스마스 트리 방명록
        </h1>
        <p className="text-gray-300/90 text-xl md:text-2xl mb-12 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          나만의 트리를 만들고 친구들의 메시지를 받아보세요
        </p>

        {authLoading ? (
          <div className="text-gray-300">로딩 중...</div>
        ) : user ? (
          <form onSubmit={handleCreateTree} className="max-w-md mx-auto">
            <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 border border-slate-600">
              <h2 className="mb-4 text-gray-200 text-2xl">나만의 트리 만들기</h2>
              
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 text-lg bg-slate-700/50 border border-slate-500 text-gray-200 placeholder-gray-400 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-colors mb-4"
                maxLength={20}
                autoFocus
              />

              <button
                type="submit"
                className="w-full px-4 py-2.5 text-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!nickname.trim() || isLoading}
              >
                <span>{isLoading ? '만드는 중...' : '트리 만들기'}</span>
                <span className="text-xl">🌲</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-600">
              <LoginButtons />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
