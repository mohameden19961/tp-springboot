'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Coffee, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Pomodoro({ onClose }: { onClose: () => void }) {
  const POMODORO_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'POMODORO' | 'BREAK'>('POMODORO');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
            setIsRunning(false);
            if (mode === 'POMODORO') {
              setMode('BREAK');
              return BREAK_TIME;
            } else {
              setMode('POMODORO');
              return POMODORO_TIME;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'POMODORO' ? POMODORO_TIME : BREAK_TIME);
  };

  const switchMode = (m: 'POMODORO' | 'BREAK') => {
    setMode(m);
    setIsRunning(false);
    setTimeLeft(m === 'POMODORO' ? POMODORO_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = mode === 'POMODORO' ? ((POMODORO_TIME - timeLeft) / POMODORO_TIME) * 100 : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-6 right-6 w-80 glass-card bg-zinc-950/90 border-2 border-indigo-500/20 rounded-[2rem] shadow-2xl overflow-hidden z-[100]"
    >
      <div className="h-1.5 w-full bg-zinc-900 absolute top-0 left-0">
         <div className={`h-full transition-all duration-1000 ease-linear ${mode === 'POMODORO' ? 'bg-indigo-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }}></div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-white px-2 uppercase tracking-widest text-xs flex items-center gap-2">
            {mode === 'POMODORO' ? <><Brain size={14} className="text-indigo-400" /> Focus</> : <><Coffee size={14} className="text-emerald-400" /> Pause</>}
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className={`text-6xl font-black tracking-tighter tabular-nums ${mode === 'POMODORO' ? 'text-indigo-400' : 'text-emerald-400'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button 
            onClick={resetTimer} 
            className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5"
          >
            <RotateCcw size={16} />
          </button>
          
          <button 
            onClick={toggleTimer} 
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${mode === 'POMODORO' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'}`}
          >
            {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
          </button>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl">
          <button 
            onClick={() => switchMode('POMODORO')} 
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'POMODORO' ? 'bg-indigo-500/20 text-indigo-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Session
          </button>
          <button 
            onClick={() => switchMode('BREAK')} 
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'BREAK' ? 'bg-emerald-500/20 text-emerald-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Pause
          </button>
        </div>
      </div>
    </motion.div>
  );
}
