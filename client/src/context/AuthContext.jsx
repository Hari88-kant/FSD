import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    const token = localStorage.getItem('smart_eb_token');
    if (!token) {
      setUser(null);
      setTechnicianProfile(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest('/auth/me');
      setUser(data.user);
      setTechnicianProfile(data.technicianProfile || null);
    } catch {
      localStorage.removeItem('smart_eb_token');
      setUser(null);
      setTechnicianProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshProfile();
  }, []);

  async function login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('smart_eb_token', data.token);
    setUser(data.user);
    setTechnicianProfile(data.technicianProfile || null);
    return data.user;
  }

  async function register(payload) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    localStorage.setItem('smart_eb_token', data.token);
    setUser(data.user);
    setTechnicianProfile(data.technicianProfile || null);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('smart_eb_token');
    setUser(null);
    setTechnicianProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        technicianProfile,
        setTechnicianProfile,
        loading,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
