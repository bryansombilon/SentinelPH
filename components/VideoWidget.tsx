import React, { useState, useEffect, useRef } from 'react';

interface VideoWidgetProps {
  id: string;
  defaultTitle: string;
}

const VideoWidget: React.FC<VideoWidgetProps> = ({ id, defaultTitle }) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedId = localStorage.getItem(`sentinel_video_${id}`);
    if (savedId) {
      setVideoId(savedId);
    } else {
      setIsEditing(true);
    }
  }, [id]);

  const extractVideoId = (input: string): string | null => {
    if (!input) return null;
    const cleanInput = input.trim();
    
    // 1. Direct ID check (exactly 11 chars, alphanumeric with - or _)
    const idPattern = /^[a-zA-Z0-9_-]{11}$/;
    if (idPattern.test(cleanInput)) {
        return cleanInput;
    }

    try {
        const url = new URL(cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`);
        const hostname = url.hostname.toLowerCase();
        
        // Handle youtu.be short links
        if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
            const pathname = url.pathname;
            // Remove leading slash and any trailing chars
            const potentialId = pathname.split('/').filter(Boolean)[0];
            if (potentialId && idPattern.test(potentialId)) {
                return potentialId;
            }
        }

        // Handle standard youtube.com links (including m.youtube.com, www.youtube.com, music.youtube.com)
        if (hostname.includes('youtube.com')) {
            // Priority 1: 'v' query parameter (Standard Watch URLs)
            const vParam = url.searchParams.get('v');
            if (vParam && idPattern.test(vParam)) {
                return vParam;
            }

            // Priority 2: Path based URLs (Embed, Live, Shorts, V)
            const pathSegments = url.pathname.split('/').filter(Boolean);
            
            // Check for specific prefixes
            for (let i = 0; i < pathSegments.length; i++) {
                const segment = pathSegments[i].toLowerCase();
                if (['embed', 'v', 'shorts', 'live'].includes(segment)) {
                    // The ID should be the next segment
                    const nextSegment = pathSegments[i+1];
                    if (nextSegment && idPattern.test(nextSegment)) {
                        return nextSegment;
                    }
                }
            }
        }
    } catch (e) {
        // Continue to regex fallback if URL parsing fails
    }

    // Fallback: Regex to catch ID in various standard formats
    // Matches patterns like: /live/ID, v=ID, /embed/ID, or short links
    const regex = /(?:[\/=])([a-zA-Z0-9_-]{11})(?:[?&]|$)/;
    const match = cleanInput.match(regex);
    if (match && match[1]) return match[1];

    return null;
  };

  const handleSave = () => {
    setError(null);
    const cleanedInput = inputValue.trim();
    
    if (!cleanedInput) {
        setError("Please paste a URL");
        return;
    }

    const vid = extractVideoId(cleanedInput);
    
    if (vid) {
      setVideoId(vid);
      localStorage.setItem(`sentinel_video_${id}`, vid);
      setIsEditing(false);
      setInputValue('');
    } else {
        setError("Invalid Link. Try using the Share button.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSave();
    }
  };

  const handleReset = () => {
      setIsEditing(true);
      setError(null);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  // Standard Embed URL construction
  // Removed explicit 'origin' parameter to avoid Error 153 in restricted environments
  const getEmbedUrl = (vid: string) => {
      return `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&playsinline=1`;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-bento-card border border-bento-border rounded-2xl overflow-hidden shadow-lg group flex flex-col">
      {!isEditing && (
        <div className="absolute top-2 right-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button 
                onClick={toggleFullscreen}
                className="p-1.5 bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white rounded-md backdrop-blur border border-white/10 transition-colors"
                title="Toggle Fullscreen"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>

            <button 
                onClick={handleReset}
                className="p-1.5 bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white rounded-md backdrop-blur border border-white/10 transition-colors"
                title="Change Video Source"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-bento-card relative z-40 overflow-y-auto">
            <div className={`w-8 h-8 mb-2 rounded-full ${error ? 'bg-red-500/20 text-red-400' : 'bg-bento-highlight/20 text-gray-500'} flex items-center justify-center transition-colors duration-300`}>
                {error ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                )}
            </div>
            <h3 className="text-[10px] font-mono text-gray-400 mb-2 uppercase tracking-wider">{defaultTitle}</h3>
            <div className="w-full max-w-[240px] flex flex-col gap-2">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Paste YouTube Link (Live/Video)"
                        className={`w-full bg-black/30 border ${error ? 'border-red-500 text-red-200' : 'border-bento-border text-white'} rounded px-3 py-1.5 text-[10px] placeholder-gray-600 focus:outline-none focus:border-bento-accent transition-colors font-mono`}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            if(error) setError(null);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    {error && (
                        <div className="absolute top-full left-0 mt-1 flex items-center text-[9px] text-red-400 font-mono tracking-wide">
                            <span className="mr-1">●</span> {error}
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={handleSave}
                    className="w-full py-1.5 bg-bento-accent/10 hover:bg-bento-accent/20 text-bento-accent border border-bento-accent/30 rounded text-[10px] font-bold transition-all uppercase tracking-wide"
                >
                    Load Stream
                </button>
                {videoId && (
                     <button onClick={() => setIsEditing(false)} className="text-[9px] text-gray-500 hover:text-gray-300 mt-1">Cancel</button>
                )}
            </div>

            {/* Guide Section */}
            <div className="mt-4 w-full max-w-[240px] border-t border-white/5 pt-3">
                <div className="text-[8px] text-gray-500 font-mono text-center mb-2 font-bold tracking-widest">ACCEPTED FORMATS</div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 bg-black/20 px-2 py-1 rounded">
                        <span className="opacity-70">LIVE</span>
                        <span className="text-gray-500">youtube.com/live/ID</span>
                    </div>
                     <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 bg-black/20 px-2 py-1 rounded">
                        <span className="opacity-70">SHARE</span>
                        <span className="text-gray-500">youtu.be/ID</span>
                    </div>
                     <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 bg-black/20 px-2 py-1 rounded">
                        <span className="opacity-70">URL</span>
                        <span className="text-gray-500">youtube.com/watch?v=ID</span>
                    </div>
                </div>
                <p className="mt-2 text-[8px] text-bento-accent/60 text-center font-mono">
                    <span className="font-bold">TIP:</span> Use the "Share" button on YouTube.
                </p>
            </div>
        </div>
      ) : (
        <div className="w-full h-full bg-black relative">
            <iframe 
                src={getEmbedUrl(videoId!)}
                title={defaultTitle}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
            
            <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
                 <div className="px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-gray-300 border border-white/10">
                    {defaultTitle}
                 </div>
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-red-900/40 backdrop-blur rounded border border-red-500/30">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                     <span className="text-[9px] font-bold text-red-400 tracking-wider">LIVE</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VideoWidget;