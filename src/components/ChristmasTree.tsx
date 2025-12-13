'use client';

import { GuestbookEntry } from '../app/tree/[treeId]/page';
import { Star } from 'lucide-react';

interface ChristmasTreeProps {
  entries: GuestbookEntry[];
}

// 장식 타입 정의
type OrnamentType = 'ball' | 'star' | 'bell' | 'candy' | 'snowflake';

function getOrnamentType(index: number): OrnamentType {
  const types: OrnamentType[] = ['ball', 'star', 'bell', 'candy', 'snowflake'];
  return types[index % types.length];
}

function Ornament({ type, entry }: { type: OrnamentType; entry: GuestbookEntry }) {
  const baseClasses = "group cursor-pointer animate-bounce-slow";
  // 메시지 장식은 더 크고 눈에 띄게 - 글로우 효과만
  const glowClasses = "drop-shadow-[0_0_12px_currentColor,0_0_20px_currentColor] animate-pulse";

  switch (type) {
    case 'star':
      return (
        <div className={baseClasses}>
          <Star className={`w-10 h-10 text-yellow-300 fill-yellow-300 ${glowClasses}`} />
          <Tooltip message={entry.messages} letterType={entry.type} />
        </div>
      );
    case 'bell':
      return (
        <div className={baseClasses}>
          <div className={`w-10 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-full ${glowClasses} relative`}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-200 rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-yellow-800 rounded-full"></div>
          </div>
          <Tooltip message={entry.messages} letterType={entry.type} />
        </div>
      );
    case 'candy':
      return (
        <div className={baseClasses}>
          <div className={`w-9 h-12 bg-gradient-to-b from-red-500 via-white to-red-500 ${glowClasses} rounded-full relative`}>
          </div>
          <Tooltip message={entry.messages} letterType={entry.type} />
        </div>
      );
    case 'snowflake':
      return (
        <div className={baseClasses}>
          <div className={`w-10 h-10 text-blue-200 ${glowClasses} relative`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-blue-200 absolute"></div>
              <div className="w-full h-1 bg-blue-200 absolute rotate-45"></div>
              <div className="w-full h-1 bg-blue-200 absolute rotate-90"></div>
              <div className="w-full h-1 bg-blue-200 absolute -rotate-45"></div>
            </div>
          </div>
          <Tooltip message={entry.messages} letterType={entry.type} />
        </div>
      );
    default: // ball
      return (
        <div className={baseClasses}>
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-700 shadow-lg ${glowClasses} relative`}>
            <div className="absolute top-1 left-2 w-3 h-3 bg-white rounded-full opacity-90 blur-sm"></div>
            <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
          </div>
          <Tooltip message={entry.messages} letterType={entry.type} />
        </div>
      );
  }
}

function Tooltip({ message, letterType }: { message: string; letterType: string }) {
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

  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 z-[100]">
      <div className={`${letterClass} rounded-lg shadow-2xl p-4 min-h-[100px] relative`}>
        <p className="text-sm relative z-10 leading-relaxed whitespace-pre-wrap">{message}</p>
      </div>
      <div className={`w-3 h-3 ${letterClass} border-r border-b transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2`}></div>
    </div>
  );
}

export function ChristmasTree({ entries }: ChristmasTreeProps) {
  return (
    <div className="relative z-20">
      {/* Tree Star - 더 빛나게 */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
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
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="absolute"
            style={{
              left: `${entry.position.x}%`,
              top: `${entry.position.y}%`,
            }}
          >
            <Ornament type={getOrnamentType(index)} entry={entry} />
          </div>
        ))}
      </div>
    </div>
  );
}