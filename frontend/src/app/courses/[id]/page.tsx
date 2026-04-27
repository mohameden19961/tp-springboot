'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Users, Send, Book, Hash, Clock, ArrowLeft, Trash2, ShieldAlert, FileText, CheckCircle, XCircle, AlertTriangle, UserMinus, GraduationCap, ClipboardList, PenTool, MessageSquare, HelpCircle, Paperclip, MoveRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import Link from 'next/link';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
// @ts-expect-error canvas-confetti missing types locally
import confetti from 'canvas-confetti';
import dynamic from 'next/dynamic';
const ReactQuill: any = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function ClassroomView({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'STREAM' | 'PEOPLE' | 'FILES' | 'ABSENCES' | 'REQUESTS' | 'ASSIGNMENTS' | 'CHAT' | 'QUIZ' | 'GRADES' | 'MEET'>('STREAM');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [postContent, setPostContent] = useState('');
  const [gradeReport, setGradeReport] = useState<any>(null);
  const [stompClient, setStompClient] = useState<any>(null);
  const [fileType, setFileType] = useState<'LINK' | 'FILE'>('LINK');

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#18181b',
    color: '#fff'
  });

  const fetchCourseData = async () => {
    if (!user) return;
    try {
      const courseRes = await api.get(`/courses/${unwrappedParams.id}`);
      setCourse(courseRes.data);
      const isProfOrAdmin = (user?.role === 'TEACHER' && courseRes.data.teacher.id === user?.id) || isAdmin;

      const [postsRes, filesRes, absRes] = await Promise.all([
         api.get(`/courses/${unwrappedParams.id}/posts`),
         api.get(`/courses/${unwrappedParams.id}/files`),
         api.get(`/courses/${unwrappedParams.id}/absences${(!isProfOrAdmin && user?.id) ? `?studentId=${user.id}` : ''}`)
      ]);
      setPosts(postsRes.data);
      setFiles(filesRes.data);
      setAbsences(absRes.data);

      if (isProfOrAdmin) {
          const [reqRes, assignRes, quizRes, gradeRes] = await Promise.all([
            api.get(`/courses/${unwrappedParams.id}/requests`),
            api.get(`/courses/${unwrappedParams.id}/assignments`),
            api.get(`/courses/${unwrappedParams.id}/quizzes`),
            api.get(`/courses/${unwrappedParams.id}/grades`)
          ]);
          setRequests(reqRes.data);
          setAssignments(assignRes.data);
          setQuizzes(quizRes.data);
          setGradeReport(gradeRes.data);
      } else {
          const [assignRes, quizRes] = await Promise.all([
            api.get(`/courses/${unwrappedParams.id}/assignments`),
            api.get(`/courses/${unwrappedParams.id}/quizzes`)
          ]);
          setAssignments(assignRes.data);
          setQuizzes(quizRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchCourseData();
  }, [user, authLoading]);

  useEffect(() => {
    if (tab === 'CHAT' && !stompClient) {
      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        onConnect: () => {
          setStompClient(client);
          client.subscribe(`/topic/messages/${unwrappedParams.id}`, (msg) => {
            const newMsg = JSON.parse(msg.body);
            setChatMessages(prev => [...prev, newMsg]);
          });
          client.subscribe(`/topic/updates/${unwrappedParams.id}`, (msg) => {
            fetchCourseData();
          });
        },
        debug: (str) => {
            // console.log(str);
        },
      });

      client.activate();
      api.get(`/courses/${unwrappedParams.id}/messages`).then(res => setChatMessages(res.data));

      return () => {
        if (client) client.deactivate();
        setStompClient(null);
      };
    }
  }, [tab, unwrappedParams.id, stompClient]);

  useEffect(() => {
      if (typeof window !== 'undefined') {
          (window as any).gradeWork = (aId: number, sId: number) => {
              gradeSubmission(aId, sId);
              Swal.close();
          };
          (window as any).dlSub = (fName: string) => downloadSubmission(fName);
      }
  }, []);

  useEffect(() => {
    if (tab === 'CHAT') {
        const scroller = document.getElementById('chat-scroller');
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }
  }, [tab, chatMessages]);

  const sendChatMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = (form.elements.namedItem('message') as HTMLInputElement).value;
    if (!msg.trim() || !stompClient || !user) return;

    stompClient.publish({
        destination: `/app/chat/${unwrappedParams.id}`,
        body: JSON.stringify({
            sender: { id: user.id, name: user.name },
            content: msg
        })
    });
    form.reset();
  };

  const postAnnouncement = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!postContent || postContent.trim() === '' || postContent === '<p><br></p>') return;
    try {
      await api.post(`/courses/${unwrappedParams.id}/posts`, { content: postContent });
      setPostContent('');
      fetchCourseData();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: "Impossible de publier l'annonce", background: '#18181b', color: '#fff' });
    }
  };

  const deletePost = async (postId: number) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Supprimer cette annonce ?',
      text: "Cette action est définitive.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      background: '#18181b', color: '#fff'
    });

    if (isConfirmed) {
      try {
        await api.delete(`/courses/${unwrappedParams.id}/posts/${postId}`);
        fetchCourseData();
        Toast.fire({ icon: 'success', title: 'Annonce supprimée' });
      } catch(e) { Toast.fire({ icon: 'error', title: 'Erreur' }); }
    }
  };

  const handleRequest = async (reqId: number, accept: boolean) => {
      try {
          await api.post(`/courses/${unwrappedParams.id}/requests/${reqId}/${accept ? 'accept' : 'reject'}`);
          fetchCourseData();
          Toast.fire({ icon: 'success', title: accept ? 'Étudiant accepté' : 'Demande refusée' });
      } catch(e) {}
  };

  const addFile = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const title = formData.get('title') as string;
      
      try {
          if (fileType === 'FILE') {
              const file = formData.get('file') as File;
              if (!file || file.size === 0) return Toast.fire({ icon: 'error', title: 'Choisir un fichier' });
              
              const uploadData = new FormData();
              uploadData.append('file', file);
              uploadData.append('title', title);
              
              await api.post(`/courses/${unwrappedParams.id}/files/upload`, uploadData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
              });
          } else {
              const url = formData.get('url') as string;
              await api.post(`/courses/${unwrappedParams.id}/files`, { title, url });
          }
          
          form.reset();
          fetchCourseData();
          Toast.fire({ icon: 'success', title: 'Ressource ajoutée' });
      } catch(err: any) {
          console.error("Erreur addFile:", err.response?.data || err.message);
          Toast.fire({ icon: 'error', title: 'Erreur lors de l\'ajout' });
      }
  };

  const downloadFile = async (fileId: number, title: string, storedName: string) => {
      try {
          const res = await api.get(`/courses/${unwrappedParams.id}/files/download/${fileId}`, {
              responseType: 'blob'
          });
          const extension = storedName.includes('.') ? storedName.split('.').pop() : '';
          const finalName = extension ? `${title}.${extension}` : title;
          
          const url = window.URL.createObjectURL(res.data);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', finalName);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (e) {
          Toast.fire({ icon: 'error', title: 'Erreur de téléchargement' });
      }
  };

  const downloadSubmission = async (fileName: string) => {
      // We need a server endpoint for this, or use the file service
      // For now, let's assume we can use a generic download endpoint if exists
      // If not, we'll create one. Let's assume /files/download works for submissions too if we pass the filename?
      // Actually, let's create a dedicated one in AssignmentController
      try {
          const res = await api.get(`/assignments/download/${fileName}`, {
              responseType: 'blob'
          });
          const url = window.URL.createObjectURL(res.data);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName.split('_').slice(1).join('_') || fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (e) {
          Toast.fire({ icon: 'error', title: 'Erreur' });
      }
  };

  const createQuiz = async () => {
    const { value: qInfo } = await Swal.fire({
      title: 'Créer un nouveau Quiz',
      html: `
          <div class="space-y-4">
              <input id="q-title" placeholder="Titre du Quiz" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
              <textarea id="q-desc" placeholder="Description..." class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white h-24 outline-none focus:border-purple-500"></textarea>
              <input id="q-timer" type="number" placeholder="Temps (minutes)" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
              <div class="space-y-1">
                  <label class="text-[10px] text-zinc-500 uppercase font-bold ml-2">Fichier joint (facultatif)</label>
                  <input id="q-file" type="file" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 text-xs" />
              </div>
              <p class="text-[10px] text-zinc-500 italic">Note: Les questions pourront être ajoutées via l'édition.</p>
          </div>
      `,
      background: '#18181b', color: '#fff',
      preConfirm: () => {
        return {
          title: (document.getElementById('q-title') as HTMLInputElement).value,
          description: (document.getElementById('q-desc') as HTMLTextAreaElement).value,
          timeLimit: (document.getElementById('q-timer') as HTMLInputElement).value,
          file: (document.getElementById('q-file') as HTMLInputElement).files?.[0]
        }
      }
    });

    if (qInfo && qInfo.title) {
        try {
            const formData = new FormData();
            formData.append('quiz', JSON.stringify({
                title: qInfo.title,
                description: qInfo.description,
                timeLimit: parseInt(qInfo.timeLimit) || 10,
                questions: []
            }));
            if (qInfo.file) formData.append('file', qInfo.file);
            await api.post(`/courses/${unwrappedParams.id}/quizzes`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchCourseData();
            Toast.fire({ icon: 'success', title: 'Quiz créé' });
        } catch(e: any) { 
            const msg = e.response?.data || "Erreur";
            Toast.fire({ icon: 'error', title: typeof msg === 'string' ? msg : 'Erreur lors de la création' }); 
        }
    }
  };

  const deleteQuiz = async (quizId: number) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Supprimer le Quiz ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Supprimer',
      background: '#18181b', color: '#fff'
    });

    if (isConfirmed) {
      try {
        await api.delete(`/courses/${unwrappedParams.id}/quizzes/${quizId}`);
        fetchCourseData();
        Toast.fire({ icon: 'success', title: 'Quiz supprimé' });
      } catch(e: any) { 
          const msg = e.response?.data || "Erreur";
          Toast.fire({ icon: 'error', title: typeof msg === 'string' ? msg : 'Erreur lors de la suppression' }); 
      }
    }
  };

  const editQuiz = async (q: any) => {
    let questions = [...(q.questions || [])].map(qu => ({
        ...qu,
        points: qu.points || 0,
        type: qu.type || 'RADIO',
        options: qu.options || ['', ''],
        correctAnswers: qu.correctAnswers || [],
        correctText: qu.correctText || ''
    }));
    
    const renderQuestions = () => {
        const totalPts = questions.reduce((sum: number, q: any) => sum + (parseInt(q.points) || 0), 0);
        const ptsBadgeClass = totalPts === 20
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
            : totalPts > 20
            ? 'text-red-400 bg-red-500/10 border-red-500/30'
            : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

        return `
            <div class="mb-4 flex items-center justify-between px-2">
                <span class="text-xs text-zinc-500 font-bold uppercase tracking-widest">${questions.length} Question(s)</span>
                <span class="px-4 py-1 rounded-full border text-xs font-black uppercase tracking-widest ${ptsBadgeClass}">
                    Total: ${totalPts}/20 pts
                </span>
            </div>
            <div id="edit-questions-container" class="space-y-6 max-h-[500px] overflow-y-auto px-2 py-4 custom-scrollbar">
                ${questions.map((quest: any, idx: number) => `
                    <div class="p-6 bg-zinc-900 border border-white/10 rounded-[2rem] relative group shadow-xl">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-black text-indigo-500 uppercase tracking-widest">Question ${idx+1}</span>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-1">
                                    <span class="text-[10px] text-zinc-500 font-black uppercase">Pts:</span>
                                    <input 
                                        type="number" 
                                        min="0" max="20" 
                                        value="${quest.points || 0}" 
                                        onchange="window.updateQPts(${idx}, parseInt(this.value) || 0)"
                                        style="width:40px; background:transparent; border:none; color:#a5b4fc; font-weight:900; outline:none; text-align:center;"
                                    />
                                </div>
                                <select onchange="window.updateType(${idx}, this.value)" class="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-black text-white outline-none">
                                    <option value="RADIO" ${quest.type === 'RADIO' ? 'selected' : ''}>RADIO</option>
                                    <option value="CHECKBOX" ${quest.type === 'CHECKBOX' ? 'selected' : ''}>CHECKBOX</option>
                                    <option value="TEXT" ${quest.type === 'TEXT' ? 'selected' : ''}>PARAGRAPHE</option>
                                </select>
                                <button onclick="window.removeQD(${idx})" class="p-2 text-zinc-500 hover:text-red-500 transition-colors">🗑️</button>
                            </div>
                        </div>
                        
                        <input value="${quest.text}" onchange="window.updateQT(${idx}, this.value)" placeholder="Énoncez votre question ici..." class="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-white font-bold mb-4 outline-none focus:border-indigo-500/50 transition-all" />
                        
                        ${quest.type === 'TEXT' ? `
                            <div class="space-y-2">
                                <label class="text-[10px] text-zinc-500 uppercase font-black ml-2">Réponse attendue (exacte)</label>
                                <input value="${quest.correctText}" onchange="window.updateText(${idx}, this.value)" placeholder="Réponse correcte..." class="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3 text-indigo-400 outline-none" />
                            </div>
                        ` : `
                            <div class="space-y-2" id="options-${idx}">
                                ${quest.options.map((opt: string, oIdx: number) => `
                                    <div class="flex items-center gap-3 group/opt">
                                        <input 
                                            type="${quest.type === 'RADIO' ? 'radio' : 'checkbox'}" 
                                            name="correct-${idx}" 
                                            ${quest.type === 'RADIO' ? (quest.correctAnswers[0] === oIdx ? 'checked' : '') : (quest.correctAnswers.includes(oIdx) ? 'checked' : '')} 
                                            onchange="window.updateQC(${idx}, ${oIdx}, this.checked)"
                                            class="w-4 h-4 accent-indigo-500"
                                        />
                                        <input value="${opt}" onchange="window.updateQO(${idx}, ${oIdx}, this.value)" placeholder="Option ${oIdx+1}" class="flex-1 bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:bg-zinc-800 transition-all" />
                                        <button onclick="window.removeOpt(${idx}, ${oIdx})" class="opacity-0 group-hover/opt:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all">×</button>
                                    </div>
                                `).join('')}
                                <button onclick="window.addOpt(${idx})" class="w-full py-2 bg-indigo-500/5 border border-dashed border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 hover:bg-indigo-500/10 transition-all uppercase mt-2">
                                    + Ajouter une option
                                </button>
                            </div>
                        `}
                    </div>
                `).join('')}
                <button onclick="window.addQD()" class="w-full py-5 border-2 border-dashed border-indigo-500/30 rounded-[2rem] text-indigo-400 hover:text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all text-xs font-black uppercase shadow-lg group">
                    <span class="group-hover:scale-110 inline-block transition-transform">+ Nouvelle Question</span>
                </button>
            </div>
        `;
    };

    const { isConfirmed } = await Swal.fire({
        title: `Édition: ${q.title}`,
        html: `
            <div class="text-left py-2">
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="col-span-2">
                        <label class="text-[10px] text-zinc-500 uppercase font-black ml-2 mb-1 block">Titre du Quiz</label>
                        <input id="eq-title" value="${q.title}" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 shadow-inner" />
                    </div>
                    <div>
                        <label class="text-[10px] text-zinc-500 uppercase font-black ml-2 mb-1 block">Timer (min)</label>
                        <input id="eq-timer" type="number" value="${q.timeLimit || 10}" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" />
                    </div>
                </div>
                
                <label class="text-[10px] text-zinc-500 uppercase font-black ml-2 mb-1 block">Description</label>
                <textarea id="eq-desc" class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white h-20 mb-6 outline-none focus:border-indigo-500/50">${q.description}</textarea>
                
                <div class="flex items-center justify-between mb-2 px-2">
                    <h3 class="text-white font-black text-xs uppercase tracking-widest">Structure du Quiz</h3>
                </div>
                <div id="questions-wrapper">${renderQuestions()}</div>
            </div>
        `,
        background: '#121214', color: '#fff', width: '850px',
        showCancelButton: true, confirmButtonText: 'Enregistrer les modifications',
        confirmButtonColor: '#6366f1',
        cancelButtonText: 'Annuler',
        didOpen: (popup) => {
            const refresh = () => {
                const wrapper = popup.querySelector('#questions-wrapper');
                if (wrapper) wrapper.innerHTML = renderQuestions();
            };

            (window as any).addQD = () => {
                questions.push({ text: '', type: 'RADIO', options: ['', ''], correctAnswers: [0], correctText: '', points: 0 });
                refresh();
            };
            (window as any).removeQD = (idx: number) => {
                questions.splice(idx, 1);
                refresh();
            };
            (window as any).updateType = (idx: number, type: string) => {
                questions[idx].type = type;
                if (type === 'CHECKBOX') questions[idx].correctAnswers = [];
                else if (type === 'RADIO') questions[idx].correctAnswers = [0];
                refresh();
            };
            (window as any).addOpt = (qIdx: number) => {
                questions[qIdx].options.push('');
                refresh();
            };
            (window as any).removeOpt = (qIdx: number, oIdx: number) => {
                questions[qIdx].options.splice(oIdx, 1);
                // Adjust correct answers
                questions[qIdx].correctAnswers = questions[qIdx].correctAnswers.filter((val: number) => val !== oIdx).map((val: number) => val > oIdx ? val - 1 : val);
                refresh();
            };
            (window as any).updateQT = (idx: number, val: string) => { questions[idx].text = val; refresh(); };
            (window as any).updateQO = (idx: number, oIdx: number, val: string) => { questions[idx].options[oIdx] = val; refresh(); };
            (window as any).updateQC = (idx: number, oIdx: number, checked: boolean) => {
                if (questions[idx].type === 'RADIO') {
                    questions[idx].correctAnswers = [oIdx];
                } else {
                    if (checked) {
                        if (!questions[idx].correctAnswers.includes(oIdx)) questions[idx].correctAnswers.push(oIdx);
                    } else {
                        questions[idx].correctAnswers = questions[idx].correctAnswers.filter((val: number) => val !== oIdx);
                    }
                }
                refresh();
            };
            (window as any).updateText = (idx: number, val: string) => { questions[idx].correctText = val; refresh(); };
            (window as any).updateQPts = (idx: number, val: number) => { questions[idx].points = val; refresh(); };
        },
        preConfirm: () => {
            const totalPts = questions.reduce((sum: number, q: any) => sum + (parseInt(q.points) || 0), 0);
            if (questions.length > 0 && totalPts !== 20) {
                Swal.showValidationMessage(`Le total des points doit être exactement 20 (actuellement: ${totalPts})`);
                return false;
            }
            if (questions.some(q => q.type !== 'TEXT' && (!q.correctAnswers || q.correctAnswers.length === 0))) {
                Swal.showValidationMessage('Veuillez sélectionner au moins une bonne réponse par question.');
                return false;
            }
            return {
                title: (document.getElementById('eq-title') as HTMLInputElement).value,
                description: (document.getElementById('eq-desc') as HTMLTextAreaElement).value,
                timeLimit: parseInt((document.getElementById('eq-timer') as HTMLInputElement).value),
                questions: questions
            }
        }
    });

    if (isConfirmed) {
        try {
            await api.put(`/courses/${unwrappedParams.id}/quizzes/${q.id}`, {
                ...q,
                title: (document.getElementById('eq-title') as HTMLInputElement).value,
                description: (document.getElementById('eq-desc') as HTMLTextAreaElement).value,
                timeLimit: parseInt((document.getElementById('eq-timer') as HTMLInputElement).value),
                questions: questions
            });
            fetchCourseData();
            Toast.fire({ icon: 'success', title: 'Le quiz a été mis à jour avec succès' });
        } catch(e: any) { 
            const msg = e.response?.data || "Erreur lors de la sauvegarde";
            Toast.fire({ icon: 'error', title: typeof msg === 'string' ? msg : 'Erreur réseau' }); 
        }
    }
  };

  const deleteFile = async (id: number) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Supprimer cette ressource ?',
      text: "L'accès au fichier ou lien sera perdu pour tous.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      background: '#18181b', color: '#fff'
    });

    if (isConfirmed) {
      try {
        await api.delete(`/courses/${unwrappedParams.id}/files/${id}`);
        fetchCourseData();
        Toast.fire({ icon: 'success', title: 'Ressource supprimée' });
      } catch(e) { Toast.fire({ icon: 'error', title: 'Erreur' }); }
    }
  };

  const kickStudent = async (studentId: number, studentName: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Exclure l\'étudiant ?',
      text: `Voulez-vous retirer "${studentName}" de ce module ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Exclure',
      cancelButtonText: 'Annuler',
      background: '#18181b', color: '#fff'
    });

    if (isConfirmed) {
      try {
        await api.delete(`/courses/${unwrappedParams.id}/students/${studentId}`);
        fetchCourseData();
        Toast.fire({ icon: 'success', title: 'Étudiant exclu avec succès' });
      } catch(e) { Toast.fire({ icon: 'error', title: 'Erreur lors de l\'exclusion' }); }
    }
  };

  const createAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      try {
          await api.post(`/courses/${unwrappedParams.id}/assignments`, {
              title: formData.get('title'),
              description: formData.get('description'),
              dueDate: formData.get('dueDate')
          });
          form.reset();
          fetchCourseData();
          Toast.fire({ icon: 'success', title: 'Devoir créé' });
      } catch(e) { Toast.fire({ icon: 'error', title: 'Erreur' }); }
  };

  const submitWork = async (assignId: number, content: string, file: File | null) => {
      try {
          const formData = new FormData();
          if (content) formData.append('content', content);
          if (file) formData.append('file', file);
          
          await api.post(`/courses/${unwrappedParams.id}/assignments/${assignId}/submit`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          fetchCourseData();
          Toast.fire({ icon: 'success', title: 'Travail rendu !' });
      } catch(e) { Toast.fire({ icon: 'error', title: 'Erreur lors du rendu' }); }
  };

  const gradeSubmission = async (assignId: number, subId: number) => {
    const { value: formValues } = await Swal.fire({
        title: 'Noter le travail',
        html: `
            <input id="swal-grade" type="number" step="1" max="100" placeholder="Note / 100" class="swal2-input">
            <textarea id="swal-feedback" placeholder="Commentaire..." class="swal2-textarea"></textarea>
        `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                grade: (document.getElementById('swal-grade') as HTMLInputElement).value,
                feedback: (document.getElementById('swal-feedback') as HTMLTextAreaElement).value
            }
        }
    });

    if (formValues && formValues.grade) {
        try {
            await api.post(`/courses/${unwrappedParams.id}/assignments/${assignId}/submissions/${subId}/grade`, null, {
                params: { grade: formValues.grade, feedback: formValues.feedback }
            });
            fetchCourseData();
            Toast.fire({ 
                icon: 'success', 
                title: 'Note enregistrée',
                background: '#18181b',
                color: '#fff'
            });
        } catch(e) { Toast.fire({ icon: 'error', title: 'Erreur', background: '#18181b', color: '#fff' }); }
    }
  };

  const markAbsence = async (studentId: number) => {
      const { value: formValues } = await Swal.fire({
          title: 'Marquer une absence',
          html:
            '<input id="swal-date" type="date" class="swal2-input">' +
            '<input id="swal-reason" placeholder="Motif (optionnel)" class="swal2-input">' +
            '<div style="margin-top:20px"><label><input type="checkbox" id="swal-just" /> Abs. Justifiée ?</label></div>',
          focusConfirm: false,
          background: '#18181b', color: '#fff',
          preConfirm: () => {
              return {
                  date: (document.getElementById('swal-date') as HTMLInputElement).value,
                  reason: (document.getElementById('swal-reason') as HTMLInputElement).value,
                  justified: (document.getElementById('swal-just') as HTMLInputElement).checked,
              }
          }
      });
      if (formValues && formValues.date) {
          try {
              await api.post(`/courses/${unwrappedParams.id}/absences`, { student: { id: studentId }, ...formValues });
              fetchCourseData();
              Toast.fire({ icon: 'success', title: 'Absence enregistrée' });
          } catch(e) {
              Toast.fire({ icon: 'error', title: 'Erreur' });
          }
      }
  };

  const deleteAbsence = async (id: number) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Supprimer cette absence ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      background: '#18181b', color: '#fff'
    });

    if (isConfirmed) {
      try {
        await api.delete(`/courses/${unwrappedParams.id}/absences/${id}`);
        fetchCourseData();
        Toast.fire({ icon: 'success', title: 'Absence effacée' });
      } catch(e) { Toast.fire({ icon: 'error', title: 'Erreur' }); }
    }
  };

  if (authLoading || loading) return <div className="pt-40 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

  if (!course) return (
      <div className="pt-40 flex flex-col items-center text-center">
          <ShieldAlert size={64} className="text-red-500 mb-6" />
          <h1 className="text-3xl font-black text-white">Accès Refusé / Introuvable</h1>
          <Link href="/dashboard" className="mt-8 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl">Retour au Campus</Link>
      </div>
  );

  const isTeacherOrAdmin = (user?.role === 'TEACHER' && course.teacher?.id === user?.id) || isAdmin;

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Navigation */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 md:mb-8 font-medium text-sm md:text-base">
          <ArrowLeft size={18} /> <span className="hidden sm:inline">Retour au Campus</span><span className="sm:hidden">Retour</span>
      </Link>

      {/* Header Cover */}
      <div className="w-full h-48 md:h-64 bg-gradient-to-br from-indigo-700 to-purple-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 relative flex flex-col justify-end shadow-2xl mb-8 overflow-hidden group">
          <button 
            onClick={() => {
                navigator.clipboard.writeText(course.joinCode);
                Toast.fire({ icon: 'success', title: 'Code copié !' });
            }}
            className="absolute top-4 right-4 md:top-6 md:right-8 bg-black/30 hover:bg-black/50 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 group/code"
          >
              <Hash size={14} className="text-indigo-400" />
              <span className="text-white font-mono font-black uppercase text-xs md:text-sm">{course.joinCode}</span>
              <Copy size={12} className="text-zinc-500 opacity-0 group-hover/code:opacity-100 transition-opacity ml-1" />
          </button>
          <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-md truncate">{course.title}</h1>
              <p className="text-indigo-200 text-sm md:text-lg font-medium mt-1 md:mt-2 line-clamp-1">{course.description || "Module d'enseignement"}</p>
          </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex items-center gap-6 md:gap-8 border-b border-white/5 mb-8 px-2 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
          <button 
            onClick={() => setTab('STREAM')} 
            className={`pb-4 font-black transition-colors ${tab === 'STREAM' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              Flux
          </button>
          <button 
            onClick={() => setTab('PEOPLE')} 
            className={`pb-4 font-black transition-colors ${tab === 'PEOPLE' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              Participants
          </button>
          <button 
            onClick={() => setTab('FILES')} 
            className={`pb-4 font-black transition-colors ${tab === 'FILES' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              Ressources
          </button>
          <button 
            onClick={() => setTab('CHAT')} 
            className={`pb-4 font-black transition-colors ${tab === 'CHAT' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              Chat
          </button>
          <button 
            onClick={() => setTab('MEET')} 
            className={`pb-4 font-black transition-colors flex items-center gap-2 ${tab === 'MEET' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Visio
          </button>
          <button 
            onClick={() => setTab('QUIZ')} 
            className={`pb-4 font-black transition-colors ${tab === 'QUIZ' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              Quiz
          </button>
          <button 
            onClick={() => setTab('ABSENCES')} 
            className={`pb-4 font-black transition-colors ${tab === 'ABSENCES' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
              Absences
          </button>
          {isTeacherOrAdmin && (
              <>
                  {isAdmin && (
                      <button 
                      onClick={() => setTab('REQUESTS')} 
                      className={`pb-4 font-black transition-colors flex items-center gap-2 ${tab === 'REQUESTS' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                          Demandes {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{pendingRequests.length}</span>}
                      </button>
                  )}
                  <button 
                  onClick={() => setTab('GRADES')} 
                  className={`pb-4 font-black transition-colors ${tab === 'GRADES' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                      Notes
                  </button>
              </>
          )}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
          {tab === 'STREAM' && (
              <motion.div key="stream" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  
                  {isTeacherOrAdmin && (
                      <div className="glass-card p-4 md:p-6 rounded-[2rem] md:rounded-3xl border border-indigo-500/30 flex items-center gap-4 relative overflow-hidden group">
                          <div className="hidden sm:flex w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 items-center justify-center font-black shrink-0 border border-indigo-500/30">
                              {user?.name.charAt(0)}
                          </div>
                          <form onSubmit={postAnnouncement} className="flex-1 flex flex-col gap-3">
                              <div className="flex-1 w-full bg-white text-black rounded-lg overflow-hidden custom-quill-container">
                                  <ReactQuill theme="snow" value={postContent} onChange={setPostContent} className="border-none" />
                              </div>
                              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all text-sm self-end">Publier</button>
                          </form>
                      </div>
                  )}

                  <div className="space-y-6">
                      {posts.map(post => (
                          <div key={post.id} className="glass-card p-8 rounded-3xl border border-white/5 flex flex-col group relative">
                              {post.author.id === user?.id && (
                                  <button onClick={() => deletePost(post.id)} className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                      <Trash2 size={16} />
                                  </button>
                              )}
                              <div className="flex items-center gap-4 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-300 font-bold border border-white/10 shrink-0">
                                      {post.author.name.charAt(0)}
                                  </div>
                                  <div>
                                      <span className="text-white font-bold block">{post.author.name}</span>
                                      <span className="text-zinc-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                                          <Clock size={10} /> {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                                      </span>
                                  </div>
                              </div>
                              <div className="text-zinc-300 font-medium formatted-content" dangerouslySetInnerHTML={{ __html: post.content }}></div>
                          </div>
                      ))}
                      {posts.length === 0 && (
                          <div className="py-20 text-center opacity-50 flex flex-col items-center">
                              <Book size={48} className="text-zinc-600 mb-4" />
                              <p className="text-zinc-500 font-bold italic">Aucune annonce pour ce module.</p>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}

          {tab === 'CHAT' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[600px] flex flex-col glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white font-black text-sm uppercase tracking-widest">Discussion de classe</span>
                      </div>
                      <span className="text-zinc-500 text-xs font-medium">{chatMessages.length} messages</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20" id="chat-scroller">
                      {chatMessages.map((m, idx) => {
                          const isMe = m.sender?.id === user?.id;
                          return (
                              <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                      {!isMe && <span className="text-[10px] text-zinc-500 font-black mb-1 ml-2 uppercase">{m.sender?.name}</span>}
                                      <div className={`px-4 py-2 rounded-[1.5rem] text-sm font-medium ${isMe ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20' : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-white/5'}`}>
                                          {m.content}
                                      </div>
                                      <span className="text-[8px] text-zinc-600 mt-1 mx-2">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                              </div>
                          )
                      })}
                      {chatMessages.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                             <MessageSquare size={40} className="mb-2" />
                             <p>Commencez la discussion...</p>
                          </div>
                      )}
                  </div>

                  <form onSubmit={sendChatMessage} className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
                      <input 
                        name="message" required autoComplete="off"
                        placeholder="Écrivez un message..." 
                        className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl px-6 py-3 text-white outline-none focus:border-indigo-500 transition-all font-medium" 
                      />
                      <button type="submit" className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                          <Send size={20} />
                      </button>
                  </form>
              </motion.div>
          )}

          {tab === 'QUIZ' && (
              <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                   {isTeacherOrAdmin && (
                      <div className="glass-card p-6 rounded-3xl border border-white/10 mb-8">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-black">Gestion des Quiz</h3>
                            <button onClick={createQuiz} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20">Nouveau Quiz</button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {quizzes.map(q => (
                                  <div key={q.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                      <div>
                                          <h4 className="text-white font-bold">{q.title}</h4>
                                          <p className="text-zinc-500 text-[10px]">{q.questions?.length || 0} Questions • {q.timeLimit || 0} min</p>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => editQuiz(q)} className="p-2 text-zinc-400 hover:text-white transition-colors"><PenTool size={16} /></button>
                                          <button onClick={() => deleteQuiz(q.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                      {quizzes.map(q => (
                          <div key={q.id} className="glass-card p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row justify-between gap-8 hover:border-indigo-500/40 transition-all group/card relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                  <HelpCircle size={120} className="text-white -mr-10 -mt-10" />
                              </div>
                              <div className="flex-1 relative z-10">
                                  <div className="flex items-center gap-4 mb-4">
                                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                          <HelpCircle size={28} />
                                      </div>
                                      <div>
                                          <h3 className="text-3xl font-black text-white tracking-tight">{q.title}</h3>
                                          <div className="flex items-center gap-4 mt-1">
                                              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> {q.timeLimit} Min</span>
                                              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5"><ClipboardList size={12} /> {q.questions?.length} Questions</span>
                                          </div>
                                      </div>
                                  </div>
                                  <p className="text-zinc-400 text-base leading-relaxed mb-6 max-w-2xl">{q.description || "Évaluez vos connaissances sur ce module."}</p>
                                  
                                  <div className="flex items-center gap-4">
                                      {q.fileName && (
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); (window as any).dlSub(q.fileName); }}
                                              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-black hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                                          >
                                              <Paperclip size={14} /> Fichier joint
                                          </button>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center relative z-10">
                                  {!isTeacherOrAdmin && (
                                     <button 
                                        onClick={() => {
                                            if (!q.questions || q.questions.length === 0) {
                                                return Toast.fire({ icon: 'info', title: 'Ce quiz n\'a pas encore de questions.' });
                                            }
                                            Swal.fire({
                                                title: q.title,
                                                html: `<div id="quiz-container" class="text-left space-y-10 max-h-[600px] overflow-y-auto px-6 py-8 custom-scrollbar">
                                                    <div class="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center gap-4">
                                                        <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">🕒</div>
                                                        <div>
                                                            <div class="text-indigo-400 font-black uppercase text-[10px] tracking-widest">Temps Limité</div>
                                                            <div class="text-white font-bold">${q.timeLimit} minutes</div>
                                                        </div>
                                                    </div>
                                                    ${q.questions.map((question: any, qIdx: number) => `
                                                        <div class="space-y-4">
                                                            <div class="flex items-start gap-4">
                                                                <span class="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-500/20">${qIdx + 1}</span>
                                                                <p class="text-lg font-bold text-white pt-0.5 leading-tight">${question.text}</p>
                                                            </div>
                                                            <div class="grid grid-cols-1 gap-3 ml-12">
                                                                ${question.type === 'TEXT' ? `
                                                                    <textarea data-qid="${question.id}" data-type="TEXT" placeholder="Saisissez votre réponse ici..." class="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-indigo-500/50 min-h-[100px] shadow-inner"></textarea>
                                                                ` : `
                                                                    ${question.options.map((opt: string, oIdx: number) => `
                                                                        <label class="flex items-center gap-4 p-5 bg-zinc-900/50 border border-white/5 rounded-2xl cursor-pointer hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group active:scale-[0.98]">
                                                                            <input 
                                                                                type="${question.type === 'RADIO' ? 'radio' : 'checkbox'}" 
                                                                                name="q-${question.id}" 
                                                                                data-type="${question.type}"
                                                                                value="${oIdx}" 
                                                                                class="w-5 h-5 accent-indigo-500 rounded-full"
                                                                            >
                                                                            <span class="text-zinc-300 font-medium group-hover:text-white transition-colors">${opt}</span>
                                                                        </label>
                                                                    `).join('')}
                                                                `}
                                                            </div>
                                                        </div>
                                                    `).join('')}
                                                </div>`,
                                                background: '#121214',
                                                color: '#fff',
                                                width: '800px',
                                                confirmButtonText: 'Soumettre mes réponses',
                                                confirmButtonColor: '#6366f1',
                                                showCancelButton: true,
                                                cancelButtonText: 'Abandonner',
                                                preConfirm: () => {
                                                    const answers: any = {};
                                                    q.questions.forEach((question: any) => {
                                                        if (question.type === 'TEXT') {
                                                            const val = (document.querySelector(`textarea[data-qid="${question.id}"]`) as HTMLTextAreaElement).value;
                                                            answers[question.id] = val;
                                                        } else if (question.type === 'RADIO') {
                                                            const selected = (document.querySelector(`input[name="q-${question.id}"]:checked`) as HTMLInputElement);
                                                            if (selected) answers[question.id] = parseInt(selected.value);
                                                        } else if (question.type === 'CHECKBOX') {
                                                            const selected = Array.from(document.querySelectorAll(`input[name="q-${question.id}"]:checked`)).map((el: any) => parseInt(el.value));
                                                            if (selected.length > 0) answers[question.id] = selected;
                                                        }
                                                    });
                                                    
                                                    if (Object.keys(answers).length < q.questions.length) {
                                                        Swal.showValidationMessage('Veuillez répondre à toutes les questions avant de soumettre.');
                                                        return false;
                                                    }
                                                    return answers;
                                                }
                                            }).then(async (result) => {
                                                if (result.isConfirmed) {
                                                    try {
                                                        const res = await api.post(`/courses/${unwrappedParams.id}/quizzes/${q.id}/submit`, result.value);
                                                        const score = res.data.score;
                                                        const totalPoints = res.data.totalPoints;
                                                        const percent = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
                                                        
                                                        if (percent >= 50) {
                                                            confetti({
                                                                particleCount: 200,
                                                                spread: 90,
                                                                origin: { y: 0.6 },
                                                                zIndex: 10000
                                                            });
                                                        }

                                                        const corrections: any[] = res.data.corrections || [];
                                                        const correctionHtml = corrections.map((c: any) => {
                                                            const isCorrect = c.correct;
                                                            const icon = isCorrect ? '✅' : '❌';
                                                            const borderClass = isCorrect
                                                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                                                : 'border-red-500/30 bg-red-500/5';
                                                            
                                                            let studentAnswerDisplay = c.studentAnswer || '—';
                                                            let correctAnswerDisplay = '';
                                                            
                                                            if (c.type !== 'TEXT' && c.options && c.correctAnswers) {
                                                                const correctOpts = c.correctAnswers.map((idx: number) => c.options[idx]).join(', ');
                                                                correctAnswerDisplay = correctOpts || '—';
                                                                // Convertir l'index étudiant en texte
                                                                try {
                                                                    const parsed = JSON.parse('[' + c.studentAnswer + ']');
                                                                    studentAnswerDisplay = parsed.map((idx: number) => c.options[idx]).filter(Boolean).join(', ') || c.studentAnswer;
                                                                } catch {
                                                                    if (!isNaN(parseInt(c.studentAnswer))) {
                                                                        studentAnswerDisplay = c.options[parseInt(c.studentAnswer)] || c.studentAnswer;
                                                                    }
                                                                }
                                                            } else if (c.type === 'TEXT') {
                                                                correctAnswerDisplay = c.correctText || '—';
                                                            }

                                                            return `
                                                                <div class="p-4 rounded-2xl border ${borderClass} mb-3">
                                                                    <div class="flex items-start justify-between gap-3 mb-2">
                                                                        <p class="text-white font-bold text-sm leading-snug flex-1">${icon} ${c.questionText}</p>
                                                                        <span class="text-xs font-black whitespace-nowrap ${isCorrect ? 'text-emerald-400' : 'text-red-400'}">${c.earnedPoints}/${c.points} pts</span>
                                                                    </div>
                                                                    ${!isCorrect ? `
                                                                        <div class="mt-2 space-y-1 pl-4 border-l-2 border-red-500/30">
                                                                            <p class="text-red-400 text-xs"><span class="font-black">Votre réponse :</span> ${studentAnswerDisplay}</p>
                                                                            <p class="text-emerald-400 text-xs"><span class="font-black">Bonne réponse :</span> ${correctAnswerDisplay}</p>
                                                                        </div>
                                                                    ` : `
                                                                        <p class="text-emerald-400 text-xs pl-4 border-l-2 border-emerald-500/30"><span class="font-black">Réponse :</span> ${studentAnswerDisplay} ✓</p>
                                                                    `}
                                                                </div>
                                                            `;
                                                        }).join('');
                                                        
                                                        Swal.fire({
                                                            title: 'Résultats calculés !',
                                                            html: `
                                                                <div class="py-6 text-center">
                                                                    <div class="inline-block p-6 rounded-full ${percent >= 50 ? 'bg-emerald-500/10' : 'bg-red-500/10'} mb-4">
                                                                        <div class="text-7xl font-black ${percent >= 50 ? 'text-emerald-500' : 'text-red-500'} tracking-tighter">${score} / ${totalPoints}</div>
                                                                    </div>
                                                                    <div class="text-zinc-500 font-black uppercase tracking-[0.2em] text-xs mb-2">Score Final</div>
                                                                    <div class="max-w-[300px] mx-auto h-3 bg-zinc-800 rounded-full overflow-hidden shadow-inner mb-6">
                                                                        <div class="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-1000 ease-out" style="width: ${percent}%"></div>
                                                                    </div>
                                                                    <div class="text-left max-h-[350px] overflow-y-auto custom-scrollbar mt-4">
                                                                        <p class="text-xs text-zinc-500 uppercase font-black tracking-widest mb-3">Correction Détaillée</p>
                                                                        ${correctionHtml}
                                                                    </div>
                                                                </div>
                                                            `,
                                                            background: '#121214',
                                                            color: '#fff',
                                                            width: '750px',
                                                            confirmButtonText: 'Continuer',
                                                            confirmButtonColor: '#6366f1'
                                                        });
                                                    } catch (e) {
                                                        Toast.fire({ icon: 'error', title: 'Erreur lors de la soumission' });
                                                    }
                                                }
                                            });
                                        }}
                                        className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center gap-3 active:scale-95"
                                     >
                                         Passer le test <MoveRight size={20} />
                                     </button>
                                  )}
                              </div>
                          </div>
                      ))}
                      {quizzes.length === 0 && (
                          <div className="py-20 text-center opacity-50 flex flex-col items-center">
                              <HelpCircle size={48} className="text-zinc-600 mb-4" />
                              <p className="text-zinc-500 font-bold italic">Aucun quiz disponible pour le moment.</p>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}

          {tab === 'MEET' && (
              <motion.div key="meet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[700px] flex flex-col glass-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-white font-black text-sm uppercase tracking-widest">Classe Virtuelle en Direct</span>
                      </div>
                      <span className="text-zinc-500 text-xs font-medium">Propulsé par Jitsi</span>
                  </div>
                  
                  <div className="flex-1 w-full bg-black">
                      <iframe 
                          src={`https://meet.jit.si/SupNumCampus-${unwrappedParams.id}-${course.joinCode}#userInfo.displayName="${user?.name}"`} 
                          allow="camera; microphone; fullscreen; display-capture; autoplay"
                          className="w-full h-full border-none"
                      ></iframe>
                  </div>
              </motion.div>
          )}

          {tab === 'PEOPLE' && (
              <motion.div key="people" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                  <div>
                      <h2 className="text-4xl font-black text-indigo-400 tracking-tighter mb-6 pb-4 border-b border-indigo-500/20">Enseignant</h2>
                      <div className="flex items-center gap-4 p-4 pl-0">
                          <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/30">
                              {course.teacher.name.charAt(0)}
                          </div>
                          <span className="text-white font-bold text-lg">{course.teacher.name}</span>
                      </div>
                  </div>

                  <div>
                      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
                           <h2 className="text-4xl font-black text-purple-400 tracking-tighter">Camarades</h2>
                           <span className="text-purple-400 font-black text-xl">{course.enrolledUsers.length} étudiants</span>
                      </div>
                      
                      <div className="space-y-2">
                          {course.enrolledUsers.map((u: any) => (
                              <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 pl-0 border-b border-white/[0.02] hover:bg-white/[0.02] rounded-xl transition-colors">
                                   <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center font-bold shrink-0">
                                           {u.name.charAt(0)}
                                       </div>
                                       <div>
                                           <span className="text-white font-medium block">{u.name}</span>
                                           <span className="text-zinc-500 text-xs">Étudiant</span>
                                       </div>
                                   </div>
                                   {isTeacherOrAdmin && (
                                       <div className="flex items-center gap-2">
                                           <button onClick={() => markAbsence(u.id)} className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                                               <Users size={14} /> Absence
                                           </button>
                                           <button onClick={() => kickStudent(u.id, u.name)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors" title="Retirer du cours">
                                               <UserMinus size={18} />
                                           </button>
                                       </div>
                                   )}
                               </div>
                          ))}
                          {course.enrolledUsers.length === 0 && <p className="text-zinc-500 italic py-4">Il n'y a pas encore d'étudiants inscrits.</p>}
                      </div>
                  </div>
              </motion.div>
          )}
          {tab === 'FILES' && (
              <motion.div key="files" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {isTeacherOrAdmin && (
                      <div className="glass-card p-6 rounded-3xl border border-white/10 mb-8">
                          <div className="flex items-center justify-between mb-6">
                              <h3 className="text-white font-black">Ajouter une Ressource</h3>
                              <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
                                  <button onClick={() => setFileType('LINK')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${fileType === 'LINK' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Lien</button>
                                  <button onClick={() => setFileType('FILE')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${fileType === 'FILE' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Fichier PC</button>
                              </div>
                          </div>
                          <form onSubmit={addFile} className="flex flex-col md:flex-row gap-4">
                              <input name="title" required placeholder="Titre (ex: TP1 - Java)" className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
                              {fileType === 'LINK' ? (
                                  <input name="url" required type="url" placeholder="Lien HTTP (Drive, GitHub...)" className="flex-[2] bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" />
                              ) : (
                                  <input name="file" required type="file" className="flex-[2] bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white file:hidden cursor-pointer outline-none focus:border-purple-500" />
                              )}
                              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap">Ajouter</button>
                          </form>
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {files.map(f => (
                          <div key={f.id} className="glass-card p-6 rounded-2xl border border-white/5 flex items-start gap-4 group hover:border-purple-500/30 transition-all">
                              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                                  <FileText size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  {f.local ? (
                                      <button onClick={() => downloadFile(f.id, f.title, f.url)} className="text-white font-bold block truncate hover:text-purple-400 transition-colors uppercase tracking-tight text-left">
                                          {f.title} <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded ml-2">PDF/DOC</span>
                                      </button>
                                  ) : (
                                      <a href={f.url} target="_blank" rel="noreferrer" className="text-white font-bold block truncate hover:text-purple-400 transition-colors uppercase tracking-tight">{f.title}</a>
                                  )}
                                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1.5">{new Date(f.addedAt).toLocaleDateString()}</p>
                              </div>
                              {isTeacherOrAdmin && (
                                  <button onClick={() => deleteFile(f.id)} className="p-2 text-zinc-600 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                      <Trash2 size={16} />
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
                  {files.length === 0 && (
                      <div className="py-20 text-center opacity-50 flex flex-col items-center">
                          <FileText size={48} className="text-zinc-600 mb-4" />
                          <p className="text-zinc-500 font-bold italic">Aucun document n'a été partagé.</p>
                      </div>
                  )}
              </motion.div>
          )}

          {false && (
              <div />
          )}

          {tab === 'ABSENCES' && (
              <motion.div key="abs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {!isTeacherOrAdmin && <h3 className="text-2xl font-black text-white mb-6">Mon carnet d'absences</h3>}
                  {isTeacherOrAdmin && <h3 className="text-2xl font-black text-white mb-6">Registre des Absences</h3>}

                  {absences.map(abs => (
                      <div key={abs.id} className="flex items-center justify-between p-4 bg-zinc-950/50 border border-white/5 rounded-2xl hover:bg-zinc-900 transition-all">
                          <div>
                              <div className="flex items-center gap-3">
                                  {isTeacherOrAdmin && <span className="text-white font-bold">{abs.student.name}</span>}
                                  {!isTeacherOrAdmin && <span className="text-white font-bold opacity-50">Vous</span>}
                                  <span className="text-zinc-500">&bull;</span>
                                  <span className="text-zinc-400 font-mono text-sm">{abs.date}</span>
                                  {abs.justified ? (
                                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] uppercase font-black rounded">Justifiée</span>
                                  ) : (
                                      <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] uppercase font-black rounded">Non Justifiée</span>
                                  )}
                              </div>
                              {abs.reason && <p className="text-zinc-500 text-sm mt-1">{abs.reason}</p>}
                          </div>
                          {isTeacherOrAdmin && (
                              <button onClick={() => deleteAbsence(abs.id)} className="p-2 text-zinc-600 hover:text-red-500 rounded-lg transition-all">
                                  <Trash2 size={16} />
                              </button>
                          )}
                      </div>
                  ))}
                  {absences.length === 0 && (
                      <p className="text-zinc-500 italic text-center py-10">Aucune absence enregistrée.</p>
                  )}
              </motion.div>
          )}

          {tab === 'REQUESTS' && isTeacherOrAdmin && (
              <motion.div key="req" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <h3 className="text-2xl font-black text-white mb-6">Demandes d'inscription ({pendingRequests.length} en attente)</h3>
                  {requests.map(req => (
                      <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card border border-white/10 rounded-2xl">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                                  {req.student.name.charAt(0)}
                              </div>
                              <div>
                                  <span className="text-white font-bold block">{req.student.name}</span>
                                  <span className="text-zinc-500 text-xs font-mono">{req.student.email}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              {req.status === 'PENDING' ? (
                                  isAdmin ? (
                                      <>
                                          <button onClick={() => handleRequest(req.id, true)} className="px-6 py-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                                              <CheckCircle size={16} /> Accepter
                                          </button>
                                          <button onClick={() => handleRequest(req.id, false)} className="px-6 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                                              <XCircle size={16} /> Refuser
                                          </button>
                                      </>
                                  ) : (
                                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Attente Admin</span>
                                  )
                              ) : (
                                  <span className={`px-4 py-1 rounded text-xs font-black uppercase ${req.status === 'ACCEPTED' ? 'text-green-500' : 'text-red-500'}`}>
                                      {req.status === 'ACCEPTED' ? 'Accepté' : 'Refusé'}
                                  </span>
                              )}
                          </div>
                      </div>
                  ))}
                  {requests.length === 0 && (
                      <p className="text-zinc-500 italic text-center py-10">Aucune demande reçue.</p>
                  )}
              </motion.div>
          )}

          {tab === 'GRADES' && isTeacherOrAdmin && (
              <motion.div key="grades" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
                  <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                      <div className="p-8 border-b border-white/5 bg-indigo-500/5 flex items-center justify-between">
                          <h2 className="text-3xl font-black text-white tracking-tighter">Récapitulatif des Notes</h2>
                          <div className="bg-indigo-500/20 text-indigo-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Temps Réel</div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Étudiant</th>
                                    {gradeReport?.quizTitles.map((title: string) => (
                                        <th key={title} className="px-6 py-4 text-[10px] font-black text-purple-400 uppercase tracking-widest border-b border-white/5 min-w-[150px]">
                                            Quiz: {title}
                                        </th>
                                    ))}
                                    {gradeReport?.assignmentTitles.map((title: string) => (
                                        <th key={title} className="px-6 py-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 min-w-[150px]">
                                            Devoir: {title}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {gradeReport?.students.map((student: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/5">
                                        <td className="px-6 py-5 font-bold text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-xs flex items-center justify-center border border-white/5">{student.name.charAt(0)}</div>
                                            {student.name}
                                        </td>
                                        {gradeReport?.quizTitles.map((title: string) => {
                                            const score = student.quizScores[title];
                                            return (
                                                <td key={title} className="px-6 py-5">
                                                    {score !== undefined ? (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${score >= 10 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {score}/20
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-600 italic text-xs">N/A</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        {gradeReport?.assignmentTitles.map((title: string) => {
                                            const grade = student.assignmentGrades[title];
                                            return (
                                                <td key={title} className="px-6 py-5">
                                                    {grade !== undefined ? (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${grade >= 50 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                            {grade}/100
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-600 italic text-xs">Pas de note</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                      
                      {(!gradeReport || gradeReport.students.length === 0) && (
                          <div className="py-20 text-center text-zinc-500 italic">
                             Aucun étudiant inscrit pour le moment.
                          </div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
}
