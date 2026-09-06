import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthGuard } from './components/AuthGuard';

const Overview = lazy(() => import('./pages/Overview').then(m => ({ default: m.Overview })));
const LiveTraffic = lazy(() => import('./pages/LiveTraffic').then(m => ({ default: m.LiveTraffic })));
const Incidents = lazy(() => import('./pages/Incidents').then(m => ({ default: m.Incidents })));
const APIs = lazy(() => import('./pages/APIs').then(m => ({ default: m.APIs })));
const Scanner = lazy(() => import('./pages/Scanner').then(m => ({ default: m.Scanner })));
const Endpoints = lazy(() => import('./pages/Endpoints').then(m => ({ default: m.Endpoints })));
const Threats = lazy(() => import('./pages/Threats').then(m => ({ default: m.Threats })));
const Policies = lazy(() => import('./pages/Policies').then(m => ({ default: m.Policies })));
const OwaspCoverage = lazy(() => import('./pages/OwaspCoverage').then(m => ({ default: m.OwaspCoverage })));

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthGuard>
            <Suspense fallback={<div className="flex h-screen items-center justify-center text-[#A1A1AA] bg-[#0A0A0A]">Loading modules...</div>}>
              <Routes>
                <Route path="/" element={<AppShell />}>
                  <Route index element={<Overview />} />
                  <Route path="traffic" element={<LiveTraffic />} />
                  <Route path="incidents" element={<Incidents />} />
                  <Route path="apis" element={<APIs />} />
                  <Route path="scanner" element={<Scanner />} />
                  <Route path="endpoints" element={<Endpoints />} />
                  <Route path="threats" element={<Threats />} />
                  <Route path="policies" element={<Policies />} />
                  <Route path="owasp" element={<OwaspCoverage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthGuard>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
