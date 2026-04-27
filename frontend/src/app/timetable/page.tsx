'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User as UserIcon, Download } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  teacher: { name: string };
  room?: { name: string };
}

const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h to 18h

export default function TimetablePage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      api.get('/courses').then(res => {
        setCourses(res.data.filter((c: any) => c.dayOfWeek && c.startTime));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user, authLoading]);

  const exportICS = () => {
      let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SupNum Campus//Timetable//FR\n";
      
      const dayMap: {[key: string]: number} = {
          'LUNDI': 1, 'MARDI': 2, 'MERCREDI': 3, 'JEUDI': 4, 'VENDREDI': 5, 'SAMEDI': 6, 'DIMANCHE': 0
      };

      courses.forEach(course => {
          if (!course.dayOfWeek || !course.startTime || !course.endTime) return;
          
          const now = new Date();
          const targetDay = dayMap[course.dayOfWeek.toUpperCase()] || 1;
          let startDay = new Date(now);
          startDay.setDate(now.getDate() + ((targetDay + 7 - now.getDay()) % 7));
          
          const formatICSDate = (date: Date, timeStr: string) => {
              const [hours, minutes] = timeStr.split(':');
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              return `${y}${m}${d}T${hours}${minutes}00Z`; // Correct for demo, real ICS should handle timezone mapping properly
          };

          const dtStart = formatICSDate(startDay, course.startTime);
          const dtEnd = formatICSDate(startDay, course.endTime);

          ics += "BEGIN:VEVENT\n";
          ics += `UID:${course.id}-${Date.now()}@supnum.campus\n`;
          ics += `DTSTAMP:${formatICSDate(now, "00:00")}\n`;
          ics += `DTSTART:${dtStart}\n`;
          ics += `DTEND:${dtEnd}\n`;
          ics += `RRULE:FREQ=WEEKLY;COUNT=15\n`;
          ics += `SUMMARY:${course.title}\n`;
          ics += `LOCATION:${course.room?.name || 'En ligne'}\n`;
          ics += `DESCRIPTION:Professeur: ${course.teacher.name}\n`;
          ics += "END:VEVENT\n";
      });

      ics += "END:VCALENDAR";

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'emploi_du_temps_supnum.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (authLoading || loading) return <div className="pt-40 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter flex items-center gap-4">
            <Calendar size={48} className="text-indigo-500" /> Emploi du Temps
          </h1>
          <p className="text-zinc-500 font-medium text-lg">Retrouvez votre planning hebdomadaire personnalisé.</p>
        </div>
        <button onClick={exportICS} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-xl font-black text-sm transition-all border border-white/5 shadow-lg">
            <Download size={18} /> Exporter (iCal)
        </button>
      </div>

      <div className="glass-card rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
              <div className="p-6 border-r border-white/10 text-center text-xs font-black text-zinc-500 uppercase tracking-widest">Heure</div>
              {DAYS.map(day => (
                <div key={day} className="p-6 text-center text-xs font-black text-indigo-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="relative">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-7 border-b border-white/5 last:border-none min-h-[80px]">
                  <div className="p-4 border-r border-white/10 flex items-center justify-center text-zinc-600 font-black text-xs">
                    {hour < 10 ? `0${hour}` : hour}:00
                  </div>
                  {DAYS.map(day => (
                    <div key={`${day}-${hour}`} className="relative p-1 border-r border-white/5 last:border-none">
                      {courses
                        .filter(c => c.dayOfWeek === day && parseInt(c.startTime.split(':')[0]) === hour)
                        .map(course => (
                          <motion.div
                            key={course.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-x-1 top-1 p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 shadow-lg z-10 hover:bg-indigo-600/30 transition-all cursor-pointer group"
                            style={{ height: 'calc(100% - 8px)' }}
                          >
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-1 truncate">{course.title}</p>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-white/50 text-[9px] font-bold">
                                    <Clock size={8} /> {course.startTime} - {course.endTime}
                                </div>
                                <div className="flex items-center gap-1 text-white/50 text-[9px] font-bold">
                                    <MapPin size={8} /> {course.room?.name || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1 text-white/50 text-[9px] font-bold">
                                    <UserIcon size={8} /> {course.teacher.name}
                                </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-8 glass-card rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-start gap-4">
             <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Calendar size={20} />
             </div>
             <div>
                <h4 className="text-white font-black text-base uppercase tracking-tight">Votre Organisation Quotidienne</h4>
                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                    L'emploi du temps centralise tous vos modules, intégrant nativement la gestion des salles de classe physiques et vos créneaux horaires. Il vous permet de suivre de manière claire et structurée l'ensemble de votre parcours universitaire pour une meilleure réussite.
                </p>
             </div>
        </div>
      </div>
    </div>
  );
}
