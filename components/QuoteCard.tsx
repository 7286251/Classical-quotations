import React, { useState } from 'react';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  className?: string;
  isGenerated?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, className = "", isGenerated = false }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Check if text is long enough to need a toggle (e.g., > 150 chars)
  const isLongText = quote.text.length > 200;
  
  // For generated content, we might default to expanded if it's the result, 
  // but for the library, we collapse.
  // Here we'll default to collapsed for long text to save UI space.
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(quote.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`relative group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 flex flex-col ${
      isGenerated 
        ? 'bg-gradient-to-br from-white to-purple-50 border-purple-100 hover:border-purple-200 shadow-[0_8px_30px_rgb(192,132,252,0.15)]' 
        : 'bg-white border-rose-100 hover:border-rose-200 shadow-[0_8px_30px_rgb(251,113,133,0.1)]'
    } ${className}`}>
      
      {/* Decorative Quote Mark */}
      <div className={`absolute top-4 left-5 text-6xl font-serif leading-none opacity-20 pointer-events-none select-none ${
        isGenerated ? 'text-purple-300' : 'text-rose-300'
      }`}>
        “
      </div>

      <div className={`relative z-10 pt-4 pb-2 flex-grow ${!expanded && isLongText ? 'cursor-pointer' : ''}`} onClick={(!expanded && isLongText) ? toggleExpand : undefined}>
        <div className={`text-lg md:text-xl font-serif-sc leading-relaxed tracking-wide text-slate-700 text-justify whitespace-pre-wrap transition-all duration-500 ${
          !expanded && isLongText ? 'line-clamp-6 mask-linear-fade-bottom' : ''
        }`}>
          {quote.text}
        </div>
        
        {isLongText && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
            className={`mt-2 text-xs font-bold flex items-center gap-1 transition-colors ${
              isGenerated ? 'text-purple-400 hover:text-purple-600' : 'text-rose-400 hover:text-rose-600'
            }`}
          >
            {expanded ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                收起全文
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                展开全文 ({quote.text.length}字)
              </>
            )}
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-md bg-opacity-10 ${
            isGenerated 
              ? 'bg-purple-500 text-purple-500' 
              : 'bg-rose-500 text-rose-500'
          }`}>
            {isGenerated ? '#AI二创' : '#大承活法'}
          </span>
          {quote.category && (
             <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-500">
               {quote.category}
             </span>
          )}
        </div>
        
        <button 
          onClick={handleCopy}
          className={`text-xs flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full ${
            copied 
              ? 'bg-green-100 text-green-600'
              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              已复制
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              复制文案
            </>
          )}
        </button>
      </div>
    </div>
  );
};