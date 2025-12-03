import React, { useState, useEffect, useCallback } from 'react';
import { BUILT_IN_QUOTES, CATEGORIES } from '../utils/constants';
import { QuoteCard } from './QuoteCard';
import { Quote, Category } from '../types';

export const QuoteLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
  const [visibleQuotes, setVisibleQuotes] = useState<Quote[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds

  // Function to get random quotes, respecting category
  const refreshQuotes = useCallback(() => {
    let pool = BUILT_IN_QUOTES;
    
    // Filter by category first if not 'All'
    if (selectedCategory !== '全部') {
      pool = BUILT_IN_QUOTES.filter(q => q.category === selectedCategory);
    }

    // Fisher-Yates shuffle algorithm for true randomness
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    
    // Select top 8 quotes for display (or fewer if pool is small)
    setVisibleQuotes(shuffled.slice(0, 8));
    setTimeRemaining(120); // Reset timer
  }, [selectedCategory]);

  // Handle category change
  const handleCategoryChange = (cat: Category) => {
    setSelectedCategory(cat);
    // When category changes, immediately refresh to show relevant quotes
    // Effect will trigger refreshQuotes due to dependency
  };

  // Initial load and when category changes
  useEffect(() => {
    refreshQuotes();
  }, [refreshQuotes]);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          refreshQuotes();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshQuotes]);

  // Filter visible quotes if searching, otherwise show the random subset
  const displayQuotes = searchTerm 
    ? BUILT_IN_QUOTES.filter(q => q.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : visibleQuotes;

  return (
    <div className="space-y-8 animate-fade-in relative min-h-[600px]">
      <div className="text-center space-y-4 pt-4">
        <h2 className="text-3xl md:text-5xl font-serif-sc font-bold text-slate-800 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 tech-text-glow">
            小渝兒·人间清醒·语录馆
          </span>
        </h2>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-500 max-w-xl mx-auto font-light">
            生活的巴掌拍不响，<br/>
            这里有海量深度长文与扎心语录，直击成年人的痛点。
          </p>
          
          {/* Refresh Timer / Button */}
          {!searchTerm && (
             <div className="flex items-center gap-3 mt-2 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-purple-100 shadow-sm">
               <span className="text-xs text-slate-400 font-mono">
                 下次刷新: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
               </span>
               <button 
                 onClick={refreshQuotes}
                 className="text-xs font-bold text-purple-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow hover:animate-spin"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                 立即刷新
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Category Tabs - Scrollable */}
      <div className="relative group/scroll max-w-4xl mx-auto">
         <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar flex-nowrap mask-linear-fade justify-start md:justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 transform scale-105'
                    : 'bg-white text-slate-500 border border-rose-100 hover:border-rose-300 hover:text-rose-500'
                }`}
              >
                {cat}
              </button>
            ))}
         </div>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative group z-10">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-300 to-purple-300 rounded-full opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
        <input 
          type="text" 
          placeholder="搜索关键词... (搜索时暂停自动刷新)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="relative w-full bg-white border border-rose-100 text-slate-600 placeholder-slate-400 rounded-full py-3.5 px-6 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-300 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 pb-12">
        {displayQuotes.length > 0 ? (
          displayQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-slate-400 bg-white/50 rounded-3xl border border-dashed border-rose-200">
            <p>该分类下暂无相关语录，<br/>也许现实太过残酷，无法言说。</p>
          </div>
        )}
      </div>
      
      {!searchTerm && (
        <div className="text-center text-xs text-rose-300/50 pb-8 animate-pulse">
          系统将自动每 2 分钟切换不同语录 · 当前分类: {selectedCategory}
        </div>
      )}
    </div>
  );
};