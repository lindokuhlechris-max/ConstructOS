/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
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
import RemindersModule from './components/modules/RemindersModule';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="activities" element={<Activities />} />
            <Route path="employees" element={<Employees />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="projects" element={<Projects />} />
            <Route path="reports" element={<Reports />} />
            <Route path="materials" element={<Materials />} />
            <Route path="quality" element={<QualityPage />} />
            <Route path="safety" element={<Safety />} />
            <Route path="reminders" element={<RemindersModule />} />
            <Route path="more" element={<More />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
