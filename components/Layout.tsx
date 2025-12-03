import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-rose-200 selection:text-rose-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-rose-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-purple-400 rounded-xl shadow-lg shadow-rose-200 flex items-center justify-center text-white font-serif-sc font-bold text-lg transform rotate-3">
              承
            </div>
            <h1 className="text-xl font-bold font-serif-sc tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-purple-600">
              大承活法
            </h1>
          </div>
          
          <nav className="flex gap-1 bg-rose-50/80 p-1.5 rounded-full border border-rose-100">
            <button
              onClick={() => onViewChange(ViewState.LIBRARY)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                currentView === ViewState.LIBRARY
                  ? 'bg-white text-rose-500 shadow-md shadow-rose-100'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              经典语录
            </button>
            <button
              onClick={() => onViewChange(ViewState.CREATE)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                currentView === ViewState.CREATE
                  ? 'bg-white text-purple-500 shadow-md shadow-purple-100'
                  : 'text-slate-400 hover:text-purple-400'
              }`}
            >
              视频二创
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 mt-12 text-center text-slate-400 text-sm">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent mb-8 opacity-50"></div>
        <p className="font-serif-sc">© {new Date().getFullYear()} 大承活法 · 少女心扎心工厂</p>
        <p className="mt-2 text-xs opacity-60">Powered by Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
};