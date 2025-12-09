import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

interface Admin {
  id: string;
  username: string;
  email: string;
  last_login: string | null;
}

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const authToken = localStorage.getItem('frantana_admin_token');
    const adminData = localStorage.getItem('frantana_admin_data');
    
    if (authToken && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing admin data:', error);
        clearAuth();
      }
    }
    setIsLoading(false);
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Buscar administrador en la base de datos
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !adminData) {
        throw new Error('Credenciales incorrectas');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, adminData.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Credenciales incorrectas');
      }

      // Actualizar último login
      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminData.id);

      // Crear token de sesión (simple, en producción usar JWT)
      const sessionToken = generateSessionToken();
      
      // Guardar en localStorage
      localStorage.setItem('frantana_admin_token', sessionToken);
      localStorage.setItem('frantana_admin_data', JSON.stringify({
        id: adminData.id,
        username: adminData.username,
        email: adminData.email,
        last_login: adminData.last_login
      }));

      setAdmin({
        id: adminData.id,
        username: adminData.username,
        email: adminData.email,
        last_login: adminData.last_login
      });
      
      setIsAuthenticated(true);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!admin) {
        throw new Error('No hay sesión activa');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      }

      // Verificar contraseña actual
      const { data: adminData, error: fetchError } = await supabase
        .from('admins')
        .select('password_hash')
        .eq('id', admin.id)
        .eq('is_active', true)
        .single();

      if (fetchError || !adminData) {
        throw new Error('Error al verificar la sesión');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, adminData.password_hash);
      
      if (!isValidPassword) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Generar nuevo hash para la contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña en la base de datos
      const { error: updateError } = await supabase
        .from('admins')
        .update({ password_hash: newPasswordHash })
        .eq('id', admin.id);

      if (updateError) {
        throw new Error('Error al actualizar la contraseña');
      }

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setAdmin(null);
  };

  const clearAuth = () => {
    localStorage.removeItem('frantana_admin_token');
    localStorage.removeItem('frantana_admin_data');
  };

  const generateSessionToken = () => {
    // Generar token simple (en producción usar JWT con firma)
    return btoa(JSON.stringify({
      adminId: Date.now(),
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2)
    }));
  };

  return {
    isAuthenticated,
    admin,
    isLoading,
    login,
    logout,
    changePassword
  };
};

