import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video } from 'lucide-react';
import { audioManager } from '../lib/audio';
import { useGameStore } from '../store/useGameStore';

let activeSequenceCompleteCallback: (() => void) | null = null;
let activeSequenceErrorCallback: (() => void) | null = null;
let activeSequenceBlockId: string = 'int-30809';

// Global event target for ads
export const adEvents = new EventTarget();

export function startAdSequence(blockId: string, onComplete: () => void, onError?: () => void) {
  activeSequenceBlockId = blockId;
  activeSequenceCompleteCallback = onComplete;
  activeSequenceErrorCallback = onError || null;
  adEvents.dispatchEvent(new Event('startSequence'));
}

export function AdSequenceOverlay() {
  useEffect(() => {
    const handleStart = async () => {
      const AdControllerObj = (window as any).Adsgram;
      let successCount = 0;

      if (!AdControllerObj) {
        console.warn("Adsgram not found, simulating single ad.");
        await new Promise(r => setTimeout(r, 1200));
        useGameStore.getState().incrementAdsWatched();
        successCount = 1;
      } else {
        try {
           const controller = AdControllerObj.init({ blockId: activeSequenceBlockId });
           await controller.show();
           useGameStore.getState().incrementAdsWatched();
           successCount = 1;
        } catch (e) {
           console.warn(`Ad skipped or failed for ${activeSequenceBlockId}.`, e);
        }
      }

      if (successCount === 1) {
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
