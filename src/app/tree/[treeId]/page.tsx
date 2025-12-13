'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChristmasTree } from '@/components/ChristmasTree';
import { GuestbookForm } from '@/components/GuestbookForm';
import { CreateTreeModal } from '@/components/CreateTreeModal';
import { Plus, Home, Copy, Check } from 'lucide-react';
import { getTree } from '@/app/actions/tree';
import { getMessages, createMessage } from '@/app/actions/message';

export interface GuestbookEntry {
  id: string;
  messages: string;
  type: string;
  position: { x: number; y: number };
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
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTreeData() {
      if (!treeId) return;
      
      setIsLoading(true);
      try {
        const tree = await getTree(treeId);
        if (!tree) {
          router.push('/');
          return;
        }
        
        setTreeData(tree);
        
        // 메시지 로드
        const messages = await getMessages(treeId);
        const formattedEntries: GuestbookEntry[] = messages.map((msg, index) => ({
          id: msg.id,
          messages: msg.messages,
          type: msg.type || 'snowflake',
          position: {
            // 클라이언트에서 랜덤 위치 생성 (인덱스 기반으로 일관성 유지)
            x: (index * 23.7) % 60 + 20,
            y: (index * 31.4) % 50 + 20,
          },
        }));
        setEntries(formattedEntries);
      } catch (error) {
        console.error('Failed to load tree:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTreeData();
  }, [treeId, router]);

  const handleAddEntry = async (messages: string, letterType: string) => {
    if (!treeId || !treeData) return;

    try {
      const newMessage = await createMessage(treeId, messages, letterType);
      
      const newEntry: GuestbookEntry = {
        id: newMessage.id,
        messages: newMessage.messages,
        type: newMessage.type || 'snowflake',
        position: {
          // 새 메시지의 랜덤 위치 생성
          x: Math.random() * 60 + 20,
          y: Math.random() * 50 + 20,
        },
      };

      setEntries([...entries, newEntry]);
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('메시지 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCreateTree = async (nickname: string) => {
    try {
      const { createTree } = await import('@/app/actions/tree');
      const newTreeId = await createTree(nickname);
      setIsModalOpen(false);
      router.push(`/tree/${newTreeId}`);
    } catch (error) {
      console.error('Failed to create tree:', error);
      alert('트리 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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

      {/* Home button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-8 right-8 bg-slate-800/60 hover:bg-slate-700/80 backdrop-blur-sm text-gray-200 rounded-full p-2 shadow-lg transition-all hover:scale-110 z-50 border border-slate-600 pointer-events-auto"
        aria-label="홈으로"
      >
        <Home size={20} />
      </button>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="absolute top-20 right-8 bg-slate-800/60 hover:bg-slate-700/80 backdrop-blur-sm text-gray-200 rounded-full p-2 shadow-lg transition-all hover:scale-110 z-50 mt-4 border border-slate-600 pointer-events-auto"
        aria-label="링크 복사"
      >
        {copied ? <Check size={20} /> : <Copy size={20} />}
      </button>

      {/* Christmas Tree - 부각되게 */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-32 relative z-20">
        <div className="relative">
          {/* 트리 주변 글로우 효과 */}
          <div className="absolute inset-0 blur-3xl bg-green-900/20 -z-10 scale-150"></div>
          <ChristmasTree entries={entries} />
        </div>
      </div>

      {/* Guestbook Form */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <GuestbookForm onSubmit={handleAddEntry} />
      </div>

      {/* Create Tree Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg transition-all  hover:scale-110 z-20"
        aria-label="나만의 트리 만들기"
      >
        <Plus size={24} />
      </button>

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
