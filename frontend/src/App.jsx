import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './utils/auth';
import Layout from './pages/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Artifacts from './pages/Artifacts';
import Donors from './pages/Donors';
import Halls from './pages/Halls';
import Exhibitions from './pages/Exhibitions';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import HelpAdmin from './pages/Help';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="artifacts"   element={<Artifacts />} />
          <Route path="donors"      element={<Donors />} />
          <Route path="halls"       element={<Halls />} />
          <Route path="exhibitions" element={<Exhibitions />} />
          <Route path="loans"       element={<Loans />} />
          <Route path="reports"     element={<Reports />} />
          <Route path="categories"  element={<Categories />} />
          <Route path="help-admin"  element={<HelpAdmin />} />
          <Route path="users"       element={<Users />} />
          <Route path="auditlog"    element={<AuditLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
