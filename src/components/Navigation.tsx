import React from 'react';
import { motion } from 'motion/react';
import { Pickaxe, Users, CheckSquare, Zap, Activity, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isAdmin?: boolean;
}

export function Navigation({ currentTab, setTab, isAdmin }: NavigationProps) {
  const tabs = [
    { id: 'game', label: 'Exchange', icon: Zap },
    { id: 'mine', label: 'Mine', icon: Pickaxe },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'tasks', label: 'Earn', icon: CheckSquare },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: ShieldAlert });
  }

  return (
    <div className="shrink-0 w-full glass-panel rounded-t-3xl pb-safe pt-2 px-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 bg-[#121212]/80 mt-auto">
      <div className="flex justify-between items-center w-full max-w-md mx-auto mb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 flex-1 rounded-2xl transition-all duration-300 relative",
                isActive ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-gradient-to-b from-[#9d00ff]/20 to-transparent rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <div className={cn("mb-1 transition-transform duration-300", isActive && "-translate-y-1")}>
                <Icon size={26} className={cn(isActive && "drop-shadow-[0_0_12px_rgba(0,243,255,0.8)] text-[#00f3ff]")} />
              </div>
              <span className={cn("text-[10px] font-bold tracking-wider transition-all duration-300", isActive && "text-[#00f3ff]")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
