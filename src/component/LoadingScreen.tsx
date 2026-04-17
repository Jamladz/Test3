import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Diamond, Megaphone, Rocket, Users, BadgeDollarSign, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const duration = 7000; // 7 seconds total
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          onComplete();
        }, 300); // slight delay after 100% before firing onComplete
      }
    }, intervalTime);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array prevents timer reset on parent re-renders

  // Floating variants for the icons
  const floatingVariants = {
    animate: (i: number) => ({
      y: [0, -15, 0],
      x: [0, i % 2 === 0 ? 10 : -10, 0],
      rotate: [0, i % 2 === 0 ? 5 : -5, 0],
      transition: {
        duration: 3 + i * 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      }
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 overflow-hidden"
    >
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Icons Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Top Left - Earn TON */}
        <motion.div custom={1} variants={floatingVariants} animate="animate" className="absolute top-1/4 left-[15%] opacity-40">
          <Diamond className="w-12 h-12 text-blue-400" />
        </motion.div>
        
        {/* Top Right - Target/Views */}
        <motion.div custom={2} variants={floatingVariants} animate="animate" className="absolute top-1/4 right-[15%] opacity-40">
          <Target className="w-10 h-10 text-emerald-400" />
        </motion.div>

        {/* Bottom Left - Promote/Megaphone */}
        <motion.div custom={3} variants={floatingVariants} animate="animate" className="absolute bottom-1/3 left-[20%] opacity-40">
          <Megaphone className="w-14 h-14 text-purple-400" />
        </motion.div>

        {/* Bottom Right - Telegram Mini App Vibe */}
        <motion.div custom={4} variants={floatingVariants} animate="animate" className="absolute bottom-1/4 right-[20%] opacity-40">
          <Rocket className="w-12 h-12 text-indigo-400" />
        </motion.div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl shadow-2xl flex items-center justify-center rotate-3 relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20 backdrop-blur-sm shadow-inner rounded-3xl"></div>
             <img src="https://i.suar.me/6zQ9x/l" alt="TON" className="w-12 h-12 relative z-10 object-contain drop-shadow-md" referrerPolicy="no-referrer" />
          </div>
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
             className="absolute -inset-2 border-2 border-dashed border-purple-500/30 rounded-3xl -z-10"
          />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 tracking-tight"
        >
          Ads Network
        </motion.h1>
        
        <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.4, duration: 0.5 }}
           className="mt-4 flex flex-col gap-2 font-medium text-slate-300 text-sm"
        >
          <div className="flex items-center gap-2 justify-center">
            <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
            <span>Earn TON by completing tasks</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Megaphone className="w-4 h-4 text-purple-400" />
            <span>Promote your channels & apps</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Reach active Telegram community</span>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.6 }}
         className="absolute bottom-16 w-64 max-w-[80%] flex flex-col items-center gap-3 z-10"
      >
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 backdrop-blur-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
          Loading Mini App... {Math.round(progress)}%
        </div>
      </motion.div>

    </motion.div>
  );
};
