/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Activities } from './pages/Activities';
import { Projects } from './pages/Projects';
import { Reports } from './pages/Reports';
import { Safety } from './pages/Safety';
import { More } from './pages/More';
import { Materials } from './pages/Materials';
import { QualityPage } from './pages/QualityPage';
import { SettingsPage } from './pages/SettingsPage';
import { Employees } from './pages/Employees';
import { Equipment } from './pages/Equipment';
import { Accommodation } from './pages/Accommodation';
import { Documents } from './pages/Documents';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { ResourceAllocationPage } from './pages/ResourceAllocationPage';
import { ProjectAnalyticsPage } from './pages/ProjectAnalyticsPage';
import RemindersModule from './components/modules/RemindersModule';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<ProjectAnalyticsPage />} />
            <Route path="visual-analytics" element={<ProjectAnalyticsPage />} />
            <Route path="activities" element={
              <ProtectedRoute requiredSection="activities"><Activities /></ProtectedRoute>
            } />
            <Route path="allocations" element={
              <ProtectedRoute requiredSection="activities"><ResourceAllocationPage /></ProtectedRoute>
            } />
            <Route path="documents" element={
              <ProtectedRoute requiredSection="documents"><Documents /></ProtectedRoute>
            } />
            <Route path="employees" element={
              <ProtectedRoute requiredSection="labour"><Employees /></ProtectedRoute>
            } />
            <Route path="equipment" element={
              <ProtectedRoute requiredSection="equipment"><Equipment /></ProtectedRoute>
            } />
            <Route path="accommodation" element={
              <ProtectedRoute requiredSection="labour"><Accommodation /></ProtectedRoute>
            } />
            <Route path="projects" element={<Projects />} />
            <Route path="reports" element={
              <ProtectedRoute requiredSection="reports"><Reports /></ProtectedRoute>
            } />
            <Route path="daily-report" element={
              <ProtectedRoute requiredSection="reports"><Reports /></ProtectedRoute>
            } />
            <Route path="materials" element={
              <ProtectedRoute requiredSection="materials"><Materials /></ProtectedRoute>
            } />
            <Route path="quality" element={
              <ProtectedRoute requiredSection="quality"><QualityPage /></ProtectedRoute>
            } />
            <Route path="safety" element={
              <ProtectedRoute requiredSection="safety"><Safety /></ProtectedRoute>
            } />
            <Route path="reminders" element={<RemindersModule />} />
            <Route path="activity-logs" element={<ActivityLogsPage />} />
            <Route path="more" element={<More />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

