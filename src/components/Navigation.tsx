import React from 'react';
import { Pickaxe, CheckSquare, Users, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export function Navigation({ currentTab, setTab }: NavigationProps) {
  const tabs = [
    { id: 'home', label: 'Mine', icon: Pickaxe },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'friends', label: 'Referrals', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto z-50">
      <div className="bg-[#111] border-t border-gray-800/80 rounded-t-3xl px-6 py-3 pb-7 flex justify-between items-center relative overflow-hidden backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className="relative flex flex-col items-center justify-center w-16 h-14"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-2xl -z-10 border border-emerald-500/30"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
              <div className={cn("mb-1 transition-transform duration-300", isActive && "-translate-y-1")}>
                <Icon size={22} className={cn(isActive ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "text-gray-500")} />
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-wider transition-all duration-300", isActive ? "text-emerald-400" : "text-gray-500")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
