'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Search, Users, ShieldCheck, GraduationCap, Trash2, Mail,
  ChevronLeft, ChevronRight, Building2, PlusCircle, ShieldAlert,
  Layers, User, BookOpen, LayoutPanelLeft, TrendingUp, AlertTriangle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  building?: string;
}

// ─── Toast helper ─────────────────────────────────────────────────────────────
const useToast = () => Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#18181b',
  color: '#fff'
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'ROOMS'>('OVERVIEW');

  if (authLoading) return <Spinner />;
  if (!user || !isAdmin) return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter leading-none">
          Administration
        </h1>
        <p className="text-zinc-500 font-medium text-lg">
          Gérez les utilisateurs, les rôles et l'infrastructure de l'école.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-10 border-b border-white/5 pb-0">
        {([['OVERVIEW', LayoutPanelLeft, 'Vue d\'Ensemble'], ['USERS', Users, 'Utilisateurs'], ['ROOMS', Building2, 'Salles']] as const).map(([tab, Icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-6 py-4 font-black text-sm transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-indigo-400 border-indigo-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'OVERVIEW' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <OverviewPanel />
          </motion.div>
        )}
        {activeTab === 'USERS' && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <UsersPanel />
          </motion.div>
        )}
        {activeTab === 'ROOMS' && (
          <motion.div key="rooms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <RoomsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Users Panel ──────────────────────────────────────────────────────────────
function UsersPanel() {
  const Toast = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const setRole = async (userId: number, newRole: string) => {
    const roleLabel = newRole === 'TEACHER' ? 'Professeur' : 'Étudiant';
    const result = await Swal.fire({
      title: `Changer le rôle en ${roleLabel} ?`,
      text: `L'utilisateur aura de nouvelles permissions.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      background: '#18181b', color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/users/${userId}/role?role=${newRole}`);
        Toast.fire({ icon: 'success', title: `Rôle mis à jour : ${newRole}` });
        fetchUsers();
      } catch (e) {
        Toast.fire({ icon: 'error', title: 'Erreur lors du changement de rôle' });
      }
    }
  };

  const deleteUser = async (userId: number) => {
    const result = await Swal.fire({
      title: 'Supprimer cet utilisateur ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      background: '#18181b',
      color: '#fff'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${userId}`);
        Toast.fire({ icon: 'success', title: 'Utilisateur supprimé' });
        fetchUsers();
      } catch {
        Toast.fire({ icon: 'error', title: 'Impossible de supprimer' });
      }
    }
  };

  return (
    <div>
      {/* Search + pagination */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-3 rounded-2xl bg-white/5 text-zinc-400 disabled:opacity-30 hover:bg-white/10 transition-colors"><ChevronLeft size={20} /></button>
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
            <span className="text-sm font-bold text-white tracking-widest">{page + 1} / {totalPages}</span>
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-3 rounded-2xl bg-white/5 text-zinc-400 disabled:opacity-30 hover:bg-white/10 transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.03] text-zinc-500 text-xs uppercase tracking-[0.15em] font-black">
              <th className="px-8 py-5">Utilisateur</th>
              <th className="px-8 py-5">Email</th>
              <th className="px-8 py-5">Rôle Actuel</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map((u, idx) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group hover:bg-white/[0.03] transition-all"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-lg text-white ${
                      u.role === 'ADMIN' ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' :
                      u.role === 'TEACHER' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' :
                      'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
                    }`}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold">{u.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">ID #{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Mail size={14} className="opacity-40" />
                    {u.email}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {u.role === 'TEACHER' && (
                        <button
                          onClick={() => router.push(`/dashboard?teacherId=${u.id}`)}
                          className="px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-2"
                        >
                            <BookOpen size={14} /> Voir ses cours
                        </button>
                    )}
                    {u.role !== 'ADMIN' && (
                      <>
                        {u.role === 'STUDENT' ? (
                          <button
                            onClick={() => setRole(u.id, 'TEACHER')}
                            title="Promouvoir en TEACHER"
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-black transition-all"
                          >
                            <GraduationCap size={15} /> Rendre Professeur
                          </button>
                        ) : (
                          <button
                            onClick={() => setRole(u.id, 'STUDENT')}
                            title="Rétrograder en STUDENT"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-black transition-all"
                          >
                            <User size={15} /> Rendre Étudiant
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="w-9 h-9 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    {u.role === 'ADMIN' && (
                      <span className="text-xs font-black text-amber-500/60 uppercase tracking-widest">Protégé</span>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {paginated.length === 0 && !loading && (
          <div className="flex flex-col items-center py-20">
            <Search className="text-zinc-600 mb-4" size={40} />
            <p className="text-zinc-500 italic font-bold">Aucun utilisateur trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rooms Panel ──────────────────────────────────────────────────────────────
function RoomsPanel() {
  const Toast = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const createRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name') as string,
      capacity: parseInt(fd.get('capacity') as string, 10),
      building: fd.get('building') as string || undefined,
    };
    try {
      await api.post('/rooms', payload);
      setShowModal(false);
      fetchRooms();
      Toast.fire({ icon: 'success', title: 'Salle créée !' });
    } catch {
      Toast.fire({ icon: 'error', title: 'Erreur lors de la création de la salle' });
    }
  };

  const deleteRoom = async (id: number) => {
    const result = await Swal.fire({
      title: 'Supprimer cette salle ?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Supprimer',
      background: '#18181b', color: '#fff',
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/rooms/${id}`);
        fetchRooms();
        Toast.fire({ icon: 'success', title: 'Salle supprimée' });
      } catch { Toast.fire({ icon: 'error', title: 'Erreur suppression' }); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <p className="text-zinc-400 font-medium">{rooms.length} salle(s) disponible(s)</p>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20"
        >
          <PlusCircle size={18} /> Ajouter une Salle
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room, idx) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="glass-card p-8 rounded-[2rem] border border-white/5 group hover:border-indigo-500/30 transition-all relative"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Building2 size={26} />
              </div>
              <button
                onClick={() => deleteRoom(room.id)}
                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h3 className="text-2xl font-black text-white mb-1 tracking-tight group-hover:text-indigo-400 transition-colors">{room.name}</h3>
            {room.building && <p className="text-zinc-500 text-sm font-medium mb-4">{room.building}</p>}
            <div className="flex items-center gap-2 mt-4">
              <Layers size={14} className="text-indigo-400" />
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Capacité : {room.capacity} places</span>
            </div>
          </motion.div>
        ))}
        {rooms.length === 0 && !loading && (
          <div className="col-span-full py-20 glass-card rounded-[2rem] text-center border-dashed border-white/10">
            <Building2 className="mx-auto text-zinc-600 mb-5" size={48} />
            <p className="text-zinc-500 italic font-bold">Aucune salle créée. Ajoutez votre première infrastructure !</p>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass-card p-12 rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.15)]"
            >
              <h2 className="text-4xl font-black text-white mb-10 tracking-tighter">Nouvelle Salle</h2>
              <form onSubmit={createRoom} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 block">Nom de la salle *</label>
                  <input name="name" required placeholder="ex: Amphi A, Salle 101" className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none focus:border-indigo-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 block">Capacité *</label>
                    <input name="capacity" type="number" min="1" required placeholder="ex: 150" className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 block">Bâtiment</label>
                    <input name="building" placeholder="ex: Bloc A" className="w-full bg-zinc-900/60 border border-white/5 rounded-2xl py-5 px-6 text-white outline-none focus:border-indigo-500 transition-all" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black transition-all">Annuler</button>
                  <button type="submit" className="flex-1 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[1.5rem] font-black shadow-xl">Créer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const cfg = {
    ADMIN: { label: 'Admin', icon: ShieldCheck, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    TEACHER: { label: 'Professeur', icon: GraduationCap, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    STUDENT: { label: 'Étudiant', icon: User, cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  }[role] ?? { label: role, icon: User, cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function Spinner() {
  return <div className="pt-40 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" /></div>;
}

function AccessDenied() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <div className="glass-card p-16 rounded-[3rem] border-white/5">
        <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <ShieldAlert className="text-red-500" size={48} />
        </div>
        <h2 className="text-4xl font-black text-white mb-4">Accès Réservé Admin</h2>
        <p className="text-zinc-400 text-lg max-w-sm mx-auto">Cette section est réservée aux administrateurs de SupNum Campus.</p>
      </div>
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────
function OverviewPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading || !stats) return <Spinner />;

  return (
    <div className="space-y-12">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users />} label="Étudiants" value={stats.studentCount} color="text-indigo-400" />
        <StatCard icon={<GraduationCap />} label="Professeurs" value={stats.teacherCount} color="text-emerald-400" />
        <StatCard icon={<Layers />} label="Modules" value={stats.courseCount} color="text-purple-400" />
        <StatCard icon={<Building2 />} label="Salles" value={stats.roomCount} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Absence Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={20} /> Alertes Décrochage
            </h3>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seuil: {stats.absenceThreshold} Absences</span>
          </div>

          <div className="space-y-4">
            {stats.absenceAlerts.length > 0 ? (
              stats.absenceAlerts.map((alert: any, idx: number) => (
                <motion.div
                  key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                  className="glass-card p-6 rounded-[2rem] border border-red-500/10 bg-red-500/5 flex items-center justify-between group hover:border-red-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-black">
                      {alert.absenceCount}
                    </div>
                    <div>
                      <p className="text-white font-black text-lg">{alert.studentName}</p>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-tight">{alert.courseTitle}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <span className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">Action Requise</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center glass-card rounded-[2.5rem] border-white/5 opacity-40 italic text-zinc-500">
                Aucune alerte d'absence pour le moment.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
           <h3 className="text-xl font-black text-white flex items-center gap-3 px-2">
              <Clock className="text-indigo-400" size={20} /> Activité Campus
           </h3>
           <div className="glass-card p-6 rounded-[2.5rem] border-white/5 space-y-6">
              {stats.recentAbsences.map((act: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-start relative pb-6 last:pb-0 last:after:hidden after:absolute after:left-2 after:top-8 after:bottom-0 after:w-px after:bg-white/5">
                   <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${act.justified ? 'bg-emerald-500/20' : 'bg-red-500/20 border border-red-500/30'}`} />
                   <div>
                      <p className="text-sm font-bold text-white leading-tight">Absence de {act.studentName}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">{act.courseTitle}</p>
                      <p className="text-[9px] text-zinc-600 mt-1 uppercase font-black tracking-widest">{new Date(act.date).toLocaleDateString()}</p>
                   </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/5 space-y-4">
                 <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <TrendingUp size={12} /> Insight IA
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                       Le taux de participation est en hausse de 8% par rapport au semestre dernier.
                    </p>
                 </div>
                 
                 <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">SupNum vs Google Classroom</p>
                    <ul className="space-y-1.5">
                        {[
                            'Gestion des absences (Inexistant sur Classroom)', 
                            'Salles physiques & créneaux (Nativement)', 
                            'Notation sur 20 & Relevé PDF',
                            'Souveraineté des données'
                        ].map(point => (
                            <li key={point} className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold">
                                <ShieldCheck size={10} className="text-amber-500" /> {point}
                            </li>
                        ))}
                    </ul>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group"
    >
      <div className={`p-4 rounded-2xl bg-white/5 ${color} mb-6 transition-all group-hover:scale-110 w-fit`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <p className="text-4xl font-black text-white tracking-tighter mb-1">{value}</p>
      <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
    </motion.div>
  );
}

