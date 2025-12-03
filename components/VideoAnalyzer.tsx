import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, AnalysisStatus } from '../types';
import { analyzeVideoAndGenerateQuotes } from '../services/geminiService';
import { QuoteCard } from './QuoteCard';
import { HOT_TOPICS } from '../utils/constants';

// Updated duration logic to include 3m and 5m
type DurationOption = '10s' | '15s' | '25s' | '60s' | '3m' | '5m';

export const VideoAnalyzer: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [customInstruction, setCustomInstruction] = useState('');
  const [targetDuration, setTargetDuration] = useState<DurationOption>('15s');

  // New: History tracking to prevent duplicates
  const [generatedHistory, setGeneratedHistory] = useState<string[]>([]);

  // Progress state
  const [progress, setProgress] = useState(0);

  // Copy state for transcription
  const [transcriptionCopied, setTranscriptionCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clean up object URL when file changes
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Simulated progress effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (status === AnalysisStatus.ANALYZING) {
      setProgress(0);
      let currentProgress = 0;
      
      interval = setInterval(() => {
        // Fast start, then slow down to simulate thinking
        if (currentProgress < 90) {
          const remaining = 95 - currentProgress;
          // Random increment based on remaining distance
          const increment = Math.max(0.2, remaining * 0.05 * Math.random());
          currentProgress += increment;
          setProgress(Math.min(95, currentProgress));
        }
      }, 150);
    } else if (status === AnalysisStatus.COMPLETED) {
      setProgress(100);
    } else if (status === AnalysisStatus.ERROR || status === AnalysisStatus.IDLE) {
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        setError("请上传有效的视频文件 (MP4, MOV等)");
        return;
      }
      
      const newUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setVideoUrl(newUrl);
      setError(null);
      setResult(null);
      // Reset history when file changes because context changes
      setGeneratedHistory([]); 
      setStatus(AnalysisStatus.IDLE);
      // Duration will be set when metadata loads
    }
  };

  const onVideoMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration;
    setVideoDuration(duration);
    
    if (duration > 300) { // 300 seconds = 5 minutes
      setError("视频时长超过限制（最大5分钟）。请上传较短的视频。");
    }
  };

  const handleAnalyze = async () => {
    // Condition: Either file exists (and valid) OR custom instruction exists
    if (!file && !customInstruction.trim()) {
      setError("请至少上传一个视频或输入一个主题。");
      return;
    }
    
    // Check constraints if file exists
    if (file && videoDuration > 300) {
       setError("视频时长超过5分钟，无法进行二创。请更换视频。");
       return;
    }

    setStatus(AnalysisStatus.ANALYZING);
    setError(null);

    try {
      const analysisResult = await analyzeVideoAndGenerateQuotes(file, {
        customInstruction,
        targetDuration,
        avoidQuotes: generatedHistory // Pass history to avoid dupes
      });
      
      setResult(analysisResult);
      
      // Update history with new quotes
      setGeneratedHistory(prev => [...prev, ...analysisResult.generatedQuotes]);
      
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || "分析过程中发生未知错误，请重试。";
      
      // Better error message for the XHR error (likely large file)
      if (errorMessage.includes("Rpc failed") || errorMessage.includes("xhr error") || errorMessage.includes("code: 6")) {
         errorMessage = "网络传输失败：视频文件可能过大，浏览器无法直接处理。请尝试压缩视频或仅使用【自定义主题】进行生成。";
      }

      setError(errorMessage);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  // Called when "Another Set" is clicked
  const handleAnotherSet = () => {
     // Do not clear history; we want to build upon it to avoid repetition
     handleAnalyze();
  };

  const fullReset = () => {
      setFile(null);
      setVideoUrl(null);
      setResult(null);
      setStatus(AnalysisStatus.IDLE);
      setCustomInstruction('');
      setGeneratedHistory([]); // Clear history on full reset
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };

  const reupload = () => {
    setFile(null);
    setVideoUrl(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setGeneratedHistory([]); // New video means new context, so reset history
  };

  const handleTopicClick = (topic: string) => {
    setCustomInstruction(topic);
    // Reset history if user explicitly changes topic (optional UX choice, safer to reset to ensure freshness on new topic)
    setGeneratedHistory([]); 
  };

  const handleCopyTranscription = () => {
    if (result?.transcription) {
      navigator.clipboard.writeText(result.transcription);
      setTranscriptionCopied(true);
      setTimeout(() => setTranscriptionCopied(false), 2000);
    }
  };

  const getLoadingText = () => {
    if (progress < 25) return "小渝兒正在接收信号源... (Signal Receiving)";
    if (progress < 50) return "系统正在解构视频情感... (Decoding Emotions)";
    if (progress < 75) return "正在检索人间清醒数据库... (Accessing Database)";
    return "正在生成扎心语录... (Generating)";
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto pb-12">
      <div className="text-center space-y-3 pt-4">
        <h2 className="text-3xl md:text-5xl font-serif-sc font-bold text-slate-800">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-rose-400">
            视频二创 · 灵魂提取
          </span>
        </h2>
        <p className="text-slate-500 font-light">
          上传视频提取旁白，或直接输入主题。<br/>
          <span className="text-xs text-rose-400 opacity-80">* 自由创作 · 不限大小 · 支持纯文本</span>
        </p>
      </div>

      {/* Upload & Preview Area */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-xl shadow-rose-100/50 space-y-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-100/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl pointer-events-none"></div>

        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-rose-200 rounded-2xl p-8 text-center hover:border-purple-300 hover:bg-rose-50/50 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[200px]"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-1">上传视频 (可选)</h3>
            <p className="text-xs text-slate-400">点击上传 MP4, MOV 等，或直接在下方输入主题</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Player Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg aspect-video max-h-[300px] flex items-center justify-center group">
               {videoUrl && (
                 <video 
                   ref={videoRef}
                   src={videoUrl}
                   controls
                   className="w-full h-full object-contain"
                   onLoadedMetadata={onVideoMetadataLoaded}
                 />
               )}
            </div>
            
            <div className="flex items-center justify-between text-sm px-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
               <div className="flex flex-col">
                 <span className="text-slate-600 font-bold truncate max-w-[150px] md:max-w-[250px]">{file.name}</span>
                 <div className="flex gap-2 text-xs">
                    <span className={`${videoDuration > 300 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                        {Math.floor(videoDuration)}秒
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                 </div>
               </div>
               
               {/* Re-upload Button */}
               {status !== AnalysisStatus.ANALYZING && (
                 <button 
                  onClick={reupload}
                  className="px-3 py-1.5 bg-white border border-rose-200 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center gap-1 shadow-sm"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                   重新上传
                 </button>
               )}
            </div>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="video/*" 
          className="hidden" 
        />

        {/* Customization Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-rose-50">
           <div className="space-y-3 overflow-hidden">
             <label className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                自定义主题 (无需视频即可生成)
             </label>
             <input 
               type="text"
               value={customInstruction}
               onChange={(e) => setCustomInstruction(e.target.value)}
               placeholder="输入主题，例如: 房贷压力、车贷..."
               className="w-full bg-rose-50/50 border border-rose-100 rounded-xl py-3 px-4 text-sm text-slate-700 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all placeholder-slate-400"
               disabled={status === AnalysisStatus.ANALYZING}
             />
             
             {/* Tech Style Hot Topics Chips - Horizontally Scrollable */}
             <div className="relative group/scroll">
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar flex-nowrap mask-linear-fade">
                  {HOT_TOPICS.map((topic) => {
                    const isSelected = customInstruction === topic;
                    return (
                      <button
                        key={topic}
                        onClick={() => handleTopicClick(topic)}
                        disabled={status === AnalysisStatus.ANALYZING}
                        className={`tech-tag-shape relative overflow-hidden flex-shrink-0 text-[10px] font-bold px-4 py-1.5 border transition-all duration-300 ${
                          isSelected 
                            ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-200' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-500'
                        }`}
                      >
                        <span className="relative z-10">{topic}</span>
                      </button>
                    );
                  })}
                  {/* Spacer for right padding */}
                  <div className="w-4 flex-shrink-0"></div>
                </div>
                {/* Fade effect on right */}
                <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
             </div>
           </div>

           <div className="space-y-3">
             <label className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                语录时长偏好 (最大5分钟)
             </label>
             <div className="grid grid-cols-3 gap-2">
               {[
                 { id: '10s', label: '10秒', sub: '短句' },
                 { id: '15s', label: '15秒', sub: '金句' },
                 { id: '25s', label: '25秒', sub: '文案' },
                 { id: '60s', label: '1分钟', sub: '故事' },
                 { id: '3m', label: '3分钟', sub: '深度' },
                 { id: '5m', label: '5分钟', sub: '长篇' }
               ].map((opt) => (
                 <button
                   key={opt.id}
                   onClick={() => setTargetDuration(opt.id as DurationOption)}
                   disabled={status === AnalysisStatus.ANALYZING}
                   className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                     targetDuration === opt.id
                       ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-200'
                       : 'bg-white border-rose-100 text-slate-400 hover:border-purple-200 hover:text-purple-400'
                   }`}
                 >
                   <span className="text-sm font-bold">{opt.label}</span>
                   <span className="text-[10px] opacity-80">{opt.sub}</span>
                 </button>
               ))}
             </div>
           </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl flex items-center gap-3 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        {/* TECH PROGRESS BAR */}
        {status === AnalysisStatus.ANALYZING ? (
          <div className="w-full bg-slate-900 rounded-xl p-6 border border-rose-500/30 shadow-2xl space-y-4 relative overflow-hidden tech-glow">
             <div className="scan-line"></div>
             <div className="flex justify-between text-xs font-bold text-rose-300 px-1 font-mono tracking-wider relative z-10">
               <span className="flex items-center gap-2">
                 <span className="animate-spin h-3 w-3 border-2 border-rose-400 border-t-transparent rounded-full"></span>
                 {getLoadingText()}
               </span>
               <span className="text-purple-300">{Math.floor(progress)}%</span>
             </div>
             
             {/* Progress Track */}
             <div className="w-full bg-slate-800 rounded-full h-5 overflow-hidden border border-slate-700 relative z-10">
               {/* Progress Fill with Tech Stripes */}
               <div 
                 className="h-full bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 transition-all duration-300 ease-out tech-stripes relative"
                 style={{ width: `${progress}%` }}
               >
                 <div className="absolute right-0 top-0 h-full w-1 bg-white shadow-[0_0_10px_white]"></div>
               </div>
             </div>
          </div>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={(!!error && !customInstruction) || (!file && !customInstruction)}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200 ${
              (!file && !customInstruction)
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-rose-400 to-purple-500 hover:scale-[1.01] active:scale-[0.99] tech-glow'
            }`}
          >
            {file ? '开始视频二创 (Start)' : '开始主题创作 (Start)'}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        )}
      </div>

      {/* Results */}
      {status === AnalysisStatus.COMPLETED && result && (
        <div className="space-y-8 animate-fade-in-up">
          
          <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm relative group">
            <div className="absolute -left-1 top-6 w-1 h-8 bg-purple-400 rounded-r-full"></div>
            <div className="flex justify-between items-start pl-3 mb-2">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  {file ? '原视频内容摘要' : '创作主题背景'}
                </h3>
                <button
                  onClick={handleCopyTranscription}
                  className={`text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-md ${transcriptionCopied ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:text-purple-500 hover:bg-purple-50'}`}
                  title="复制内容"
                >
                   {transcriptionCopied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        已复制
                      </>
                   ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        复制
                      </>
                   )}
                </button>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm pl-3 whitespace-pre-wrap">
              {result.transcription}
            </p>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-200"></div>
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600 font-serif-sc font-bold text-xl tech-text-glow">
                    二创结果 ({targetDuration})
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-rose-200 to-transparent"></div>
             </div>

             <div className="grid grid-cols-1 gap-6">
                {result.generatedQuotes.map((text, idx) => (
                  <QuoteCard 
                    key={`gen-${idx}-${text.substring(0,5)}`} 
                    quote={{ id: Date.now() + idx, text }} 
                    isGenerated={true}
                  />
                ))}
             </div>
          </div>
          
          <div className="flex gap-4 justify-center pt-8">
            <button 
              onClick={handleAnotherSet}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-rose-400 to-purple-500 text-white font-bold hover:shadow-lg hover:scale-105 transition-all shadow-md shadow-rose-200"
            >
              再来一组 (Another Set)
            </button>
            <button 
              onClick={fullReset}
              className="px-8 py-3 rounded-full bg-white border border-rose-200 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-all shadow-sm"
            >
              清空重置 (Reset)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};