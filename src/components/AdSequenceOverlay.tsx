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
        await new Promise(r => setTimeout(r, 1200));
        useGameStore.getState().incrementAdsWatched();
        useGameStore.getState().incrementAdsWatched();
        useGameStore.getState().incrementAdsWatched();
        successCount = 3;
      } else {
        try {
          const promises = AD_BLOCKS.map((blockId, index) => {
            return new Promise<void>(async (resolve) => {
                try {
                   const controller = AdControllerObj.init({ blockId });
                   await controller.show();
                   useGameStore.getState().incrementAdsWatched();
                   successCount++;
                   resolve();
                } catch (e) {
                   console.warn("Ad skipped or failed.", e);
                   resolve();
                }
            });
          });
          
          await Promise.all(promises);
        } catch (e) {
          console.warn("Ad sequence failed", e);
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

  return null;
}
