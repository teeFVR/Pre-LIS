import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api/supabaseClient';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterSample from './pages/RegisterSample';
import Samples from './pages/Samples';
import Settings from './pages/Settings';
import Batches from './pages/Batches';
import UsersAdmin from './pages/UsersAdmin';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './auth/ProtectedRoute';

export default function App() {
  const [session, setSession] = useState(api.getCurrentSession());
  const [theme, setTheme] = useState(localStorage.getItem('pre_lis_theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('pre_lis_theme', theme);
  }, [theme]);

  // Check session expiry every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (session && !api.getCurrentSession()) {
        setSession(null);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

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
  const handleLogout = async () => { await api.logout(); setSession(null); };

  // Close sidebar when navigating (mobile)
  const handleNavClick = () => setSidebarOpen(false);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {session && (
          <Navbar
            session={session}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
            onMenuToggle={() => setSidebarOpen(prev => !prev)}
          />
        )}

        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          {session && (
            <Sidebar
              session={session}
              isOpen={sidebarOpen}
              onNavClick={handleNavClick}
            />
          )}

          {/* Backdrop — mobile only, closes sidebar when tapped */}
          {session && sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'none',
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.5)',
              }}
              className="sidebar-backdrop"
            />
          )}

          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard session={session} /></ProtectedRoute>} />
              <Route path="/register" element={<ProtectedRoute><RegisterSample session={session} /></ProtectedRoute>} />
              <Route path="/samples" element={<ProtectedRoute><Samples session={session} /></ProtectedRoute>} />
              <Route path="/batches" element={<ProtectedRoute><Batches session={session} /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><UsersAdmin session={session} /></ProtectedRoute>} />
              <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .sidebar-backdrop { display: block !important; }
          }
        `}</style>
      </div>
    </BrowserRouter>
  );
}