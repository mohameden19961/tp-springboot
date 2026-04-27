'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { BookOpen, Plus, Hash, ChevronRight, User, Trash2, Layers, TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Course {
  id: number;
  title: string;
  description: string;
  joinCode: string;
  semester?: string;
  teacher: { id: number; name: string };
  room?: { id: number; name: string };
}

interface Room {
  id: number;
  name: string;
}

function DashboardContent() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const teacherIdParam = searchParams.get('teacherId');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#18181b',
    color: '#fff'
  });

  const fetchData = async () => {
    if (!user) return;
    try {
      const [coursesRes, analyticsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/users/me/analytics')
      ]);
      setCourses(coursesRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error("Fetch data error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
      api.get('/rooms').then(r => setRooms(r.data)).catch(() => {});
    }
  }, [user, authLoading]);

  // Filtrage si un teacherId est présent dans l'URL (venant de l'annuaire)
  const filteredCourses = teacherIdParam 
    ? courses.filter(c => c.teacher?.id === parseInt(teacherIdParam, 10))
    : courses;

  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const sem = course.semester || 'Autres Modules';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  const sortedSemesters = Object.keys(groupedCourses).sort((a, b) => {
     if (a === 'Autres Modules') return 1;
     if (b === 'Autres Modules') return -1;
     return a.localeCompare(b);
  });

  const joinCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get('code') as string;
    try {
      await api.post(`/courses/join?code=${code}`);
      setShowJoinModal(false);
      Toast.fire({ icon: 'success', title: 'Action effectuée !' });
      fetchData();
    } catch (error: any) {
      Toast.fire({ icon: 'error', title: 'Erreur lors de l\'inscription.' });
    }
  };

    const createCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const semester = formData.get('semester') as string || undefined;
    const roomIdStr = formData.get('roomId') as string;
    const roomId = roomIdStr ? parseInt(roomIdStr, 10) : undefined;
    const dayOfWeek = formData.get('dayOfWeek') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    
    try {
      await api.post('/courses', { title, description, semester, roomId, dayOfWeek, startTime, endTime });
      setShowCreateModal(false);
      fetchData();
      Toast.fire({ icon: 'success', title: 'Cours créé !' });
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Erreur lors de la création.' });
    }
  };

  const deleteCourse = async (courseId: number, title: string) => {
    const result = await Swal.fire({
      title: 'Supprimer ce module ?',
      text: `Supprimer "${title}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Oui',
      background: '#18181b', color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/courses/${courseId}`);
        fetchData();
        Toast.fire({ icon: 'success', title: 'Supprimé.' });
      } catch (error) {
        Toast.fire({ icon: 'error', title: 'Erreur.' });
      }
    }
  };

  if (authLoading || loading) return <div className="pt-40 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 px-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">Mon Campus</h1>
          <p className="text-zinc-500 font-medium text-base">
            {teacherIdParam ? 'Affichage des cours filtrés par enseignant.' : 'Retrouvez tous vos modules d\'enseignement ici.'}
          </p>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {!isAdmin && (
                <button onClick={() => setShowJoinModal(true)} className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl font-black transition-all">
                    <Hash size={20} /> Rejoindre
                </button>
            )}
            {(user?.role === 'TEACHER' || isAdmin) && (
                <button onClick={() => setShowCreateModal(true)} className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-purple-500/20">
                    <Plus size={20} /> Créer un Module
                </button>
            )}
        </div>
      </div>

      {/* Analytics Section */}
      {!isAdmin && analytics.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-16 glass-card p-8 rounded-[3rem] border border-white/5 bg-zinc-900/20 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Votre Progression</h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Résultats aux derniers quiz</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.map((a, idx) => ({
                id: a.quizId || idx,
                name: a.quizTitle,
                score: (a.score / (a.totalPoints || 20)) * 20,
                fullDate: new Date(a.submittedAt).toLocaleDateString()
              }))}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 20]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <div className="space-y-16 mb-20">
        {sortedSemesters.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                <BookOpen size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-500 font-bold">Aucun cours disponible.</p>
            </div>
        )}
        {sortedSemesters.map(semester => (
            <div key={`sem-${semester}`}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-2xl font-black text-white px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 tracking-widest shadow-xl">
                        <Layers size={20} className="text-indigo-400" /> {semester}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {groupedCourses[semester].map((course, idx) => (
                    <motion.div 
                      key={`course-${course.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      onClick={() => router.push(`/courses/${course.id}`)}
                      className="glass-card flex flex-col rounded-[2.5rem] border border-white/5 group hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden cursor-pointer h-72 shadow-xl"
                    >
                      <div className="h-28 bg-gradient-to-br from-indigo-600/20 to-purple-800/20 p-8 relative">
                          <h3 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight truncate">{course.title}</h3>
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-300/60 font-black uppercase tracking-widest mt-1">
                              <Layers size={10} /> {course.semester || 'S0'}
                          </span>
                      </div>

                      <div className="p-8 flex-1 flex flex-col justify-between bg-zinc-950/40">
                          <div className="flex items-center gap-3 text-zinc-400 font-bold">
                              <User size={16} /> <span className="text-sm truncate">Prof. {course.teacher?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-500 font-black px-3 py-1 bg-white/5 rounded-full border border-white/5 tracking-widest"> {course.joinCode} </span>
                              <div className="flex items-center gap-2">
                                  {isAdmin && (
                                      <button onClick={(e) => { e.stopPropagation(); deleteCourse(course.id, course.title); }} className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all"> <Trash2 size={16} /> </button>
                                  )}
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white text-zinc-500 transition-all"> <ChevronRight size={18} /> </div>
                              </div>
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
            </div>
        ))}
      </div>

      <AnimatePresence>
          {showJoinModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass-card p-12 rounded-[3.5rem] border border-white/10 shadow-2xl transition-all">
                <h2 className="text-4xl font-black text-white mb-10 tracking-tighter">Rejoindre un cours</h2>
                <form onSubmit={joinCourse} className="space-y-8">
                  <input name="code" required placeholder="Code d'invitation" className="w-full bg-zinc-900 border border-white/10 rounded-[1.8rem] py-6 px-10 text-xl text-white outline-none focus:border-indigo-500 font-mono uppercase transition-all" />
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 py-6 bg-white/5 text-white rounded-[1.8rem] font-black transition-all">Annuler</button>
                    <button type="submit" className="flex-1 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[1.8rem] font-black shadow-xl shadow-indigo-500/20">Rejoindre</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass-card p-12 rounded-[3.5rem] border border-white/10 shadow-2xl transition-all">
                <h2 className="text-4xl font-black text-white mb-10 tracking-tighter">Créer un cours</h2>
                <form onSubmit={createCourse} className="space-y-6">
                  <input name="title" required placeholder="Titre du module" className="w-full bg-zinc-900 border border-white/10 rounded-[1.5rem] py-5 px-6 text-white outline-none focus:border-purple-500 transition-all font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                    <select name="semester" className="bg-zinc-900 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-purple-500 transition-all cursor-pointer">
                        <option value="">Semestre</option>
                        {['S1','S2','S3','S4','S5','S6'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select name="roomId" className="bg-zinc-900 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-purple-500 transition-all cursor-pointer">
                        <option value="">Salle</option>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <select name="dayOfWeek" required className="w-full bg-zinc-900 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-purple-500 transition-all cursor-pointer">
                        <option value="">Jour de la semaine</option>
                        {['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase font-black ml-2">Début</label>
                            <input type="time" name="startTime" required className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-500 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase font-black ml-2">Fin</label>
                            <input type="time" name="endTime" required className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-purple-500 transition-all" />
                        </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-6 bg-white/5 text-white rounded-[1.8rem] font-black transition-all">Annuler</button>
                    <button type="submit" className="flex-1 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[1.8rem] font-black shadow-xl shadow-purple-500/20">Créer</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="pt-40 flex justify-center text-zinc-500">Chargement...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
