import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, AlertTriangle, Play, RefreshCcw, Undo2, Shuffle, Clapperboard, Loader2 } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { useTranslation } from 'react-i18next';

// 18 images from user request
const IMAGES = [
  "https://i.suar.me/a9Z1z/l", "https://i.suar.me/lZWm5/l", "https://i.suar.me/OpLEa/l",
  "https://i.suar.me/NpQKa/l", "https://i.suar.me/e9WPd/l", "https://i.suar.me/qv7m1/l",
  "https://i.suar.me/lZWm9/l", "https://i.suar.me/1z8eY/l", "https://i.suar.me/a9ZKZ/l",
  "https://i.suar.me/2z8N3/l", "https://i.suar.me/jvWmz/l", "https://i.suar.me/LpQKG/l",
  "https://i.suar.me/8z5rL/l", "https://i.suar.me/OpLE8/l", "https://i.suar.me/e9WP0/l",
  "https://i.suar.me/qv7mJ/l", "https://i.suar.me/NpQKZ/l", "https://i.suar.me/1z8r3/l"
];

const TILE_SIZE = 46; 
const BOARD_SIZE = 300; 
const TRAY_CAPACITY = 6;

interface TileData {
  id: string;
  imgIndex: number;
  x: number;
  y: number;
  z: number;
  active: boolean; 
}

export const AppMiniGame = ({ onClose, onEarn }: { onClose: () => void, onEarn: (xp: number) => void }) => {
  const { t } = useTranslation();
  
  const [board, setBoard] = useState<TileData[]>([]);
  const [tray, setTray] = useState<TileData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null);
  const [synced, setSynced] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  // Powerups State - 2 per game
  const [shufflesLeft, setShufflesLeft] = useState(2);
  const [undosLeft, setUndosLeft] = useState(2);

  // --- Board Generation ---
  const generateBoard = () => {
    const tiles: TileData[] = [];
    
    const imagePool: number[] = [];
    for (let i = 0; i < 18; i++) {
        for (let j = 0; j < 6; j++) {
            imagePool.push(i); 
        }
    }
    for (let i = imagePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [imagePool[i], imagePool[j]] = [imagePool[j], imagePool[i]];
    }

    let poolIndex = 0;
    const addGrid = (cols: number, rows: number, z: number, staggerX: boolean = false, staggerY: boolean = false) => {
        const gridW = cols * TILE_SIZE;
        const gridH = rows * TILE_SIZE;
        const offsetX = (BOARD_SIZE - gridW) / 2;
        const offsetY = (BOARD_SIZE - gridH) / 2;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (poolIndex >= imagePool.length) break;
                const px = offsetX + c * TILE_SIZE + (staggerX ? TILE_SIZE/2 : 0) + (Math.random()*4 - 2); 
                const py = offsetY + r * TILE_SIZE + (staggerY ? TILE_SIZE/2 : 0) + (Math.random()*4 - 2);
                
                tiles.push({
                    id: `t_${z}_${r}_${c}_${Math.random()}`,
                    imgIndex: imagePool[poolIndex],
                    x: px,
                    y: py,
                    z,
                    active: true
                });
                poolIndex++;
            }
        }
    };

    addGrid(6, 6, 0);                 
    addGrid(5, 5, 1, true, true);     
    addGrid(6, 5, 2, false, true);    
    addGrid(4, 4, 3, true, true);     
    addGrid(1, 1, 4, true, true);     

    setBoard(tiles);
    setTray([]);
    setGameOver(null);
    setSynced(false);
    setIsMatching(false);
    setShufflesLeft(2);
    setUndosLeft(2);
    setIsPlaying(true);
  };

  const isTileCovered = (tile: TileData, currentBoard: TileData[]) => {
      const hitbox = TILE_SIZE * 0.8; 
      const activeTiles = currentBoard.filter(t => t.active);
      return activeTiles.some(other => {
          if (other.id === tile.id || other.z <= tile.z) return false;
          const dx = Math.abs(tile.x - other.x);
          const dy = Math.abs(tile.y - other.y);
          return dx < hitbox && dy < hitbox;
      });
  };

  const handleTileClick = (clickedTile: TileData) => {
      if (!isPlaying || gameOver || isMatching || isAdLoading) return;
      if (tray.length >= TRAY_CAPACITY) return; 
      if (isTileCovered(clickedTile, board)) return;

      try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}

      const newBoard = board.map(t => t.id === clickedTile.id ? { ...t, active: false } : t);
      
      let newTray = [...tray];
      let insertIndex = -1;
      for (let i = newTray.length - 1; i >= 0; i--) {
          if (newTray[i].imgIndex === clickedTile.imgIndex) {
              insertIndex = i;
              break;
          }
      }
      
      if (insertIndex !== -1) {
          newTray.splice(insertIndex + 1, 0, clickedTile);
      } else {
          newTray.push(clickedTile);
      }

      setBoard(newBoard);
      setTray(newTray);
  };

  useEffect(() => {
     if (!isPlaying || gameOver) return;

     const counts = new Map<number, number>();
     tray.forEach(t => counts.set(t.imgIndex, (counts.get(t.imgIndex) || 0) + 1));
     
     let matchIndex = -1;
     counts.forEach((val, key) => {
         if (val >= 3) matchIndex = key;
     });

     if (matchIndex !== -1) {
         setIsMatching(true); 
         try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}

         const timer = setTimeout(() => {
             setTray(prev => prev.filter(t => t.imgIndex !== matchIndex));
             setIsMatching(false);
         }, 300); // reduced delay slightly for smoother feel
         return () => clearTimeout(timer);
     } else if (tray.length === TRAY_CAPACITY && !isMatching) {
         try { WebApp.HapticFeedback.notificationOccurred('error'); } catch(e){}
         setGameOver('lose');
     }
  }, [tray, isPlaying, gameOver, isMatching]);

  useEffect(() => {
      if (!isPlaying || gameOver) return;
      const activeTiles = board.filter(t => t.active);
      if (activeTiles.length === 0 && tray.length === 0) {
          try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
          setGameOver('win');
      }
  }, [board, tray, isPlaying, gameOver]);

  // --- Ad Integration for Powerups ---
  const runWithAd = async (action: () => void) => {
      const Adsgram = (window as any).Adsgram;
      if (Adsgram) {
          setIsAdLoading(true);
          try {
              const AdController = Adsgram.init({ blockId: "int-28175" });
              await AdController.show();
              setIsAdLoading(false);
              action();
          } catch (e) {
              console.warn("Ad skipped or failed:", e?.message || String(e));
              setIsAdLoading(false);
              WebApp.showAlert(t('adError') || "Ad failed. Please try again.");
          }
      } else {
          // Check if in telegram, show loading message if script not ready
          if (WebApp.platform !== 'unknown') {
              WebApp.showAlert(t('adNotReady') || "Ad system is initializing...");
          } else {
              // Simulated success for preview/web testing
              action();
          }
      }
  };

  // --- Powerups Action Logic ---
  const executeShuffle = () => {
    setShufflesLeft(p => p - 1);
    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
    
    const activeTiles = board.filter(t => t.active);
    const positions = activeTiles.map(t => ({x: t.x, y: t.y, z: t.z}));
    
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    let posIdx = 0;
    setBoard(board.map(t => t.active ? { ...t, x: positions[posIdx].x, y: positions[posIdx].y, z: positions[posIdx++].z } : t));
  };

  const executeUndo = () => {
    setUndosLeft(p => p - 1);
    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}

    const newTray = [...tray];
    const numToRemove = Math.min(2, newTray.length);
    const removedTiles = newTray.splice(-numToRemove, numToRemove);
    const removedIds = removedTiles.map(t => t.id);
    
    setBoard(board.map(t => removedIds.includes(t.id) ? { ...t, active: true } : t));
    setTray(newTray);
  };

  // Button Handlers
  const handleShuffleBtn = () => {
    if (shufflesLeft <= 0 || !isPlaying || gameOver || isMatching || isAdLoading) return;
    runWithAd(executeShuffle);
  };

  const handleUndoBtn = () => {
    if (undosLeft <= 0 || !isPlaying || gameOver || tray.length === 0 || isMatching || isAdLoading) return;
    runWithAd(executeUndo);
  };

  const handleSync = () => {
     if (gameOver === 'win' && !synced) {
        onEarn(100); 
        setSynced(true);
     }
  };

  return (
    <motion.div 
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       exit={{ opacity: 0, scale: 0.95 }}
       className="fixed inset-0 z-[100] bg-slate-900 flex flex-col w-full max-w-[100vw] overflow-x-hidden"
    >
      <div className="flex justify-between items-center px-4 py-3 bg-slate-800 shadow-xl z-50 rounded-b-2xl">
         <h2 className="text-lg font-bold text-white flex items-center">
            <Trophy className="w-5 h-5 text-indigo-400 mr-2" />
            Tile Match
         </h2>
         <div className="text-xs font-black text-teal-400 bg-teal-900/50 px-3 py-1.5 rounded-full border border-teal-700/50 shadow-inner tracking-widest uppercase">
             Win: 100 XP
         </div>
         <button onClick={onClose} className="p-2 bg-slate-700/50 rounded-full text-slate-300 hover:bg-slate-600 transition-colors">
            <X className="w-5 h-5" />
         </button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 flex flex-col pt-6 pb-2">
          
         {!isPlaying && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-50 bg-slate-900/80 backdrop-blur-md">
               <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(79,70,229,0.5)] border-4 border-slate-800 rotate-6 hover:rotate-12 transition-transform">
                   <img src={IMAGES[0]} alt="Tile" className="w-[85%] h-[85%] rounded-xl object-cover shadow-inner pointer-events-none" />
               </div>
               <h3 className="text-3xl font-black text-white mb-2">Tile Match</h3>
               <p className="text-slate-300 font-medium text-sm mb-8 max-w-xs leading-relaxed">
                  Clear the board by matching 3 identical tiles downward. Don't let your tray fill up!
               </p>
               <button onClick={generateBoard} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black py-4 px-12 rounded-2xl border-b-[4px] border-purple-800 shadow-[0_10px_20px_rgba(124,58,237,0.4)] active:border-b-0 active:translate-y-[4px] transition-all text-lg flex items-center">
                  <Play className="w-6 h-6 mr-2 fill-white" /> PLAY NOW
               </button>
            </div>
         )}

         {/* Board Area */}
         <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[320px]">
             {isPlaying && (
                <div className="relative" style={{ width: BOARD_SIZE, height: BOARD_SIZE }}>
                     <AnimatePresence>
                         {board.map(tile => {
                             if (!tile.active) return null;
                             const covered = isTileCovered(tile, board);
                             return (
                                 <motion.div 
                                     layoutId={`tile-${tile.id}`}
                                     layout 
                                     key={tile.id}
                                     onClick={() => !covered && handleTileClick(tile)}
                                     initial={{ opacity: 0, scale: 0.5 }}
                                     animate={{ opacity: 1, scale: 1 }}
                                     exit={{ opacity: 0, scale: 0.5 }}
                                     transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                     className={`absolute overflow-hidden flex items-center justify-center border-t border-x border-b-[4px] shadow-xl transition-colors shrink-0
                                        ${covered ? 'bg-slate-600 border-slate-700/80 brightness-[0.4] rounded-lg' : 'bg-slate-700 border-slate-500 border-b-slate-900 brightness-100 rounded-xl cursor-pointer hover:border-indigo-400 z-50'}`}
                                     style={{ 
                                         left: tile.x, 
                                         top: tile.y, 
                                         width: TILE_SIZE, 
                                         height: TILE_SIZE + 4,
                                         zIndex: tile.z + (covered ? 0 : 50) 
                                     }}
                                 >
                                     <img src={IMAGES[tile.imgIndex]} alt="t" className={`w-[85%] h-[85%] object-cover pointer-events-none rounded-[6px] ${covered ? 'opacity-60' : 'opacity-100'}`} />
                                 </motion.div>
                             );
                         })}
                     </AnimatePresence>
                </div>
             )}
         </div>

         {/* Icon Only Powerups Toolbar */}
         <div className="flex justify-center items-center w-full max-w-[320px] mx-auto px-4 z-40 mb-3 mt-auto shrink-0 space-x-8">
             <button 
                onClick={handleUndoBtn} 
                disabled={undosLeft <= 0 || tray.length === 0 || isMatching || isAdLoading}
                className="relative flex items-center justify-center bg-gradient-to-t from-orange-600 to-orange-500 rounded-[18px] w-14 h-14 text-white shadow-[0_4px_0_#9a3412] active:translate-y-[4px] active:shadow-[0_0_0_#9a3412] disabled:opacity-40 disabled:grayscale transition-all"
             >
                 <Undo2 className="w-7 h-7 drop-shadow-md"/>
                 <div className="absolute -top-2 -right-2 bg-rose-500 rounded-full w-[24px] h-[24px] flex items-center justify-center text-[12px] font-black shadow-md border-[2.5px] border-slate-900 border-b-rose-700 z-10">
                     {undosLeft}
                 </div>
                 <div className="absolute -bottom-2 bg-slate-900 rounded-full p-1 border-[1.5px] border-slate-700 shadow-md">
                     <Clapperboard className="w-3.5 h-3.5 text-yellow-400"/>
                 </div>
             </button>

             <button 
                 onClick={handleShuffleBtn} 
                 disabled={shufflesLeft <= 0 || isMatching || isAdLoading}
                 className="relative flex items-center justify-center bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-[18px] w-14 h-14 text-white shadow-[0_4px_0_#3730a3] active:translate-y-[4px] active:shadow-[0_0_0_#3730a3] disabled:opacity-40 disabled:grayscale transition-all"
             >
                 <Shuffle className="w-7 h-7 drop-shadow-md"/>
                 <div className="absolute -top-2 -right-2 bg-rose-500 rounded-full w-[24px] h-[24px] flex items-center justify-center text-[12px] font-black shadow-md border-[2.5px] border-slate-900 border-b-rose-700 z-10">
                     {shufflesLeft}
                 </div>
                 <div className="absolute -bottom-2 bg-slate-900 rounded-full p-1 border-[1.5px] border-slate-700 shadow-md">
                     <Clapperboard className="w-3.5 h-3.5 text-yellow-400"/>
                 </div>
             </button>
         </div>

         {/* Tray Area */}
         <div className="h-[105px] shrink-0 bg-slate-800 rounded-t-[32px] shadow-[0_-15px_30px_rgba(0,0,0,0.4)] border-t-[3px] border-indigo-500/50 flex flex-col items-center justify-center relative z-40 pb-5">
              <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-[0.2em] absolute top-2.5">Matches</p>
              
              <div className="flex bg-slate-900 border-[3px] border-slate-700/80 rounded-[20px] p-1.5 space-x-1.5 justify-start relative shadow-inner mt-4 w-[95%] max-w-[350px] mx-auto h-[60px]">
                  {Array.from({length: TRAY_CAPACITY}).map((_, i) => (
                      <div key={'s'+i} className="flex-1 bg-slate-800/60 rounded-[10px] border-2 border-dashed border-slate-700/50 h-full"></div>
                  ))}

                  <div className="absolute top-1.5 left-1.5 bottom-1.5 right-1.5 flex space-x-1.5 pointer-events-none items-center">
                      <AnimatePresence>
                          {tray.map(tile => (
                              <motion.div 
                                  layoutId={`tile-${tile.id}`}
                                  layout 
                                  key={tile.id}
                                  initial={{ scale: 1 }}
                                  exit={{ scale: 1.1, opacity: 0, y: -40, filter: 'brightness(3)' }}
                                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                                  className="h-full bg-slate-700 border-t border-x border-slate-500 border-b-[4px] border-b-slate-900 rounded-xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center grow-0 shrink-0"
                                  style={{ width: `calc((100% - ${(TRAY_CAPACITY - 1) * 6}px) / ${TRAY_CAPACITY})` }} 
                              >
                                  <img src={IMAGES[tile.imgIndex]} alt="t" className="w-[82%] h-[82%] object-cover rounded-[6px]" />
                              </motion.div>
                          ))}
                      </AnimatePresence>
                  </div>
              </div>
         </div>

         {/* Ad Loading Overlay */}
         <AnimatePresence>
             {isAdLoading && (
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[150] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center"
                 >
                     <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                     <p className="text-white font-bold text-lg animate-pulse">Loading Ad...</p>
                 </motion.div>
             )}
         </AnimatePresence>

         {/* Game Over / Win Modal Backdrop */}
         <AnimatePresence>
         {gameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-[200] bg-slate-900/95 backdrop-blur-lg"
            >
               {gameOver === 'lose' ? (
                  <AlertTriangle className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
               ) : (
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping opacity-20 bg-yellow-400 rounded-full"></div>
                    <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] relative z-10" />
                  </div>
               )}
               
               <h3 className="text-4xl font-black text-white mb-4 uppercase tracking-wide">
                 {gameOver === 'lose' ? 'Slots Full!' : 'Victory!'}
               </h3>
               
               {gameOver === 'win' && (
                 <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="text-sm font-bold text-teal-400 mb-8 flex flex-col items-center justify-center">
                    <span className="bg-emerald-900/40 border border-emerald-500/50 px-6 py-4 rounded-2xl text-xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                       You earned <span className="text-white font-black drop-shadow-md mx-1">100 XP</span>
                    </span>
                 </motion.div>
               )}
               
               {gameOver === 'win' ? (
                  <button onClick={() => { handleSync(); onClose(); }} disabled={synced} className="w-full max-w-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 px-6 rounded-2xl border-b-[4px] border-teal-800 shadow-[0_8px_20px_rgba(20,184,166,0.4)] active:translate-y-[4px] active:border-b-0 disabled:opacity-50 flex justify-center mb-4 text-lg transition-all tracking-wide">
                     {synced ? 'XP Claimed! ✅' : 'CLAIM REWARD'}
                  </button>
               ) : null}

               <button onClick={generateBoard} className="w-full max-w-xs bg-slate-700 text-white font-extrabold py-4 px-6 rounded-2xl border-b-[4px] border-slate-900 active:translate-y-[4px] active:border-b-0 text-base flex items-center justify-center transition-all hover:bg-slate-600 shadow-lg">
                  <RefreshCcw className="w-6 h-6 mr-2" /> PLAY AGAIN
               </button>
            </motion.div>
         )}
         </AnimatePresence>

      </div>
    </motion.div>
  );
};
