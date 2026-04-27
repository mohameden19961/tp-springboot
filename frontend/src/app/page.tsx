'use client';

import React from 'react';
import { useAuth } from "@/context/AuthContext";
import { MoveRight, ShieldCheck, Cpu, Code2, Globe, Sparkles, GraduationCap, ArrowDownCircle, Briefcase, Database, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const { user, login } = useAuth();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const licences = [
    { title: "Développement des Systèmes Informatiques", icon: <Code2 />, color: "from-blue-500 to-indigo-500", desc: "Créer, déployer et maintenir des systèmes logiciels adaptés." },
    { title: "Ingénierie des Systèmes Intelligents", icon: <Cpu />, color: "from-emerald-500 to-teal-500", desc: "Concevoir des systèmes automatisés intégrant logiciels et capteurs." },
    { title: "Ingénierie des Données et Statistiques", icon: <Database />, color: "from-purple-500 to-fuchsia-500", desc: "Collecter et transformer la donnée brute en insights stratégiques." },
    { title: "Réseaux, Systèmes et Sécurité", icon: <ShieldCheck />, color: "from-rose-500 to-red-500", desc: "Protéger et administrer les infrastructures. Cybersécurité certifiée." },
    { title: "Communication Numérique et Multimédia", icon: <Globe />, color: "from-amber-500 to-orange-500", desc: "Design graphique et médias interactifs pour des contenus engageants." }
  ];

  return (
    <div className="relative min-h-screen bg-[#060608] overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambience */}
      <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-left space-y-8 z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-2xl"
          >
            <img src="https://flagcdn.com/w20/mr.png" alt="Mauritanie" className="w-4 h-3 rounded-sm opacity-80" />
            <span>Institut Supérieur du Numérique</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.05]"
          >
            L'excellence de la 
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">Licence Pro.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed font-medium"
          >
            Formez-vous aux métiers du numérique en Mauritanie. Par son ambition et sa pédagogie active, SupNum est le pôle d'excellence pour une jeunesse prête à relever les défis de demain.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
          >
            {user ? (
              <Link 
                href="/dashboard"
                className="group flex items-center justify-center gap-3 px-8 md:px-10 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl md:rounded-[1.5rem] font-black transition-all hover:scale-105 active:scale-95 text-center shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                Accéder au Campus
                <MoveRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <button 
                onClick={login}
                className="group flex items-center justify-center gap-3 px-8 md:px-10 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl md:rounded-[1.5rem] font-black transition-all hover:scale-105 active:scale-95 text-center shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                Se connecter (LMS)
                <MoveRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            <button 
              onClick={() => scrollToSection('programmes')}
              className="group flex items-center justify-center gap-2 px-8 py-5 bg-zinc-900/50 hover:bg-zinc-800 text-white border border-white/5 rounded-2xl md:rounded-[1.5rem] font-black transition-all backdrop-blur-md text-center"
            >
              Nos Licences
              <ArrowDownCircle size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all" />
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, type: "spring" }}
          className="flex-1 w-full relative hidden lg:block"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[3rem] transform rotate-3 scale-105 blur-lg" />
          <div className="relative rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 aspect-[4/3]">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1741&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
             <div className="absolute bottom-8 left-8 right-8">
                 <div className="glass p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
                     <div>
                         <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-1">Insertion Pro</p>
                         <p className="text-white text-2xl font-black">+70% dès la sortie</p>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <Briefcase size={24} />
                     </div>
                 </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Pédagogie Section */}
      <div className="border-y border-white/5 bg-white/[0.02] backdrop-blur-xl relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-12 divide-y sm:divide-y-0 sm:divide-x divide-white/10 text-center">
            <div className="px-4">
                <span className="block text-5xl font-black text-white mb-2">26%</span>
                <span className="text-sm font-black text-indigo-400 uppercase tracking-widest block mb-2">Enseignement Magistral</span>
                <p className="text-zinc-500 text-xs font-medium">Des cours théoriques ciblés pour poser des bases de connaissances ultra-solides.</p>
            </div>
            <div className="px-4 pt-8 sm:pt-0">
                <span className="block text-5xl font-black text-white mb-2">74%</span>
                <span className="text-sm font-black text-purple-400 uppercase tracking-widest block mb-2">Travaux Dirigés & Pratiques</span>
                <p className="text-zinc-500 text-xs font-medium">Pédagogie active : La majeure partie du temps est dédiée à la pratique et aux projets.</p>
            </div>
            <div className="px-4 pt-8 sm:pt-0">
                <span className="block text-5xl font-black text-white mb-2">28</span>
                <span className="text-sm font-black text-pink-400 uppercase tracking-widest block mb-2">Semaines d'Immersion Pro</span>
                <p className="text-zinc-500 text-xs font-medium">Des stages et immersions étalés sur les 3 années de Licence pour une intégration immédiate.</p>
            </div>
        </div>
      </div>

      {/* Les Licences Section */}
      <div id="programmes" className="max-w-7xl mx-auto px-6 py-32 relative z-20">
        <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-widest mx-auto mb-4">
              <GraduationCap size={16} /> Nos Formations
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                Le cycle <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Licence Professionnalisante.</span>
            </h2>
            <p className="text-zinc-400 font-medium max-w-2xl mx-auto">
                Inspirées du Bachelor of Engineering anglo-saxon, nos 5 licences sont conçues pour répondre concrètement au marché du numérique en Mauritanie et à l'international.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {licences.map((licence, idx) => (
                <motion.div 
                    key={idx}
                    whileHover={{ y: -5 }}
                    className={`glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative ${idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${licence.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${licence.color} shadow-lg mb-6 transform group-hover:scale-110 transition-transform`}>
                        {licence.icon}
                    </div>
                    <h3 className="text-xl font-black text-white mb-3 tracking-tight">{licence.title}</h3>
                    <p className="text-zinc-500 font-medium text-sm leading-relaxed">{licence.desc}</p>
                </motion.div>
            ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-5xl mx-auto px-6 py-20 pb-40">
        <div className="glass-card p-10 md:p-20 rounded-[3rem] md:rounded-[4rem] border border-indigo-500/20 text-center relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <Wrench size={48} className="mx-auto text-indigo-500/50 mb-8" />
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 relative z-10">Rejoignez l'élite technologique.</h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto font-medium relative z-10">Étudiants et professeurs, connectez-vous à la plateforme d'apprentissage de SupNum pour gérer vos modules de Licence.</p>
          <div className="flex justify-center relative z-10">
            <button onClick={login} className="px-10 py-5 bg-white hover:bg-zinc-200 text-black rounded-[1.5rem] font-black text-lg transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95">
               Accéder à mon Campus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
