import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui';
import { Users, Truck, Package, ShieldCheck, AlertTriangle, Settings, HelpCircle, LogOut, ArrowLeft, Building2, History, Layers, Home, BarChart3 } from 'lucide-react';
import { EquipmentModule } from '../components/modules/EquipmentModule';
import { MaterialModule } from '../components/modules/MaterialModule';
import { QualityModule } from '../components/modules/QualityModule';
import { SafetyModule } from '../components/modules/SafetyModule';
import { SettingsModule } from '../components/modules/SettingsModule';
import { CompanyModule } from '../components/modules/CompanyModule';
import { ActivityLogsModule } from '../components/modules/ActivityLogsModule';
import { ResourceAllocationModule } from '../components/modules/ResourceAllocationModule';
import { HelpSupportModule } from '../components/modules/HelpSupportModule';
import { AccommodationModule } from '../components/modules/AccommodationModule';
import { LabourTracking } from '../components/LabourTracking';
import { useAppContext } from '../context/AppContext';
import { ProjectSectionPermissions } from '../types';

export function More() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { projects, hasPermission, logout } = useAppContext();
  const currentProjectId = projects[0]?.id || '';

  const allMenuItems = [
    { id: 'analytics', icon: BarChart3, label: 'Visual Analytics & Progress Charts', color: 'text-[#0B5FFF]' },
    { id: 'allocations', icon: Layers, label: 'Resource Allocation Tracking', color: 'text-[#0B5FFF]', section: 'activities' as keyof ProjectSectionPermissions },
    { id: 'labour', icon: Users, label: 'Labour Management', color: 'text-blue-500', section: 'labour' as keyof ProjectSectionPermissions },
    { id: 'equipment', icon: Truck, label: 'Equipment Tracking', color: 'text-orange-500', section: 'equipment' as keyof ProjectSectionPermissions },
    { id: 'accommodation', icon: Home, label: 'Accommodation & Camp Hub', color: 'text-indigo-500', section: 'labour' as keyof ProjectSectionPermissions },
    { id: 'material', icon: Package, label: 'Material Management', color: 'text-purple-500', section: 'materials' as keyof ProjectSectionPermissions },
    { id: 'quality', icon: ShieldCheck, label: 'Quality & QA/QC', color: 'text-green-500', section: 'quality' as keyof ProjectSectionPermissions },
    { id: 'safety', icon: AlertTriangle, label: 'Safety & HSE', color: 'text-red-500', section: 'safety' as keyof ProjectSectionPermissions },
    { id: 'audit', icon: History, label: 'Activity & Audit Logs', color: 'text-cyan-500' },
    { id: 'company', icon: Building2, label: 'Company Profile', color: 'text-indigo-500' },
  ];

  const menuItems = allMenuItems.filter(item => !item.section || hasPermission(item.section));

  const systemItems = [
    { id: 'settings', icon: Settings, label: 'Settings & System Preferences', color: 'text-blue-500' },
    { id: 'help', icon: HelpCircle, label: 'Help & Support Center', color: 'text-emerald-500' },
    { id: 'logout', icon: LogOut, label: 'Logout / Switch Account', color: 'text-rose-500' },
  ];

  if (activeModule === 'allocations') {
    return (
      <div className="p-4 md:p-8">
        <ResourceAllocationModule
          onBack={() => setActiveModule(null)}
        />
      </div>
    );
  }

  if (activeModule === 'equipment') {
    return (
      <div className="p-4 md:p-8">
        <EquipmentModule onBack={() => setActiveModule(null)} />
      </div>
    );
  }

  if (activeModule === 'accommodation') {
    return (
      <div className="p-4 md:p-8">
        <AccommodationModule onBack={() => setActiveModule(null)} />
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

  if (activeModule === 'audit') {
    return (
      <div className="p-4 md:p-8">
        <ActivityLogsModule onBack={() => setActiveModule(null)} />
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

  if (activeModule === 'help') {
    return (
      <div className="p-4 md:p-8">
        <HelpSupportModule onBack={() => setActiveModule(null)} />
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
        <p className="text-slate-500 dark:text-slate-400">Access specialized site management and system tools.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'analytics') {
                      navigate('/analytics');
                    } else {
                      setActiveModule(item.id);
                    }
                  }}
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
                  onClick={() => {
                    if (item.id === 'logout') {
                      logout();
                    } else {
                      setActiveModule(item.id);
                    }
                  }}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {item.id === 'logout' ? 'Sign Out' : 'Open'}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

