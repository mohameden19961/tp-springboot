'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

interface User {
  id: number;
  name: string;
  email: string;
  picture?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSession = async () => {
    try {
      const response = await api.get('/api/auth/token');
      if (response.data.access_token) {
        const token = response.data.access_token;
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        
        // Decode role
        const decoded: any = jwtDecode(token);
        const role = decoded.role;
        
        setUser({ ...response.data.user, role });
        setIsAdmin(role === 'ADMIN');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Session fetch failed', error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAdmin(false);
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Déconnecté avec succès',
      showConfirmButton: false,
      timer: 2000,
      background: '#18181b',
      color: '#fff'
    });
    
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
