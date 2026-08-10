import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui';
import { Users, Truck, Package, ShieldCheck, AlertTriangle, Settings, HelpCircle, LogOut, ArrowLeft, Building2 } from 'lucide-react';
import { EquipmentModule } from '../components/modules/EquipmentModule';
import { MaterialModule } from '../components/modules/MaterialModule';
import { QualityModule } from '../components/modules/QualityModule';
import { SafetyModule } from '../components/modules/SafetyModule';
import { SettingsModule } from '../components/modules/SettingsModule';
import { CompanyModule } from '../components/modules/CompanyModule';
import { LabourTracking } from '../components/LabourTracking';
import { useAppContext } from '../context/AppContext';

export function More() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { projects } = useAppContext();
  const currentProjectId = projects[0]?.id || '';

  const menuItems = [
    { id: 'labour', icon: Users, label: 'Labour Management', color: 'text-blue-500' },
    { id: 'equipment', icon: Truck, label: 'Equipment Tracking', color: 'text-orange-500' },
    { id: 'material', icon: Package, label: 'Material Management', color: 'text-purple-500' },
    { id: 'quality', icon: ShieldCheck, label: 'Quality & QA/QC', color: 'text-green-500' },
    { id: 'safety', icon: AlertTriangle, label: 'Safety & HSE', color: 'text-red-500' },
    { id: 'company', icon: Building2, label: 'Company Profile', color: 'text-indigo-500' },
  ];

  const systemItems = [
    { id: 'settings', icon: Settings, label: 'Settings', color: 'text-slate-500' },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', color: 'text-slate-500' },
    { id: 'logout', icon: LogOut, label: 'Logout', color: 'text-slate-500' },
  ];

  if (activeModule === 'equipment') {
    return (
      <div className="p-4 md:p-8">
        <EquipmentModule onBack={() => setActiveModule(null)} />
      </div>
    );
  }

  if (activeModule === 'material') {
    return (
      <div className="p-4 md:p-8">
        <MaterialModule onBack={() => setActiveModule(null)} />
      </div>
    );
  }

  if (activeModule === 'quality') {
    return (
      <div className="p-4 md:p-8">
        <QualityModule onBack={() => setActiveModule(null)} />
      </div>
    );
  }

  if (activeModule === 'safety') {
    return (
      <div className="p-4 md:p-8">
        <SafetyModule onBack={() => setActiveModule(null)} />
      </div>
    );
  }

  if (activeModule === 'settings') {
    return (
      <div className="p-4 md:p-8">
        <SettingsModule onBack={() => setActiveModule(null)} />
      </div>
    );
  }

  if (activeModule === 'company') {
    return (
      <div className="p-4 md:p-8 flex flex-col gap-4">
        <CompanyModule onBack={() => setActiveModule(null)} />
      </div>
    );
  }

  if (activeModule === 'labour') {
    return (
      <div className="p-4 md:p-8 flex flex-col gap-4">
        <button
          onClick={() => setActiveModule(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Modules
        </button>
        <LabourTracking projectId={currentProjectId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">More Modules</h1>
        <p className="text-slate-500 dark:text-slate-400">Access specialized site management tools.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">Open</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-4 px-2">System</h2>
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {systemItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left opacity-75"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

