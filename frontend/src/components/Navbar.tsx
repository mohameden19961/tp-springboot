'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Users, BookOpen, LogOut, User as UserIcon, Calendar, Timer, Sun, Moon, Bell } from 'lucide-react';
import Pomodoro from './Pomodoro';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout, login } = useAuth();
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('light-theme');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
          <BookOpen className="w-6 h-6 text-indigo-500 fill-indigo-500/20" />
          <span className="hidden sm:inline">SupNum <span className="text-indigo-500">Campus</span></span>
        </Link>

        {user ? (
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 md:gap-6">
              <NavLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Mon Campus" />
              <NavLink href="/timetable" icon={<Calendar size={18} />} label="Emploi du Temps" />
              {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                  <NavLink href="/students" icon={<Users size={18} />} label="Annuaire" />
              )}
            </div>

            <div className="flex items-center gap-3 md:gap-4 border-l border-white/10 pl-4 md:pl-6">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-black text-white tracking-tight leading-none mb-1">{user.name}</span>
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                        user.role === 'ADMIN' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                    }`}>
                        {user.role}
                    </span>
                </div>
                
                <div className="relative group/avatar">
                    <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-lg opacity-0 group-hover/avatar:opacity-30 transition-opacity" />
                    {user.picture ? (
                        <img 
                            src={user.picture} 
                            alt={user.name} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 relative z-10 hover:scale-105 transition-transform"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.querySelector('.avatar-fallback')?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                <div className={`avatar-fallback w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 relative z-10 border border-white/10 ${user.picture ? 'hidden' : ''}`}>
                    <UserIcon size={18} />
                </div>
            </div>


            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-white/5 hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 rounded-xl transition-all border border-transparent hover:border-indigo-500/20"
              title="Changer de thème"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-white/5 hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 rounded-xl transition-all border border-transparent hover:border-indigo-500/20 relative"
                title="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#060608]"></span>
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-fixed"
                  >
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Notifications</span>
                      <button className="text-[10px] text-indigo-400 font-bold hover:underline">Marquer comme lu</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      <div className="p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                        <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Nouveau cours publié</p>
                        <p className="text-xs text-zinc-500">Le module Développement Web a été mis à jour.</p>
                      </div>
                      <div className="p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                        <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Rappel Quiz</p>
                        <p className="text-xs text-zinc-500">N'oubliez pas le quiz du Semestre 1 demain à 10h.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowPomodoro(!showPomodoro)}
              className="p-2.5 bg-white/5 hover:bg-indigo-500/20 text-zinc-500 hover:text-indigo-400 rounded-xl transition-all border border-transparent hover:border-indigo-500/30 ml-2"
              title="Focus Timer"
            >
              <Timer size={18} />
            </button>

            <button 
              onClick={logout}
              className="p-2.5 bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20 ml-2"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
        </div>
      </div>
    ) : (
      <button 
        onClick={login}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all transform hover:scale-105"
      >
        Se connecter
      </button>
    )}
  </div>
  
  <AnimatePresence>
      {showPomodoro && <Pomodoro onClose={() => setShowPomodoro(false)} />}
  </AnimatePresence>
</nav>
  );
}

function NavLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group/nav">
      <div className="p-2 sm:p-0 group-hover/nav:text-indigo-400 transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium hidden sm:inline">{label}</span>
    </Link>
  );
}
