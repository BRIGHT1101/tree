'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChristmasTree } from '@/components/ChristmasTree';
import { GuestbookForm } from '@/components/GuestbookForm';
import { CreateTreeModal } from '@/components/CreateTreeModal';
import { Plus, Share2, MessageSquare, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTree } from '@/app/actions/tree';
import { getMessages, createMessage } from '@/app/actions/message';
import { createClient } from '@/lib/supabase';
import { LoginButtons } from '@/components/LoginButtons';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface GuestbookEntry {
  id: string;
  messages: string;
  type: string;
  position: { x: number; y: number };
  isPrivate?: boolean;
}

interface TreeData {
  id: string;
  nickname: string;
  created_at: string;
}

export default function TreePage() {
  const params = useParams();
  const router = useRouter();
  const treeId = params.treeId as string;
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [allEntries, setAllEntries] = useState<GuestbookEntry[]>([]);
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTreeOwner, setIsTreeOwner] = useState(false);

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });

    async function loadTreeData() {
      if (!treeId) return;
      
      setIsLoading(true);
      try {
        const tree = await getTree(treeId);
        if (!tree) {
          // 트리가 없을 때만 홈으로 리다이렉트
          router.replace('/');
          return;
        }
        
        setTreeData(tree);
        
        // 현재 사용자 ID를 가져와서 메시지 로드
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id ?? null;
        
        // 메시지 로드 (트리 주인인 경우 비밀 메시지도 볼 수 있음)
        const messages = await getMessages(treeId, userId || undefined);
        const treeOwner = userId && tree.id === userId;
        setIsTreeOwner(!!treeOwner);
        
        // 날짜 확인: 2026년 1월 1일 이후인지 확인
        const now = new Date();
        const unlockDate = new Date('2026-01-01T00:00:00');
        const isUnlocked = now >= unlockDate;
        
        // 겹치지 않는 위치 생성 함수 - 완전히 새로운 로직
        const generateNonOverlappingPositions = (count: number) => {
          const positions: { x: number; y: number }[] = [];
          const minDistance = 15; // 최소 거리 (%)
          
          // 트리 영역: x는 20-80%, y는 10-80% (위아래로 더 넓게)
          const xMin = 20;
          const xMax = 80;
          const yMin = 10;
          const yMax = 80;
          const width = xMax - xMin;
          const height = yMax - yMin;
          
          // 거리 확인 함수
          const isTooClose = (x: number, y: number, existingPositions: { x: number; y: number }[]) => {
            return existingPositions.some(existing => {
              const dx = existing.x - x;
              const dy = existing.y - y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance < minDistance;
            });
          };
          
          // 각 장식에 대해 위치 찾기
          for (let i = 0; i < count; i++) {
            let position: { x: number; y: number } | null = null;
            let attempts = 0;
            const maxAttempts = 500;
            
            // 첫 번째 장식은 중앙 근처에 배치
            if (i === 0) {
              const centerX = (xMin + xMax) / 2;
              const centerY = (yMin + yMax) / 2;
              position = { x: centerX, y: centerY };
            } else {
              // 나머지 장식들은 기존 장식들 주변에 원형으로 배치
              while (attempts < maxAttempts && !position) {
                // 기존 장식 중 하나를 기준으로 원형 배치
                const baseIndex = (i - 1) % positions.length;
                const basePos = positions[baseIndex];
                
                // 원형 배치: 각 장식마다 다른 각도와 거리 사용
                // y축 방향으로 더 넓게 분산되도록 세로 타원형 배치
                const angle = (i * 137.508) % 360; // 황금각 사용
                const radius = minDistance + (i % 3) * minDistance * 0.5; // 거리 변동
                
                const radian = (angle * Math.PI) / 180;
                // y축 방향으로 1.5배 더 넓게 분산
                let x = basePos.x + radius * Math.cos(radian);
                let y = basePos.y + radius * Math.sin(radian) * 1.5;
                
                // 경계 내로 제한
                x = Math.max(xMin, Math.min(xMax, x));
                y = Math.max(yMin, Math.min(yMax, y));
                
                // 거리 확인
                if (!isTooClose(x, y, positions)) {
                  position = { x, y };
                  break;
                }
                
                attempts++;
                
                // 시도가 많아지면 완전히 랜덤 위치 시도
                if (attempts > 200) {
                  const randomX = xMin + Math.random() * width;
                  const randomY = yMin + Math.random() * height;
                  
                  if (!isTooClose(randomX, randomY, positions)) {
                    position = { x: randomX, y: randomY };
                    break;
                  }
                }
              }
            }
            
            // 여전히 위치를 찾지 못한 경우, 그리드 기반 배치
            if (!position) {
              // 그리드 크기 계산 (최소 거리 기반)
              const gridCols = Math.floor(width / minDistance);
              const gridRows = Math.floor(height / minDistance);
              const gridIndex = i % (gridCols * gridRows);
              const col = gridIndex % gridCols;
              const row = Math.floor(gridIndex / gridCols);
              
              const x = xMin + (col + 0.5) * (width / gridCols);
              const y = yMin + (row + 0.5) * (height / gridRows);
              
              position = { x, y };
            }
            
            positions.push(position);
          }
          
          return positions;
        };
        
        const positions = generateNonOverlappingPositions(messages.length);
        
        const formattedEntries: GuestbookEntry[] = messages.map((msg, index) => {
          // 비밀 메시지이고 (트리 주인이 아니거나 아직 열리지 않은 날짜)인 경우 isPrivate 표시
          const shouldHide = msg.is_private && (!treeOwner || !isUnlocked);
          return {
          id: msg.id,
          messages: msg.messages,
          type: msg.type || 'snowflake',
            isPrivate: shouldHide,
            position: positions[index] || { x: 50, y: 45 }, // 기본 위치
          };
        });
        setAllEntries(formattedEntries);
        
        // 첫 페이지 메시지 설정 (최대 10개)
        const itemsPerPage = 10;
        const totalPages = Math.ceil(formattedEntries.length / itemsPerPage);
        const startIndex = 0;
        const endIndex = Math.min(itemsPerPage, formattedEntries.length);
        setEntries(formattedEntries.slice(startIndex, endIndex));
      } catch (error) {
        console.error('Failed to load tree:', error);
        // 에러 발생 시에도 트리가 없는 경우에만 홈으로 리다이렉트
        // 네트워크 에러 등은 무시하고 로딩만 종료
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTreeData();
  }, [treeId, router]);

  const handleAddEntry = async (messages: string, letterType: string, isPrivate: boolean) => {
    if (!treeId || !treeData) return;

    try {
      const newMessage = await createMessage(treeId, messages, letterType, isPrivate);
      
      // 트리 주인인지 확인
      const isTreeOwner = currentUserId && treeData.id === currentUserId;
      
      // 날짜 확인: 2026년 1월 1일 이후인지 확인
      const now = new Date();
      const unlockDate = new Date('2026-01-01T00:00:00');
      const isUnlocked = now >= unlockDate;
      
      // 비밀 메시지인 경우, 트리 주인이 아니거나 아직 열리지 않은 날짜면 내용을 숨김
      const shouldHide = isPrivate && (!isTreeOwner || !isUnlocked);
      const displayMessage = shouldHide ? '🎁 시간이 지나면 열리는 특별한 선물이에요' : newMessage.messages;
      
      // 새 메시지의 겹치지 않는 위치 생성 - 개선된 로직
      const generateNewPosition = (existingEntries: GuestbookEntry[]) => {
        const minDistance = 15; // 최소 거리 (%)
        const xMin = 20;
        const xMax = 80;
        const yMin = 10;
        const yMax = 80;
        const width = xMax - xMin;
        const height = yMax - yMin;
        const maxAttempts = 500;
        
        // 기존 위치가 없으면 중앙에 배치
        if (existingEntries.length === 0) {
          return { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 };
        }
        
        // 거리 확인 함수
        const isTooClose = (x: number, y: number) => {
          return existingEntries.some(existing => {
            const dx = existing.position.x - x;
            const dy = existing.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < minDistance;
          });
        };
        
        // 먼저 기존 장식 주변에 원형으로 배치 시도
        for (let i = 0; i < existingEntries.length; i++) {
          const basePos = existingEntries[i].position;
          
          // 여러 각도와 거리로 시도
          for (let angle = 0; angle < 360; angle += 30) {
            for (let radius = minDistance; radius <= minDistance * 3; radius += minDistance * 0.5) {
              const radian = (angle * Math.PI) / 180;
              let x = basePos.x + radius * Math.cos(radian);
              let y = basePos.y + radius * Math.sin(radian);
              
              // 경계 내로 제한
              x = Math.max(xMin, Math.min(xMax, x));
              y = Math.max(yMin, Math.min(yMax, y));
              
              if (!isTooClose(x, y)) {
                return { x, y };
              }
            }
          }
        }
        
        // 원형 배치가 실패하면 랜덤 위치 시도
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const x = xMin + Math.random() * width;
          const y = yMin + Math.random() * height;
          
          if (!isTooClose(x, y)) {
            return { x, y };
          }
        }
        
        // 최대 시도 후에도 위치를 찾지 못하면 가장 멀리 떨어진 위치 찾기
        let bestPosition = { x: 50, y: 45 };
        let maxMinDistance = 0;
        
        // 그리드 기반으로 최적 위치 찾기
        const gridSize = 10;
        for (let col = 0; col < gridSize; col++) {
          for (let row = 0; row < gridSize; row++) {
            const x = xMin + (col + 0.5) * (width / gridSize);
            const y = yMin + (row + 0.5) * (height / gridSize);
            
            // 가장 가까운 기존 장식까지의 거리 계산
            const minDist = Math.min(
              ...existingEntries.map(existing => {
                const dx = existing.position.x - x;
                const dy = existing.position.y - y;
                return Math.sqrt(dx * dx + dy * dy);
              })
            );
            
            if (minDist > maxMinDistance) {
              maxMinDistance = minDist;
              bestPosition = { x, y };
            }
          }
        }
        
        return bestPosition;
      };
      
      const newEntry: GuestbookEntry = {
        id: newMessage.id,
        messages: displayMessage,
        type: newMessage.type || 'snowflake',
        isPrivate: shouldHide,
        position: generateNewPosition(allEntries),
      };

      // 새 메시지를 전체 목록에 추가
      const updatedAllEntries = [...allEntries, newEntry];
      setAllEntries(updatedAllEntries);
      
      // 현재 페이지에 따라 표시할 메시지 업데이트
      const itemsPerPage = 10;
      const totalPages = Math.ceil(updatedAllEntries.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, updatedAllEntries.length);
      setEntries(updatedAllEntries.slice(startIndex, endIndex));
      
      setIsDrawerOpen(false); // 메시지 제출 후 drawer 닫기
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('메시지 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCreateTree = async (nickname: string) => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    try {
      const { createTree } = await import('@/app/actions/tree');
      const newTreeId = await createTree(nickname, currentUserId);
      setIsModalOpen(false);
      router.push(`/tree/${newTreeId}`);
    } catch (error) {
      console.error('Failed to create tree:', error);
      alert(error instanceof Error ? error.message : '트리 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      // Web Share API 사용 (모바일에서 네이티브 공유)
      if (navigator.share) {
        await navigator.share({
          title: `${treeData?.nickname}의 크리스마스 트리`,
          text: '크리스마스 트리를 확인해보세요!',
          url: url,
        });
      } else {
        // Web Share API가 없으면 클립보드에 복사
        await navigator.clipboard.writeText(url);
        alert('링크가 복사되었습니다!');
      }
    } catch (err) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to share:', err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // 로그아웃 후 홈으로 이동
      router.push('/');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handlePageChange = (page: number) => {
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allEntries.length);
    setEntries(allEntries.slice(startIndex, endIndex));
    setCurrentPage(page);
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(allEntries.length / itemsPerPage);

  if (isLoading || !treeData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-gray-300">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Snow-covered forest background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background trees (silhouettes) */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`tree-${i}`}
            className="absolute opacity-20"
            style={{
              left: `${(i * 23.7) % 100}%`,
              bottom: '0%',
              width: `${20 + Math.random() * 30}px`,
              height: `${150 + Math.random() * 100}px`,
            }}
          >
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[80px] border-b-slate-700"></div>
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[60px] border-b-slate-700 -mt-2"></div>
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[40px] border-b-slate-700 -mt-2"></div>
          </div>
        ))}
        
        {/* Snow on ground */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-700/40 via-slate-600/30 to-transparent"></div>
        
        {/* Snowflakes */}
        {[...Array(60)].map((_, i) => (
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
        {[...Array(30)].map((_, i) => (
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

      {/* Tree owner title */}
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-gray-200 text-shadow-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-3xl md:text-4xl">{treeData.nickname}의 트리</h1>
      </div>

      {/* Share and Logout buttons */}
      <div className="absolute top-8 right-8 flex gap-2 z-50">
      <button
        onClick={handleShare}
          className="bg-slate-800/60 hover:bg-slate-700/80 backdrop-blur-sm text-gray-200 rounded-full p-2 shadow-lg transition-all hover:scale-110 border border-slate-600 pointer-events-auto"
        aria-label="링크 공유"
      >
        <Share2 size={20} />
      </button>
        {currentUserId && (
          <button
            onClick={handleLogout}
            className="bg-slate-800/60 hover:bg-slate-700/80 backdrop-blur-sm text-gray-200 rounded-full p-2 shadow-lg transition-all hover:scale-110 border border-slate-600 pointer-events-auto"
            aria-label="로그아웃"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>

      {/* Christmas Tree - 부각되게 */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-32 relative z-20">
        <div className="relative">
          {/* 트리 주변 글로우 효과 */}
          <div className="absolute inset-0 blur-3xl bg-green-900/20 -z-10 scale-150"></div>
          <ChristmasTree entries={entries} />
        </div>
        
        {/* Pagination - 메시지가 10개 이상일 때만 표시 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center gap-4 z-30">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-slate-800/95 backdrop-blur-sm hover:bg-slate-700/95 text-gray-200 rounded-full p-2 shadow-lg transition-all hover:scale-110 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="이전 페이지"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="bg-slate-800/95 backdrop-blur-sm text-gray-200 px-4 py-2 rounded-lg shadow-lg border border-slate-600">
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-slate-800/95 backdrop-blur-sm hover:bg-slate-700/95 text-gray-200 rounded-full p-2 shadow-lg transition-all hover:scale-110 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="다음 페이지"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Guestbook Form Drawer - 트리 주인이 아닌 경우에만 표시 */}
      {!isTreeOwner && (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white rounded-full p-3.5 shadow-lg transition-all hover:scale-110 z-20 flex items-center gap-2"
            aria-label="메시지 작성"
          >
            <MessageSquare size={20} />
            <span className="hidden sm:inline">메시지 작성</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-slate-800 border-slate-600 max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-center shrink-0">
            <DrawerTitle className="text-gray-200">메시지 작성</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto flex-1 min-h-0">
            <GuestbookForm onSubmit={handleAddEntry} />
          </div>
        </DrawerContent>
      </Drawer>
      )}

      {/* Create Tree Button - 로그인하지 않은 사용자에게만 표시 */}
      {!currentUserId && (
      <button
          onClick={() => setIsLoginModalOpen(true)}
          className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110 z-20"
        aria-label="나만의 트리 만들기"
      >
        <Plus size={24} />
      </button>
      )}

      {/* Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-gray-200 text-xl text-center">
              로그인이 필요합니다
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <p className="text-gray-400 text-sm mb-6 text-center">
              나만의 트리를 만들려면 먼저 로그인해주세요
            </p>
            <LoginButtons />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Tree Modal */}
      {isModalOpen && (
        <CreateTreeModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateTree}
        />
      )}
    </div>
  );
}
