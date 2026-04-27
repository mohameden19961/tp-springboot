'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Book, Plus, Users, Trash2, ChevronRight, BookOpen, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

interface Student {
  id: number;
  name: string;
  email: string;
}

interface Course {
  id: number;
  title: string;
  students?: Student[];
  createdBy?: string;
}

export default function CoursesPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#18181b',
    color: '#fff'
  });

  const fetchCourses = async () => {
    if (!user || authLoading) return;
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (error) {
      console.error("Fetch courses error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user, authLoading]);

  const createCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    try {
      await api.post('/courses', { title });
      setShowModal(false);
      fetchCourses();
      Toast.fire({ icon: 'success', title: 'Cours créé avec succès' });
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Erreur lors de la création' });
    }
  };

  const deleteCourse = async (id: number) => {
    const result = await Swal.fire({
        title: 'Supprimer ce cours ?',
        text: "Tous les étudiants seront désinscrits de ce cours !",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Oui, supprimer',
        background: '#18181b',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
          await api.delete(`/courses/${id}`);
          fetchCourses();
          Toast.fire({ icon: 'success', title: 'Cours supprimé' });
        } catch (error) {
           Swal.fire({ icon: 'error', title: 'Accès Refusé', text: 'Seul l\'ADMIN peut supprimer un cours.', background: '#18181b', color: '#fff' });
        }
    }
  };

  const viewStudents = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const res = await api.get(`/courses/${course.id}/students`);
      setCourseStudents(res.data);
    } catch (error) {
      setCourseStudents([]);
    }
  };

  if (authLoading) return <div className="pt-40 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 px-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tighter leading-none">Modules d'Enseignement</h1>
          <p className="text-zinc-500 font-medium text-lg">Gérez les programmes et suivez les promotions.</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-purple-500/20"
        >
          <Plus size={20} />
          <span>Ajouter un Module</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {courses.map((course, idx) => (
        <motion.div 
            key={course.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-10 rounded-[2.5rem] border border-white/5 group hover:border-purple-500/40 transition-all duration-500 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none" />
            <div className="flex justify-between items-start mb-10">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner text-purple-400">
                <BookOpen size={28} />
            </div>
            {isAdmin && (
                <button 
                onClick={() => deleteCourse(course.id)}
                className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all relative z-10"
                >
                <Trash2 size={18} />
                </button>
            )}
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{course.title}</h3>
            <div className="flex items-center gap-2 mb-10">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">Code: MOD-{course.id}</span>
            </div>
            
            <button 
            onClick={() => viewStudents(course)}
            className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl text-zinc-400 text-sm font-bold group/btn hover:bg-white/10 transition-all relative z-10"
            >
            <div className="flex items-center gap-3">
                <Users size={16} className="text-zinc-600" />
                <span>Inscrits pour ce module</span>
            </div>
            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </motion.div>
        ))}
        {courses.length === 0 && !loading && (
            <div className="col-span-full py-20 glass-card rounded-[3rem] text-center border-dashed border-white/10">
                <Book className="mx-auto text-zinc-600 mb-6" size={48} />
                <p className="text-zinc-500 font-bold italic text-lg">Aucun module n'a encore été créé dans votre département.</p>
            </div>
        )}
      </div>

      <AnimatePresence>
        {/* New Course Modal */}
        {showModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass-card p-12 rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(168,85,247,0.2)]">
                <h2 className="text-4xl font-black text-white mb-10 tracking-tighter">Nouveau Module</h2>
                <form onSubmit={createCourse} className="space-y-8">
                <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 block mx-1">Libellé du Cours</label>
                    <div className="relative group">
                        <Book className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors" size={24} />
                        <input name="title" required placeholder="ex: Développement Full-Stack" className="w-full bg-zinc-900 border border-white/10 rounded-[1.8rem] py-6 pl-16 pr-6 text-xl text-white outline-none focus:border-purple-500 focus:bg-white/[0.02] transition-all shadow-inner" />
                    </div>
                </div>
                <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-6 bg-white/5 hover:bg-white/10 text-white rounded-[1.8rem] font-black transition-all">Annuler</button>
                    <button type="submit" className="flex-1 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[1.8rem] font-black shadow-2xl shadow-purple-500/20">Valider</button>
                </div>
                </form>
            </motion.div>
            </div>
        )}

        {/* Selected Course Detail Modal Overlay */}
        {selectedCourse && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl glass-card p-10 md:p-14 rounded-[3.5rem] border border-purple-500/20 shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                                <GraduationCap className="text-white" size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter leading-none shrink-0">{selectedCourse.title}</h2>
                                <p className="text-purple-400 font-black tracking-widest text-[10px] uppercase mt-2">Liste des inscrits ({courseStudents.length})</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCourse(null)} className="px-8 py-3 bg-white/5 text-zinc-400 hover:text-white rounded-xl font-bold hover:bg-white/10 transition-all border border-transparent hover:border-white/10">Fermer (X)</button>
                    </div>

                    <div className="overflow-y-auto pr-4 space-y-4 mb-10 scrollbar-thin flex-1 min-h-[30vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courseStudents.map((st, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={st.id} 
                                    className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-[1.5rem] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-[1rem] bg-purple-500/10 flex items-center justify-center text-purple-400 font-black group-hover:bg-purple-500 group-hover:text-white transition-all shadow-inner">
                                        {st.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold truncate tracking-tight">{st.name}</p>
                                        <p className="text-zinc-500 text-xs truncate font-mono mt-0.5">{st.email}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {courseStudents.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full py-16 opacity-50">
                                <Users size={64} className="text-zinc-500 mb-6" />
                                <p className="text-xl font-bold text-zinc-400 italic tracking-tight">Aucun étudiant inscrit ici.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
