'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export type LetterType = 'snowflake' | 'christmas' | 'floral' | 'simple' | 'stars' | 'winter';

interface GuestbookFormProps {
  onSubmit: (messages: string, letterType: LetterType, isPrivate: boolean) => void;
}

const letterTypes: { value: LetterType; label: string; preview: string }[] = [
  { value: 'snowflake', label: '눈송이', preview: '❄️' },
  { value: 'christmas', label: '크리스마스', preview: '🎄' },
  { value: 'floral', label: '꽃', preview: '🌸' },
  { value: 'simple', label: '심플', preview: '📝' },
  { value: 'stars', label: '별', preview: '⭐' },
  { value: 'winter', label: '겨울', preview: '❄️' },
];

export function GuestbookForm({ onSubmit }: GuestbookFormProps) {
  const [messages, setMessages] = useState('');
  const [selectedType, setSelectedType] = useState<LetterType>('snowflake');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messages.trim()) {
      onSubmit(messages, selectedType, isPrivate);
      setMessages('');
      setIsPrivate(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 w-[90vw] max-w-md mx-auto border border-slate-600"
    >
      {/* 편지지 타입 선택 */}
      <div className="mb-3">
        <label className="block text-sm text-gray-300 mb-2">편지지 선택</label>
        <div className="grid grid-cols-3 gap-2">
          {letterTypes.map((type) => (
            <label
              key={type.value}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === type.value
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name="letterType"
                value={type.value}
                checked={selectedType === type.value}
                onChange={(e) => setSelectedType(e.target.value as LetterType)}
                className="hidden"
              />
              <span className="text-2xl mb-1">{type.preview}</span>
              <span className="text-xs text-gray-300">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <textarea
          placeholder="메시지를 남겨주세요..."
          value={messages}
          onChange={(e) => setMessages(e.target.value)}
          className={`w-full px-3 py-2 text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors resize-none placeholder-gray-500 ${
            selectedType === 'snowflake' ? 'letter-paper-snowflake' :
            selectedType === 'christmas' ? 'letter-paper-christmas' :
            selectedType === 'floral' ? 'letter-paper-floral' :
            selectedType === 'simple' ? 'letter-paper-simple' :
            selectedType === 'stars' ? 'letter-paper-stars' :
            'letter-paper-winter'
          }`}
          style={{
            minHeight: '80px',
          }}
          rows={3}
          maxLength={100}
        />
      </div>

      {/* 비밀 메시지 토글 */}
      <div className="mb-3">
        <label className="block text-sm text-gray-300 mb-2">메시지 타입</label>
        <div className="grid grid-cols-2 gap-2">
          {/* 일반 메시지 */}
          <label
            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
              !isPrivate
                ? 'border-red-500 bg-red-500/20'
                : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
            }`}
          >
            <input
              type="radio"
              name="messageType"
              checked={!isPrivate}
              onChange={() => setIsPrivate(false)}
              className="hidden"
            />
            <span className="text-2xl mb-1">💌</span>
            <span className="text-xs text-gray-300 font-medium">일반 메시지</span>
          </label>

          {/* 비밀 메시지 */}
          <label
            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
              isPrivate
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
            }`}
          >
            <input
              type="radio"
              name="messageType"
              checked={isPrivate}
              onChange={() => setIsPrivate(true)}
              className="hidden"
            />
            <span className="text-2xl mb-1">🎁</span>
            <span className="text-xs text-gray-300 font-medium">비밀 선물</span>
          </label>
        </div>
        {isPrivate && (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed text-center">
            새해 첫날이 되면 트리 주인만 이 메시지를 열어볼 수 있어요 ✨
          </p>
        )}
      </div>
      <button
        type="submit"
        className="w-full text-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
      >
        <Send size={18} />
        <span>장식 달기</span>
      </button>
    </form>
  );
}