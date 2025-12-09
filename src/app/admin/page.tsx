'use client';

import { useState, useEffect } from 'react';
import AdminPanel from '@/components/AdminPanel';
import LoginForm from '@/components/LoginForm';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import './admin-fix.css';

export default function Admin() {
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  
  // Prevenir scroll horizontal - SOLUCIÓN SIMPLE
  useEffect(() => {
    document.documentElement.setAttribute('data-page', 'admin');
    document.body.setAttribute('data-page', 'admin');
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.maxWidth = '100vw';
    document.body.style.maxWidth = '100vw';
    
    return () => {
      document.documentElement.removeAttribute('data-page');
      document.body.removeAttribute('data-page');
      document.documentElement.style.overflowX = '';
      document.body.style.overflowX = '';
      document.documentElement.style.maxWidth = '';
      document.body.style.maxWidth = '';
    };
  }, []);

  const handleLogin = () => {
    // Simplemente recargar la página para actualizar el estado
    window.location.reload();
  };

  if (isLoading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50 flex items-center justify-center overflow-x-hidden w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
    </div>
  );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <AdminPanel onLogout={logout} />;
}
