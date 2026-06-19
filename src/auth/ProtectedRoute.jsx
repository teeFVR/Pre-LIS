import React from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/supabaseClient';

export default function ProtectedRoute({ children }) {
  const session = api.getCurrentSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
