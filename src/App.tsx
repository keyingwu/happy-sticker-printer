import React, { useState, useRef } from 'react';
import { generateSticker, STYLES, IMAGE_MODELS } from './services/geminiService';
import { Printer } from './components/Printer';
import { PlacedSticker, DragItem } from './types';

import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

// Helper to normalize mouse and touch coordinates
const getClientCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    } else if ('clientX' in e) {
      return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }
    return { x: 0, y: 0 };
};

export default function App() {
  // Input State
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS.FLASH);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  
  // Generation Logic State
  // We track how many times we've printed for the current input to cycle through categories
  const [generationCount, setGenerationCount] = useState(0);
  
  // History State: Tracks concepts generated for the current prompt to avoid repetition
  const [conceptHistory, setConceptHistory] = useState<string[]>([]);
  
  // Sticker State
  // Changed from just string URL to object to track prompt for downloads
  const [freshSticker, setFreshSticker] = useState<{url: string, prompt: string} | null>(null);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [zoomedSticker, setZoomedSticker] = useState<PlacedSticker | null>(null);

  // Drag State
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Generate Handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    setFreshSticker(null);

    try {
      // Step 1 & 2: Call service with history
      const { imageUrl, concept } = await generateSticker(prompt, selectedStyle, generationCount, conceptHistory, selectedModel, isBatchMode);
      
      // Store prompt alongside url for filename generation
      setFreshSticker({ url: imageUrl, prompt });
      
      // Increment count so the next click gets the next aspect category
      setGenerationCount(prev => prev + 1);
      
      // Add the new concept to history so we don't generate it again
      setConceptHistory(prev => [...prev, concept]);
      
    } catch (err) {
      console.error(err);
      setError("Printer jammed! Try again.");
    } finally {
      setLoading(false);
    }
  };



  // Download Handler (Single)
  const downloadSticker = (url: string, promptName: string) => {
      const link = document.createElement('a');
      link.href = url;
      // Sanitize filename
      const safeName = promptName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim();
      link.download = `sticker-${safeName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Download Handler (ZIP)
  const handleDownloadAll = async () => {
      if (placedStickers.length === 0) return;
      setIsZipping(true);
      try {
          const zip = new JSZip();
          const folder = zip.folder("my-stickers");

          if (!folder) return;

          placedStickers.forEach((sticker, index) => {
              // sticker.url is "data:image/png;base64,..."
              // We need to strip the prefix to get the raw base64 string
              const base64Data = sticker.url.split(',')[1];
              const safeName = sticker.prompt.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim();
              const fileName = `sticker-${safeName}-${index + 1}.png`;
              
              folder.file(fileName, base64Data, { base64: true });
          });

          const content = await zip.generateAsync({ type: "blob" });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `sticker-collection-${Date.now()}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (e) {
          console.error("Failed to zip stickers", e);
          setError("Could not zip files.");
      } finally {
          setIsZipping(false);
      }
  };

  // Delete Handler
  const deleteSticker = (id: string) => {
      setPlacedStickers(prev => prev.filter(sticker => sticker.id !== id));
  };

  // Scale (Zoom) Handlers for placed stickers
  const adjustStickerScale = (id: string, delta: number) => {
      const MIN_SCALE = 0.5;
      const MAX_SCALE = 2.5;

      setPlacedStickers(prev =>
          prev.map(sticker =>
              sticker.id === id
                  ? {
                        ...sticker,
                        scale: Math.min(
                            MAX_SCALE,
                            Math.max(MIN_SCALE, sticker.scale + delta)
                        ),
                    }
                  : sticker
          )
      );
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, type: 'fresh' | 'placed', id?: string) => {
    const { x: clientX, y: clientY } = getClientCoords(e);

    let initialItemX = 0;
    let initialItemY = 0;

    if (type === 'placed' && id) {
        const sticker = placedStickers.find(s => s.id === id);
        if (sticker) {
            initialItemX = sticker.x;
            initialItemY = sticker.y;
        }
    }

    setDragItem({
        type,
        id,
        startX: clientX,
        startY: clientY,
        initialItemX,
        initialItemY
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragItem || !canvasRef.current) return;

    const { x: clientX, y: clientY } = getClientCoords(e);
    const deltaX = clientX - dragItem.startX;
    const deltaY = clientY - dragItem.startY;

    if (dragItem.type === 'placed' && dragItem.id) {
        setPlacedStickers(prev => prev.map(s => {
            if (s.id === dragItem.id) {
                return { ...s, x: dragItem.initialItemX + deltaX, y: dragItem.initialItemY + deltaY };
            }
            return s;
        }));
    }
  };

  const handleMouseUp = () => {
    setDragItem(null);
  };

  const startDragFresh = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); 
      if (!freshSticker || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const { x: clientX, y: clientY } = getClientCoords(e);

      // Calculate precise start position relative to canvas
      // Updated for smaller 256px sticker
      const stickerWidth = 256;
      const printerX = (rect.width / 2) - (stickerWidth / 2);
      // Adjusted printerY for the compact printer head (approx 220px down)
      const printerY = 220; 

      const newId = Date.now().toString();
      const newSticker: PlacedSticker = {
          id: newId,
          url: freshSticker.url,
          prompt: freshSticker.prompt,
          x: printerX,
          y: printerY,
          rotation: Math.random() * 10 - 5, // Slight random rotation
          scale: 1
      };

      // 1. Add to state
      setPlacedStickers(prev => [...prev, newSticker]);
      setFreshSticker(null);
      
      // 2. IMMEDIATELY start dragging with calculated coordinates
      setDragItem({
          type: 'placed',
          id: newId,
          startX: clientX,
          startY: clientY,
          initialItemX: printerX, 
          initialItemY: printerY
      });
  };

  return (
    <div 
        className="min-h-screen bg-slate-50 text-slate-800 overflow-hidden fixed inset-0 flex flex-col"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
    >
      {/* Desk Pattern Background */}
      <div className="absolute inset-0 desk-pattern pointer-events-none z-0"></div>

      {/* Canvas Area (The Desk) */}
      <div ref={canvasRef} className="relative flex-grow z-0 w-full h-full">
          
          {/* Placed Stickers */}
          {placedStickers.map(sticker => (
              <div
                key={sticker.id}
                className="absolute cursor-grab active:cursor-grabbing group before:absolute before:-inset-12 before:content-[''] before:z-[-1]"
                style={{
                    left: sticker.x,
                    top: sticker.y,
                    transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                    zIndex: dragItem?.id === sticker.id ? 100 : 10, 
                    touchAction: 'none',
                    width: '256px', // w-64 (256px)
                    height: '256px'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'placed', sticker.id)}
                onTouchStart={(e) => handleMouseDown(e, 'placed', sticker.id)}
              >
                 <img 
                    src={sticker.url} 
                    alt="sticker" 
                    className="w-full h-full object-contain pointer-events-none select-none transition-transform active:scale-105"
                    style={{ 
                        // Drop shadow creates the "thick paper" illusion for the die-cut sticker
                        filter: 'drop-shadow(2px 4px 5px rgba(0,0,0,0.25))'
                    }}
                    draggable={false} 
                 />
                 
                 {/* Delete & Download Buttons (Top Center) */}
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                    <button 
                      className="bg-white text-slate-400 w-7 h-7 rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-transform"
                      title="Delete Sticker"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                          e.stopPropagation();
                          deleteSticker(sticker.id);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button 
                      className="bg-white text-slate-600 w-7 h-7 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:scale-110 transition-transform"
                      title="Download Sticker"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                          e.stopPropagation();
                          downloadSticker(sticker.url, sticker.prompt);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9v6m0 0 3-3m-3 3-3-3" />
                      </svg>
                    </button>
                 </div>

                 {/* Zoom Controls (Visible on Hover - Bottom Center) */}
                 <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                    <button
                        type="button"
                        className="bg-white text-slate-500 w-7 h-7 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 hover:text-slate-700 hover:scale-110 transition-transform"
                        title="Zoom Out"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            adjustStickerScale(sticker.id, -0.15);
                        }}
                    >
                        <span className="text-base leading-none">−</span>
                    </button>
                    <button
                        type="button"
                        className="bg-white text-slate-500 w-7 h-7 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 hover:text-slate-700 hover:scale-110 transition-transform"
                        title="View Larger"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setZoomedSticker(sticker);
                        }}
                    >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="6" />
                          <line x1="16" y1="16" x2="21" y2="21" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="bg-white text-slate-500 w-7 h-7 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 hover:text-slate-700 hover:scale-110 transition-transform"
                        title="Zoom In"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            adjustStickerScale(sticker.id, 0.15);
                        }}
                    >
                        <span className="text-base leading-none">+</span>
                    </button>
                 </div>
              </div>
          ))}

          {/* Instructions (if empty) */}
          {placedStickers.length === 0 && !freshSticker && !loading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 mt-64">
                  <h2 className="text-5xl font-black text-slate-400 -rotate-6 tracking-widest text-center">
                    YOUR DESK<br/>IS EMPTY
                  </h2>
              </div>
          )}
      </div>

      {/* Printer Station (Fixed UI Layer) */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none flex justify-center z-50 pt-4">
        <div className="w-full px-4">
            <Printer 
                loading={loading} 
                freshSticker={freshSticker}
                onStartDragFresh={startDragFresh}
                onDownloadFresh={() => freshSticker && downloadSticker(freshSticker.url, freshSticker.prompt)}
            >
                <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                    {/* Row 1: Text Input (Full Width) */}
                    <div className="w-full">
                         <Input
                            type="text"
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                setGenerationCount(0);
                                setConceptHistory([]);
                            }}
                            placeholder="WHAT DO YOU WANT TO PRINT?"
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    
                    {/* Row 1.5: Model Switcher & Mode Switcher */}
                    <div className="flex gap-3 w-full">
                        {/* Model Select */}
                        <div className="flex-1 min-w-0">
                            <Select
                                value={selectedModel}
                                onValueChange={setSelectedModel}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-7 text-xs text-slate-500">
                                    <SelectValue placeholder="Model" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                     <SelectItem value={IMAGE_MODELS.FLASH} className="text-xs">Flash (Faster)</SelectItem>
                                     <SelectItem value={IMAGE_MODELS.PRO_PREVIEW} className="text-xs">Pro (Better Quality)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Mode Select (Single vs Batch) */}
                         <div className="flex-1 min-w-0">
                            <Select
                                value={isBatchMode ? 'batch' : 'single'}
                                onValueChange={(v) => setIsBatchMode(v === 'batch')}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-7 text-xs text-slate-500">
                                    <SelectValue placeholder="Mode" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                     <SelectItem value="single" className="text-xs">Single Sticker</SelectItem>
                                     <SelectItem value="batch" className="text-xs">Batch Sheet (9x)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 2: Style Select & Print Button */}
                    <div className="flex gap-3 w-full">
                        <div className="flex-1 min-w-0">
                            <Select
                                value={selectedStyle}
                                onValueChange={setSelectedStyle}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Style" />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-[300px]">
                                    {STYLES.map((style) => (
                                        <SelectItem key={style} value={style} className="uppercase font-bold text-xs">
                                            {style.replace(/ style| illustration| sticker/gi, '')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !prompt}
                            className="flex-1 min-w-0 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-widest rounded transition-all border-none active:opacity-90"
                        >
                            {loading ? '...' : 'PRINT'}
                        </Button>
                    </div>
                </form>
                {error && <div className="text-xs text-red-500 mt-2 font-bold text-center tracking-wide">{error}</div>}
            </Printer>
        </div>
      </div>
      
      {/* Footer/Credits */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-400 font-mono pointer-events-none opacity-60">
        POWERED BY GEMINI • DRAG TO ARRANGE • HOVER TO DOWNLOAD
      </div>

      {/* Download All Button */}
      {placedStickers.length > 0 && (
          <button 
              onClick={handleDownloadAll}
              disabled={isZipping}
              className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2 z-50 disabled:bg-slate-400"
          >
              {isZipping ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ZIPPING...
                  </>
              ) : (
                  <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9v6m0 0 3-3m-3 3-3-3" />
                      </svg>
                      DOWNLOAD ALL ({placedStickers.length})
                  </>
              )}
          </button>
      )}

      {/* Fullscreen Zoom Overlay */}
      {zoomedSticker && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]"
          onClick={() => setZoomedSticker(null)}
        >
          <div
            className="relative max-w-[80vw] max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedSticker.url}
              alt={zoomedSticker.prompt || 'Sticker preview'}
              className="max-w-full max-h-[80vh] object-contain rounded-xl bg-white shadow-2xl"
            />
            <button
              type="button"
              className="absolute -top-3 -right-3 bg-white text-slate-600 w-8 h-8 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 hover:scale-110 transition-transform"
              onClick={() => setZoomedSticker(null)}
              title="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
