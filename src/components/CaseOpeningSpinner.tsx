import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startAdSequence } from './AdSequenceOverlay';

// Spinner Items
const PRIZES = [
  { type: 'coin', value: 10000, img: 'https://i.suar.me/qv4lV/l' },
  { type: 'coin', value: 25000, img: 'https://i.suar.me/qv4lV/l' },
  { type: 'coin', value: 50000, img: 'https://i.suar.me/qv4lV/l' },
  { type: 'coin', value: 100000, img: 'https://i.suar.me/qv4lV/l' },
];

const FILLER_IMAGES = [
  'https://i.suar.me/Lpxpo/l', // Plush Pepe
  'https://i.suar.me/2zGz9/l', // Scared Cat
  'https://i.suar.me/a9M9l/l', // Heart Locket
  'https://i.suar.me/zX418/l', // Low Rider
  'https://i.suar.me/Jprpg/l', // Jooly Chimp
  'https://i.suar.me/YQ3Q7/l', // Voodoo Doll
  'https://i.suar.me/MpLp9/l', // Toy Bear
  'https://i.suar.me/9zPzB/l', // Snoop Cigar
  'https://i.suar.me/V9d9g/l', // Lonic Dryer
  'https://i.suar.me/wzAz6/l', // Signet Ring
];

interface CaseOpeningSpinnerProps {
  onClose: () => void;
}

export function CaseOpeningSpinner({ onClose }: CaseOpeningSpinnerProps) {
  const { spinsLeft, useSpin, addBalance, incrementAdsWatched, checkSpinReset } = useGameStore();
  
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>("");
  
  const ITEM_WIDTH = 100;
  
  useEffect(() => {
    checkSpinReset();
    generateItems();
  }, []);

  useEffect(() => {
    if (spinsLeft > 0) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) {
        checkSpinReset();
        return;
      }
      
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [spinsLeft, checkSpinReset]);

  const generateItems = () => {
    const newItems = [];
    // Generate random items, ensuring no consecutive large coins if possible, but mainly random
    for (let i = 0; i < 60; i++) {
        const isCoin = Math.random() > 0.6; // We'll show coins sometimes
        if (isCoin) {
            newItems.push({ id: i, ...PRIZES[Math.floor(Math.random() * PRIZES.length)] });
        } else {
            newItems.push({ id: i, type: 'filler', img: FILLER_IMAGES[Math.floor(Math.random() * FILLER_IMAGES.length)] });
        }
    }
    setItems(newItems);
  };

  const handleSpin = () => {
    if (spinsLeft <= 0 || spinning) return;
    
    startAdSequence(
      'int-34646',
      () => {
        executeSpin();
      },
      () => {
        console.log("Ad incomplete or failed.");
      }
    );
  };

  const executeSpin = () => {
    setSpinning(true);
    setReward(null);
    useSpin();

    // Prepare items with a guaranteed coin win at the target index
    const targetIndex = 40; // Stop around item 40
    const winningPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    
    const configuredItems = [...items];
    configuredItems[targetIndex] = { id: targetIndex, ...winningPrize };
    setItems(configuredItems);

    // Calculate offset to center the winning item
    const pixels = targetIndex * ITEM_WIDTH;
    const randomizeOffset = Math.floor(Math.random() * (ITEM_WIDTH - 20)) - (ITEM_WIDTH - 20) / 2; 
    const centerOffset = 0; // Container width / 2 - Item width / 2. CSS is flex so we use css vars or offset logic.
    // wait, if we translate the container, we want the targetIndex item to be in the middle of a 300px container.
    // Middle is 150. targetIndex left edge is targetIndex * 100.
    // To center it: transform = -(targetIndex * 100) + 150 - 50 (half item) = -(targetIndex * 100) + 100.
    const finalOffset = - (targetIndex * ITEM_WIDTH) + 100 + randomizeOffset;
    
    setOffset(0); // Reset
    setTimeout(() => {
        setOffset(finalOffset);
    }, 50);

    setTimeout(() => {
      setSpinning(false);
      setReward(winningPrize.value);
      addBalance(winningPrize.value);
    }, 6050); // After transition time (6s)
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 max-w-[340px] w-full shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white z-10"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center mt-2">Case Opening</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">Spins left today: <span className="text-[#FFD700] font-bold">{spinsLeft}</span> / 3</p>
        
        <div className="relative w-[300px] h-32 mx-auto bg-black border border-white/10 rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          {/* Middle Pointer */}
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.8)] z-10 -ml-[2px]" />
          <div className="absolute -top-1 left-1/2 -ml-2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#FFD700] z-20" />
          <div className="absolute -bottom-1 left-1/2 -ml-2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#FFD700] z-20" />
          
          <div 
            ref={containerRef}
            className="flex h-full items-center"
            style={{ 
              transform: `translateX(${offset}px)`,
              transition: spinning ? 'transform 6s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none'
            }}
          >
            {items.map((item, index) => (
              <div 
                key={`${item.id}-${index}`}
                className="w-[100px] h-28 shrink-0 flex flex-col items-center justify-center border-x border-white/5 bg-[#1a1a1c]"
                style={{ width: ITEM_WIDTH }}
              >
                <div className="w-16 h-16 flex items-center justify-center border border-white/5 bg-black/40 rounded-lg overflow-hidden mb-1 relative shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                  <img src={item.img} alt="item" className={`w-full h-full object-cover scale-110 ${item.type === 'coin' ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`} />
                </div>
                {item.type === 'coin' && (
                  <span className="text-xs font-bold text-[#FFD700] absolute bottom-1">+{item.value.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
            {reward && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center flex-col p-6 rounded-3xl"
                >
                    <h3 className="text-2xl font-bold text-white mb-2">You Won!</h3>
                    <div className="text-4xl font-black text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] mb-6 flex items-center gap-2">
                        +{reward.toLocaleString()} <img src="https://i.suar.me/qv4lV/l" alt="Coin" className="w-8 h-8 object-contain" />
                    </div>
                    <button 
                        onClick={() => {
                            setReward(null);
                            generateItems();
                            setOffset(0);
                        }}
                        className="w-full py-4 rounded-xl bg-[#FFD700] text-black font-bold text-lg hover:bg-yellow-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                    >
                        Awesome!
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
        
        <button 
          onClick={handleSpin}
          disabled={spinning || spinsLeft <= 0}
          className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-black font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-col h-[72px]"
        >
          {spinsLeft <= 0 ? (
            <>
              <span className="text-sm">Available in</span>
              <span className="font-mono text-xl">{timeLeft}</span>
            </>
          ) : (
             <div className="flex items-center gap-2">
                <Play size={20} fill="currentColor" />
                Spin & Watch Ad
             </div>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
