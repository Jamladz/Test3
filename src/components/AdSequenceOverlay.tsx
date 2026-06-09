import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video } from 'lucide-react';
import { audioManager } from '../lib/audio';
import { useGameStore } from '../store/useGameStore';

export const AD_BLOCKS = ['int-30809', 'int-34646', 'int-43647'];

let activeSequenceCompleteCallback: (() => void) | null = null;
let activeSequenceErrorCallback: (() => void) | null = null;

// Global event target for ads
export const adEvents = new EventTarget();

export function startAdSequence(onComplete: () => void, onError?: () => void) {
  activeSequenceCompleteCallback = onComplete;
  activeSequenceErrorCallback = onError || null;
  adEvents.dispatchEvent(new Event('startSequence'));
}

export function AdSequenceOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const handleStart = async () => {
      setIsActive(true);
      setCurrentAdIndex(0);
      
      const AdControllerObj = (window as any).Adsgram;
      let successCount = 0;

      if (!AdControllerObj) {
        console.warn("Adsgram not found, simulating ad sequence.");
        for (let i = 0; i < 3; i++) {
          setCurrentAdIndex(i);
          await new Promise(r => setTimeout(r, 1200));
          useGameStore.getState().incrementAdsWatched();
          successCount++;
        }
      } else {
        for (let i = 0; i < 3; i++) {
          setCurrentAdIndex(i);
          try {
            const controller = AdControllerObj.init({ blockId: AD_BLOCKS[i] });
            // Wait for a tiny bit between ads to allow UI to update
            await new Promise(r => setTimeout(r, 500));
            await controller.show();
            useGameStore.getState().incrementAdsWatched();
            successCount++;
          } catch (e) {
            console.warn("Ad skipped or failed.", e);
            break; // Stop sequence if they close it
          }
        }
      }

      setIsActive(false);

      if (successCount === 3) {
        audioManager.playCoinSound();
        if (activeSequenceCompleteCallback) activeSequenceCompleteCallback();
      } else {
        if (activeSequenceErrorCallback) activeSequenceErrorCallback();
      }

      activeSequenceCompleteCallback = null;
      activeSequenceErrorCallback = null;
    };

    adEvents.addEventListener('startSequence', handleStart);
    return () => {
      adEvents.removeEventListener('startSequence', handleStart);
    };
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-[#00f3ff]/20 rounded-full blur-xl animate-pulse" />
            <div className="w-full h-full bg-[#1c1c1e] rounded-full border border-[#00f3ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.2)]">
               <Video size={40} className="text-[#00f3ff] animate-pulse" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Watching Ads</h2>
          <p className="text-[#00f3ff] font-bold mb-8 uppercase tracking-widest text-sm">
            Please wait... {currentAdIndex + 1} / 3
          </p>

          <div className="flex gap-3 mb-8">
             {[0, 1, 2].map(i => (
                <div 
                   key={i} 
                   className={`h-2 rounded-full transition-all duration-500 ${
                      i < currentAdIndex ? 'w-12 bg-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.8)]' :
                      i === currentAdIndex ? 'w-12 bg-[#00f3ff]/50 animate-pulse' :
                      'w-6 bg-white/10'
                   }`}
                />
             ))}
          </div>

          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl max-w-sm">
            <p className="text-sm font-bold uppercase tracking-wider">Do not close!</p>
            <p className="text-xs opacity-80 mt-1">Reward is only granted after all 3 ads are fully watched.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
