'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GuestbookEntry } from '../app/tree/[treeId]/page';
import { Star, Gift, Lock } from 'lucide-react';

interface ChristmasTreeProps {
  entries: GuestbookEntry[];
}

// 장식 타입 정의
type OrnamentType = 'ball' | 'star' | 'bell' | 'candy' | 'snowflake' | 'gift' | 'secret';

function getOrnamentType(index: number, isPrivate?: boolean): OrnamentType {
  // 비밀 메시지는 특별한 장식 사용
  if (isPrivate) {
    return 'secret';
  }
  const types: OrnamentType[] = ['ball', 'star', 'bell', 'candy', 'snowflake'];
  return types[index % types.length];
}

function Ornament({ type, entry, isOpen, isHovered, onToggle, onMouseEnter, onMouseLeave }: { 
  type: OrnamentType; 
  entry: GuestbookEntry; 
  isOpen: boolean; 
  isHovered: boolean;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const positionRef = useRef<HTMLDivElement>(null);
  
  // entry.id를 기반으로 일관성 있는 애니메이션 속도와 딜레이 생성
  const idString = String(entry.id); // 문자열로 변환
  const hash = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const animationDuration = 2 + (hash % 3) + (hash % 5) * 0.2; // 2.0 ~ 4.8초 사이
  const animationDelay = (hash % 10) * 0.2; // 0 ~ 1.8초 사이
  const bounceHeight = 3 + (hash % 4); // 3 ~ 6px 사이
  
  const baseClasses = `group cursor-pointer relative`;
  // 메시지 장식은 더 크고 눈에 띄게 - 글로우 효과만
  const glowClasses = "drop-shadow-[0_0_12px_currentColor,0_0_20px_currentColor] animate-pulse";
  
  // 인라인 스타일로 애니메이션 적용 (CSS 변수 대신 직접 키프레임 정의)
  const animationStyle: React.CSSProperties = {
    animation: `bounce-custom-${hash} ${animationDuration}s ease-in-out ${animationDelay}s infinite`,
  };
  
  // 동적 키프레임 스타일 생성 (useEffect로 주입)
  useEffect(() => {
    const styleId = `bounce-animation-${hash}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes bounce-custom-${hash} {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-${bounceHeight}px);
          }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      // 컴포넌트 언마운트 시 스타일 제거하지 않음 (다른 장식이 사용할 수 있음)
    };
  }, [hash, bounceHeight]);

  const ornamentContent = (() => {
    switch (type) {
      case 'secret':
        // 비밀 메시지 특별 장식: 선물 상자 + 자물쇠
        return (
          <div className={`relative ${glowClasses}`}>
            <Gift className={`w-12 h-12 text-purple-400 fill-purple-500/80 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]`} />
            <Lock className={`w-5 h-5 text-yellow-300 fill-yellow-400 absolute -top-1 -right-1 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse`} />
            {/* 반짝이는 효과 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-yellow-300 rounded-full absolute top-1 left-2 animate-ping"></div>
              <div className="w-1.5 h-1.5 bg-purple-300 rounded-full absolute bottom-2 right-1 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        );
      case 'star':
        return <Star className={`w-10 h-10 text-yellow-300 fill-yellow-300 ${glowClasses}`} />;
      case 'bell':
        return (
          <div className={`w-10 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-full ${glowClasses} relative`}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-200 rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-yellow-800 rounded-full"></div>
          </div>
        );
      case 'candy':
        return (
          <div className={`w-9 h-12 bg-gradient-to-b from-red-500 via-white to-red-500 ${glowClasses} rounded-full relative`}>
          </div>
        );
      case 'snowflake':
        return (
          <div className={`w-10 h-10 text-blue-200 ${glowClasses} relative`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-blue-200 absolute"></div>
              <div className="w-full h-1 bg-blue-200 absolute rotate-45"></div>
              <div className="w-full h-1 bg-blue-200 absolute rotate-90"></div>
              <div className="w-full h-1 bg-blue-200 absolute -rotate-45"></div>
            </div>
          </div>
        );
      default: // ball
        return (
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-700 shadow-lg ${glowClasses} relative`}>
            <div className="absolute top-1 left-2 w-3 h-3 bg-white rounded-full opacity-90 blur-sm"></div>
            <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
          </div>
        );
    }
  })();

  return (
    <div 
      ref={positionRef}
      className={baseClasses} 
      style={animationStyle}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {ornamentContent}
      <Tooltip message={entry.messages} letterType={entry.type} isOpen={isOpen} isHovered={isHovered} isPrivate={entry.isPrivate} positionRef={positionRef} />
    </div>
  );
}

function Tooltip({ message, letterType, isOpen, isHovered, isPrivate, positionRef }: { message: string; letterType: string; isOpen: boolean; isHovered: boolean; isPrivate?: boolean; positionRef: React.RefObject<HTMLDivElement> }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (positionRef.current && (isOpen || isHovered)) {
      const updatePosition = () => {
        if (positionRef.current) {
          const rect = positionRef.current.getBoundingClientRect();
          setPosition({
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
          });
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, isHovered, positionRef]);

  const getLetterClass = (type: string) => {
    switch (type) {
      case 'snowflake':
        return 'letter-paper-snowflake';
      case 'christmas':
        return 'letter-paper-christmas';
      case 'floral':
        return 'letter-paper-floral';
      case 'simple':
        return 'letter-paper-simple';
      case 'stars':
        return 'letter-paper-stars';
      case 'winter':
        return 'letter-paper-winter';
      default:
        return 'letter-paper-simple';
    }
  };

  const letterClass = getLetterClass(letterType);
  const shouldShow = (isOpen || isHovered) && mounted;

  if (!shouldShow) {
    return null;
  }

  const tooltipContent = (
    <div 
      ref={tooltipRef}
      className="fixed pointer-events-none"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 999999,
        marginBottom: '8px',
      }}
    >
      <div className={`${letterClass} rounded-lg shadow-2xl p-4 min-h-[100px] relative pointer-events-auto w-64`}>
        {isPrivate ? (
          <div className="flex flex-col items-center justify-center min-h-[100px] text-gray-600">
            <span className="text-3xl mb-3">🎁</span>
            <p className="text-sm relative z-10 leading-relaxed text-center font-medium mb-1">
              시간이 지나면 열리는
            </p>
            <p className="text-sm relative z-10 leading-relaxed text-center font-medium mb-2">
              특별한 선물이에요
            </p>
            <p className="text-xs mt-1 text-gray-500 text-center leading-relaxed">
              새해 첫날, 트리 주인만<br/>이 메시지를 열어볼 수 있어요 ✨
            </p>
          </div>
        ) : (
          <p className="text-sm relative z-10 leading-relaxed whitespace-pre-wrap">{message}</p>
        )}
      </div>
      <div className={`w-3 h-3 ${letterClass} border-r border-b transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2`}></div>
    </div>
  );

  return mounted ? createPortal(tooltipContent, document.body) : null;
}

export function ChristmasTree({ entries }: ChristmasTreeProps) {
  const [openOrnamentId, setOpenOrnamentId] = useState<string | null>(null);
  const [hoveredOrnamentId, setHoveredOrnamentId] = useState<string | null>(null);

  const handleOrnamentToggle = (entryId: string) => {
    setOpenOrnamentId(openOrnamentId === entryId ? null : entryId);
  };

  const handleOrnamentMouseEnter = (entryId: string) => {
    setHoveredOrnamentId(entryId);
  };

  const handleOrnamentMouseLeave = () => {
    setHoveredOrnamentId(null);
  };

  // 외부 클릭 시 tooltip 닫기
  const handleOutsideClick = () => {
    setOpenOrnamentId(null);
  };

  return (
    <div className="relative z-20" onClick={handleOutsideClick}>
      {/* Tree Star - 더 빛나게 */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-[1]">
        <Star className="w-14 h-14 text-yellow-300 fill-yellow-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse" />
      </div>

      {/* Tree layers - 어둡고 채도 낮은 녹색 */}
      <div className="flex flex-col items-center">
        {/* Top layer */}
        <div className="w-0 h-0 border-l-[70px] border-l-transparent border-r-[70px] border-r-transparent border-b-[110px] border-b-[#1a3a1a] relative shadow-2xl">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[95px] border-b-[#2d4a2d]"></div>
        </div>

        {/* Middle layer */}
        <div className="w-0 h-0 border-l-[90px] border-l-transparent border-r-[90px] border-r-transparent border-b-[130px] border-b-[#1a3a1a] -mt-8 relative shadow-2xl">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-b-[115px] border-b-[#2d4a2d]"></div>
        </div>

        {/* Bottom layer */}
        <div className="w-0 h-0 border-l-[110px] border-l-transparent border-r-[110px] border-r-transparent border-b-[150px] border-b-[#1a3a1a] -mt-8 relative shadow-2xl">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[100px] border-l-transparent border-r-[100px] border-r-transparent border-b-[135px] border-b-[#2d4a2d]"></div>
        </div>

        {/* Tree trunk - 어두운 갈색 */}
        <div className="w-14 h-18 bg-[#3d2817] -mt-2 rounded-sm shadow-lg"></div>
      </div>

      {/* Ornaments (Guestbook entries) - 다양한 타입 */}
      <div className="absolute inset-0 w-full h-full">
        {entries.map((entry, index) => {
          const isCurrentlyOpen = openOrnamentId === entry.id;
          const isCurrentlyHovered = hoveredOrnamentId === entry.id;
          const isActive = isCurrentlyOpen || isCurrentlyHovered;
          return (
            <div
              key={entry.id}
              className="absolute"
              style={{
                left: `${entry.position.x}%`,
                top: `${entry.position.y}%`,
                zIndex: isActive ? 999999 : 10 + index,
              }}
            >
              <Ornament 
                type={getOrnamentType(index, entry.isPrivate)} 
                entry={entry} 
                isOpen={isCurrentlyOpen}
                isHovered={isCurrentlyHovered}
                onToggle={() => handleOrnamentToggle(entry.id)}
                onMouseEnter={() => handleOrnamentMouseEnter(entry.id)}
                onMouseLeave={handleOrnamentMouseLeave}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}