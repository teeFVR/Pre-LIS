import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api/supabaseClient';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterSample from './pages/RegisterSample';
import Samples from './pages/Samples';
import Settings from './pages/Settings';
import Batches from './pages/Batches';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './auth/ProtectedRoute';

export default function App() {
  const [session, setSession] = useState(api.getCurrentSession());
  const [theme, setTheme] = useState(localStorage.getItem('pre_lis_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('pre_lis_theme', theme);
  }, [theme]);

  // Background sync when coming online
  useEffect(() => {
    const handleOnline = () => {
      api.syncPending().then(({ synced }) => {
        if (synced > 0) console.info(`[Pre-LIS] Synced ${synced} pending samples to Supabase`);
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const handleLoginSuccess = (s) => setSession(s);
  const handleLogout = () => setSession(null);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {session && (
          <Navbar
            session={session}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        <div style={{ display: 'flex', flex: 1 }}>
          {session && <Sidebar session={session} />}

          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard session={session} /></ProtectedRoute>} />
              <Route path="/register" element={<ProtectedRoute><RegisterSample session={session} /></ProtectedRoute>} />
              <Route path="/samples" element={<ProtectedRoute><Samples session={session} /></ProtectedRoute>} />
              <Route path="/batches" element={<ProtectedRoute><Batches session={session} /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
