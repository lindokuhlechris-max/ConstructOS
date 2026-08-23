import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FolderKanban, 
  FileBarChart, 
  FileText,
  Menu, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Package, 
  Users, 
  Truck, 
  Sun, 
  Moon, 
  CloudSun,
  Droplets,
  Wind,
  ArrowRight,
  UserPlus, 
  Settings as SettingsIcon, 
  Check, 
  X,
  UserCheck,
  Bell,
  ChevronDown,
  Building2,
  LogOut,
  Zap,
  History,
  Layers,
  Home,
  BarChart3
} from 'lucide-react';
import { cn } from '../ui';
import { useAppContext } from '../../context/AppContext';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { ProjectDetailScreen } from '../ProjectDetailScreen';
import { SyncConflictModal } from '../SyncConflictModal';
import { LoginScreen } from '../LoginScreen';
import { UserProfile, UserRole, Reminder } from '../../types';
import { registerServiceWorker, checkDueReminders } from '../../lib/reminderNotificationService';

export function AppLayout() {
  const { 
    activities, 
    projects, 
    weatherLogs,
    theme, 
    setTheme, 
    currentUserProfile, 
    setCurrentUserProfile, 
    hasPermission,
    userProfiles, 
    addProfile,
    reminders,
    syncConflict,
    resolveSyncConflict,
    setSyncConflict,
    isAuthenticated,
    logout
  } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [isProjectExpanded, setIsProjectExpanded] = useState(false);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [activeReminderToast, setActiveReminderToast] = useState<Reminder | null>(null);

  const latestWeather = weatherLogs && weatherLogs.length > 0 ? weatherLogs[0] : null;

  // Close side menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSideMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Service Worker and set up periodic reminder checking
  useEffect(() => {
    registerServiceWorker();

    // Listener for due reminder custom event
    const handleDueReminder = (e: Event) => {
      const customEvt = e as CustomEvent<Reminder>;
      if (customEvt.detail) {
        setActiveReminderToast(customEvt.detail);
      }
    };

    window.addEventListener('constructfield-reminder-due', handleDueReminder);
    window.addEventListener('constructos-reminder-due', handleDueReminder);

    // Initial check & 15s interval check loop
    checkDueReminders(reminders);
    const interval = setInterval(() => {
      checkDueReminders(reminders);
    }, 15000);

    return () => {
      window.removeEventListener('constructfield-reminder-due', handleDueReminder);
      window.removeEventListener('constructos-reminder-due', handleDueReminder);
      clearInterval(interval);
    };
  }, [reminders]);

  // New Profile Form
  const [newProfileForm, setNewProfileForm] = useState<{
    name: string;
    role: UserRole;
    title: string;
    email: string;
    phone: string;
    company: string;
    department: string;
  }>({
    name: '',
    role: 'Engineer',
    title: '',
    email: '',
    phone: '',
    company: 'Acme Infrastructure',
    department: 'Civil Engineering'
  });

  const currentProject = projects[0];
  const blockedActivities = activities.filter(a => a.status === 'Blocked').length;

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Activities', path: '/activities', icon: ClipboardList, badge: blockedActivities > 0 ? blockedActivities : undefined, badgeColor: 'bg-red-500', section: 'activities' as any },
    { name: 'Allocations', path: '/allocations', icon: Layers, section: 'activities' as any },
    { name: 'Documents', path: '/documents', icon: FileText, section: 'documents' as any },
    { name: 'Employees', path: '/employees', icon: Users, section: 'labour' as any },
    { name: 'Equipment', path: '/equipment', icon: Truck, section: 'equipment' as any },
    { name: 'Accommodation', path: '/accommodation', icon: Home, section: 'labour' as any },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Reports', path: '/reports', icon: FileBarChart, section: 'reports' as any },
    { name: 'Materials', path: '/materials', icon: Package, section: 'materials' as any },
    { name: 'QC/QA', path: '/quality', icon: ShieldCheck, section: 'quality' as any },
    { name: 'Safety', path: '/safety', icon: ShieldAlert, section: 'safety' as any },
    { name: 'Reminders', path: '/reminders', icon: Bell, badge: reminders.filter(r => r.status !== 'Completed').length > 0 ? reminders.filter(r => r.status !== 'Completed').length : undefined, badgeColor: 'bg-orange-500' },
    { name: 'More', path: '/more', icon: Menu },
  ];

  const navGroups = [
    {
      groupTitle: 'Overview & Execution',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Activities', path: '/activities', icon: ClipboardList, badge: blockedActivities > 0 ? blockedActivities : undefined, badgeColor: 'bg-red-500', section: 'activities' as any },
        { name: 'Allocations', path: '/allocations', icon: Layers, section: 'activities' as any },
        { name: 'Projects', path: '/projects', icon: FolderKanban },
      ]
    },
    {
      groupTitle: 'Field Resources & Site',
      items: [
        { name: 'Employees', path: '/employees', icon: Users, section: 'labour' as any },
        { name: 'Equipment', path: '/equipment', icon: Truck, section: 'equipment' as any },
        { name: 'Accommodation', path: '/accommodation', icon: Home, section: 'labour' as any },
        { name: 'Materials', path: '/materials', icon: Package, section: 'materials' as any },
      ]
    },
    {
      groupTitle: 'Compliance & Quality',
      items: [
        { name: 'Reports', path: '/reports', icon: FileBarChart, section: 'reports' as any },
        { name: 'QC/QA', path: '/quality', icon: ShieldCheck, section: 'quality' as any },
        { name: 'Safety', path: '/safety', icon: ShieldAlert, section: 'safety' as any },
      ]
    },
    {
      groupTitle: 'Administration & Tools',
      items: [
        { name: 'Documents', path: '/documents', icon: FileText, section: 'documents' as any },
        { name: 'Reminders', path: '/reminders', icon: Bell, badge: reminders.filter(r => r.status !== 'Completed').length > 0 ? reminders.filter(r => r.status !== 'Completed').length : undefined, badgeColor: 'bg-orange-500' },
        { name: 'More', path: '/more', icon: Menu },
      ]
    }
  ];

  const navItems = allNavItems.filter(item => !item.section || hasPermission(item.section));

  const currentNav = allNavItems.find(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  }) || allNavItems[0];

  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileForm.name) return;

    const names = newProfileForm.name.trim().split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0].substring(0, 2).toUpperCase();

    const newProfile: UserProfile = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: newProfileForm.name,
      role: newProfileForm.role,
      title: newProfileForm.title || newProfileForm.role,
      email: newProfileForm.email || `${newProfileForm.name.toLowerCase().replace(/\s+/g, '.')}@scedih.io`,
      phone: newProfileForm.phone || '+61 400 000 000',
      company: newProfileForm.company,
      department: newProfileForm.department,
      initials,
      certifications: ['White Card']
    };

    addProfile(newProfile);
    setCurrentUserProfile(newProfile);
    setShowCreateProfileModal(false);
    setNewProfileForm({
      name: '',
      role: 'Engineer',
      title: '',
      email: '',
      phone: '',
      company: 'Acme Infrastructure',
      department: 'Civil Engineering'
    });
  };

  if (!isAuthenticated || currentUserProfile?.accessAllowed === false) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-[100dvh] h-screen flex-col bg-[#F5F7FA] dark:bg-slate-900 text-[#1A1C1E] dark:text-slate-50 overflow-hidden relative">
      
      {/* BURGER / SIDE MENU DRAWER */}
      {isSideMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSideMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="fixed top-0 left-0 bottom-0 w-80 max-w-[88vw] bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-300 text-slate-900 dark:text-slate-100">
            
            {/* Drawer Top Branding & Close */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0B5FFF] text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                  S
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Scedih</h2>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#0B5FFF] font-mono">v1.0</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                    {currentProject?.name || 'Solar & Civil Project'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSideMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Project Quick Card in Drawer */}
            {currentProject && (
              <div className="px-4 pt-3 shrink-0">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Site</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {currentProject.status || 'Active'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentProject.name}
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Progress</span>
                      <span className="text-[#0B5FFF] font-bold">{currentProject.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0B5FFF] rounded-full" style={{ width: `${currentProject.progress || 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drawer Navigation List */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter(item => !item.section || hasPermission(item.section));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.groupTitle} className="space-y-1">
                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group.groupTitle}
                    </div>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsSideMenuOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group",
                              isActive
                                ? "bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] dark:text-blue-400 shadow-2xs font-extrabold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center gap-3 min-w-0">
                                <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-[#0B5FFF]" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200")} />
                                <span className="truncate">{item.name}</span>
                              </div>
                              {item.badge !== undefined && (
                                <span className={cn("px-1.5 py-0.5 text-[10px] font-extrabold rounded-full text-white shadow-2xs", item.badgeColor)}>
                                  {item.badge > 9 ? '9+' : item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Drawer Bottom Profile & Quick Actions */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0 space-y-2">
              {currentUserProfile && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#0B5FFF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUserProfile.initials || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUserProfile.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUserProfile.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setShowProfileMenu(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Account Settings & Profile"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Active Service Worker Due Reminder Toast Banner */}
      {activeReminderToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-slate-900 border-2 border-orange-500 text-white rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/30 text-orange-300">
                    Reminder Due Now
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeReminderToast.dueTime || 'Today'}
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-white mt-1">
                  {activeReminderToast.title}
                </h4>
                {activeReminderToast.description && (
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {activeReminderToast.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveReminderToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-400" /> Triggered by Service Worker Listener
            </span>
            <button
              onClick={() => {
                setActiveReminderToast(null);
                navigate('/reminders');
              }}
              className="px-3 py-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              View Reminders
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-[64px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 z-20 relative">
        {/* Left Side: Burger Menu Toggle + Project Selector + Active Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Burger Menu Button */}
          <button 
            type="button"
            onClick={() => setIsSideMenuOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 shadow-2xs hover:border-[#0B5FFF]/50 hover:text-[#0B5FFF] group"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-200 group-hover:text-[#0B5FFF] transition-colors" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-[#0B5FFF] hidden sm:inline">
              Menu
            </span>
          </button>

          {/* Compact & Expandable Project Header */}
          <div className="relative shrink-0 z-30">
            <button 
              type="button"
              onClick={() => setIsProjectExpanded(!isProjectExpanded)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left group"
              title="Expand project info & specifications"
            >
              <div className="w-9 h-9 bg-[#0B5FFF] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
                {currentProject?.name?.charAt(0) || 'S'}
              </div>
              <div className="flex items-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 pr-1">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isProjectExpanded && "rotate-180")} />
              </div>
            </button>

            {/* Expanded Project Details Popover */}
            {isProjectExpanded && (
              <div className="absolute left-0 top-13 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#0B5FFF] rounded-md flex items-center justify-center text-white font-bold text-xs">
                      {currentProject?.name?.charAt(0) || 'S'}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Project</span>
                  </div>
                  <button 
                    onClick={() => setIsProjectExpanded(false)} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {currentProject?.name || 'Scedih Project'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {currentProject?.status || 'In Progress'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ID: {currentProject?.id || 'PRJ-001'}
                      </span>
                    </div>
                  </div>

                  {currentProject && (
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Client:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentProject.client || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Engineer:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentProject.engineer || 'N/A'}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex justify-between text-[11px] mb-1 font-bold">
                          <span>Overall Completion</span>
                          <span className="text-[#0B5FFF]">{currentProject.progress || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0B5FFF] rounded-full" style={{ width: `${currentProject.progress || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsProjectExpanded(false);
                        setShowProjectDetails(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FolderKanban className="h-4 w-4" />
                      Open Project Specifications
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Page Breadcrumb / Title Indicator */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <currentNav.icon className="w-4 h-4 text-[#0B5FFF]" />
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">{currentNav.name}</span>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-time Firebase Sync Status Indicator */}
          <SyncStatusIndicator />

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          {/* Expandable Weather Pill & Pop-Out Panel */}
          <div className="relative">
            <button
              onClick={() => setIsWeatherExpanded(!isWeatherExpanded)}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 transition-all cursor-pointer group shadow-2xs"
              title="Click to view live weather & safety impact"
            >
              <span className="text-xs font-bold text-[#0B5FFF] dark:text-blue-400">
                {latestWeather ? `${latestWeather.temperature}°C` : '32°C'}
              </span>
              <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)] group-hover:scale-110 transition-transform"></div>
              <ChevronDown className={cn("h-3 w-3 text-blue-500 transition-transform duration-200", isWeatherExpanded && "rotate-180")} />
            </button>

            {/* Weather Pop-Out Panel */}
            {isWeatherExpanded && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                      <CloudSun className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Site Weather Monitor</h4>
                      <p className="text-[10px] text-slate-500">Live conditions & safety status</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsWeatherExpanded(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Primary Temp & Condition Banner */}
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black leading-none">
                        {latestWeather ? `${latestWeather.temperature}°C` : '32°C'}
                      </div>
                      <div className="text-xs font-medium text-blue-100 mt-1">
                        {latestWeather ? latestWeather.condition : 'Sunny / Clear'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-yellow-300">
                      <Sun className="h-8 w-8" />
                    </div>
                  </div>

                  {/* Impact Rating */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Operational Impact:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold">
                      {latestWeather ? latestWeather.impactLevel : 'Normal Execution'}
                    </span>
                  </div>

                  {/* Environmental Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Wind className="h-4 w-4 text-teal-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Wind Speed</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {latestWeather ? `${latestWeather.windSpeed || 12} km/h` : '12 km/h NE'}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Humidity</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {latestWeather ? `${latestWeather.humidity || 45}%` : '45%'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Open Module CTA Button */}
                  <button
                    onClick={() => {
                      setIsWeatherExpanded(false);
                      navigate('/reports');
                    }}
                    className="w-full py-2 px-3 bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    Open Daily Weather & Safety Reports <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown Toggle */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left group"
              title="Expand user profile & account settings"
            >
              <div className="w-9 h-9 bg-[#0B5FFF] text-white rounded-full border border-white dark:border-slate-700 shadow-sm flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                {currentUserProfile?.initials || 'CU'}
              </div>
              <div className="flex items-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 pr-0.5">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", showProfileMenu && "rotate-180")} />
              </div>
            </button>

            {/* Profile Popover Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Profile</span>
                  <button onClick={() => setShowProfileMenu(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                </div>

                {/* Profile Details Card */}
                <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <div className="w-12 h-12 bg-[#0B5FFF] text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">
                    {currentUserProfile?.initials || 'JM'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{currentUserProfile?.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{currentUserProfile?.title}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0B5FFF]">
                      Role: {currentUserProfile?.role}
                    </span>
                  </div>
                </div>

                {/* Profile Switcher List */}
                {userProfiles && userProfiles.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Switch Whitelisted Account</span>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {userProfiles.map(prof => {
                        const isAllowed = prof.accessAllowed !== false;
                        const isSelected = prof.id === currentUserProfile?.id;

                        return (
                          <button
                            key={prof.id}
                            onClick={() => {
                              setCurrentUserProfile(prof);
                              setShowProfileMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border border-blue-200 dark:border-blue-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <div className="w-7 h-7 rounded-full bg-[#0B5FFF] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {prof.initials}
                              </div>
                              <div className="text-left min-w-0">
                                <div className="font-bold truncate text-[11px] leading-tight">
                                  {prof.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate font-mono">
                                  {prof.email}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {!isAllowed && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                  Blocked
                                </span>
                              )}
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {prof.role}
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#0B5FFF] ml-1" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Popover Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  {currentUserProfile?.role === 'Admin' && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowCreateProfileModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <UserPlus className="h-4 w-4 text-[#0B5FFF]" /> Create New Profile
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-xs font-bold text-white"
                  >
                    <SettingsIcon className="h-4 w-4" /> Account Settings
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out / Lock Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CREATE NEW PROFILE MODAL */}
      {showCreateProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#0B5FFF]" /> Create New User Profile
              </h3>
              <button onClick={() => setShowCreateProfileModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={newProfileForm.name}
                  onChange={e => setNewProfileForm({ ...newProfileForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role Authority *</label>
                  <select
                    value={newProfileForm.role}
                    onChange={e => setNewProfileForm({ ...newProfileForm, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  >
                    <option value="Admin">System Administrator</option>
                    <option value="Manager">Manager / Supervisor</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Inspector">QA/QC Inspector</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Project Manager"
                    value={newProfileForm.title}
                    onChange={e => setNewProfileForm({ ...newProfileForm, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="marcus.vance@constructfield.io"
                    value={newProfileForm.email}
                    onChange={e => setNewProfileForm({ ...newProfileForm, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
                  <input
                    type="text"
                    placeholder="Project Operations"
                    value={newProfileForm.department}
                    onChange={e => setNewProfileForm({ ...newProfileForm, department: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateProfileModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0B5FFF] text-white">Create & Activate Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYNC CONFLICT MODAL */}
      {syncConflict && (
        <SyncConflictModal
          conflict={syncConflict}
          onResolve={resolveSyncConflict}
          onClose={() => setSyncConflict(null)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F5F7FA] dark:bg-slate-900 relative">
        {showProjectDetails && currentProject ? (
          <div className="h-full w-full">
            <ProjectDetailScreen project={currentProject} onClose={() => setShowProjectDetails(false)} />
          </div>
        ) : (
          <>
            <div className="h-full flex flex-col md:flex-row w-full">
              <div className="flex-1 min-w-0">
                <ErrorBoundary key={location.pathname} moduleName="Module">
                  <Outlet />
                </ErrorBoundary>
              </div>
            </div>
            

          </>
        )}
      </main>
    </div>
  );
}
