import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FolderKanban, 
  FileBarChart, 
  Menu, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Package, 
  Users, 
  Truck, 
  Sun, 
  Moon, 
  UserPlus, 
  Settings as SettingsIcon, 
  Check, 
  X,
  UserCheck,
  Bell
} from 'lucide-react';
import { cn } from '../ui';
import { useAppContext } from '../../context/AppContext';
import { ProjectDetailScreen } from '../ProjectDetailScreen';
import { UserProfile, UserRole } from '../../types';

export function AppLayout() {
  const { 
    activities, 
    projects, 
    theme, 
    setTheme, 
    currentUserProfile, 
    setCurrentUserProfile, 
    userProfiles, 
    addProfile,
    reminders 
  } = useAppContext();

  const navigate = useNavigate();
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);

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

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Activities', path: '/activities', icon: ClipboardList, badge: blockedActivities > 0 ? blockedActivities : undefined, badgeColor: 'bg-red-500' },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Equipment', path: '/equipment', icon: Truck },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Materials', path: '/materials', icon: Package },
    { name: 'QC/QA', path: '/quality', icon: ShieldCheck },
    { name: 'Safety', path: '/safety', icon: ShieldAlert },
    { name: 'Reminders', path: '/reminders', icon: Bell, badge: reminders.filter(r => r.status !== 'Completed').length > 0 ? reminders.filter(r => r.status !== 'Completed').length : undefined, badgeColor: 'bg-orange-500' },
    { name: 'More', path: '/more', icon: Menu },
  ];

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
      email: newProfileForm.email || `${newProfileForm.name.toLowerCase().replace(/\s+/g, '.')}@constructos.io`,
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

  return (
    <div className="flex h-screen flex-col bg-[#F5F7FA] dark:bg-slate-900 text-[#1A1C1E] dark:text-slate-50 overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-[72px] bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0 z-20 relative">
        <div 
          className="flex items-center gap-3 md:gap-4 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowProjectDetails(true)}
        >
          <div className="w-10 h-10 bg-[#0B5FFF] rounded-lg flex items-center justify-center text-white font-bold text-xl">{currentProject?.name?.charAt(0) || 'C'}</div>
          <div className="hidden xl:block">
            <h1 className="text-lg font-bold leading-tight whitespace-nowrap">{currentProject?.name || 'ConstructOS Project'}</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{currentProject ? `${currentProject.status} • ${currentProject.id}` : 'Select or Create Project'}</p>
          </div>
        </div>
        
        {/* Top Navigation */}
        <nav className="flex-1 mx-4 flex items-center justify-center overflow-hidden">
          <div className="flex w-full justify-start lg:justify-center gap-6 md:gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 pt-4 pb-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1.5 group cursor-pointer transition-opacity min-w-[56px]",
                    isActive ? "opacity-100" : "opacity-50 hover:opacity-100"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn("relative w-12 h-8 flex items-center justify-center rounded-full transition-colors", isActive ? "bg-blue-100 dark:bg-blue-900/40" : "")}>
                      <item.icon className={cn("w-5 h-5", isActive ? "text-[#0B5FFF]" : "text-slate-900 dark:text-slate-50")} />
                      {item.badge !== undefined && (
                        <div className={cn("absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1.5 shadow-sm border-2 border-white dark:border-slate-900", item.badgeColor)}>
                          {item.badge > 9 ? '9+' : item.badge}
                        </div>
                      )}
                    </div>
                    <span className={cn("text-[11px] font-bold whitespace-nowrap", isActive ? "text-[#0B5FFF]" : "text-slate-600 dark:text-slate-400")}>
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="h-5 w-5 text-slate-700" /> : <Sun className="h-5 w-5 text-amber-400" />}
          </button>

          <div className="hidden lg:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
            <span className="text-sm font-medium text-[#0B5FFF]">32°C</span>
            <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
          </div>

          {/* User Profile Pill & Dropdown Toggle */}
          <div className="relative">
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 cursor-pointer p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold whitespace-nowrap text-slate-900 dark:text-white">{currentUserProfile?.name || 'Current User'}</p>
                <p className="text-[10px] text-gray-500 uppercase whitespace-nowrap font-semibold">{currentUserProfile?.title || 'Site Supervisor'}</p>
              </div>
              <div className="w-10 h-10 bg-[#0B5FFF] text-white rounded-full border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center font-bold text-sm shrink-0">
                {currentUserProfile?.initials || 'JM'}
              </div>
            </div>

            {/* Profile Popover Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-14 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 flex flex-col gap-4">
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
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Switch User Account</span>
                    {userProfiles.map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          setCurrentUserProfile(prof);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors ${
                          prof.id === currentUserProfile?.id ? 'bg-slate-100 dark:bg-slate-800 text-[#0B5FFF]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {prof.initials}
                          </div>
                          <span className="truncate">{prof.name} ({prof.role})</span>
                        </div>
                        {prof.id === currentUserProfile?.id && <Check className="h-4 w-4 text-[#0B5FFF]" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Popover Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowCreateProfileModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <UserPlus className="h-4 w-4 text-[#0B5FFF]" /> Create New Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-xs font-bold text-white"
                  >
                    <SettingsIcon className="h-4 w-4" /> Account Settings
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
                    placeholder="marcus.vance@constructos.io"
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
                <Outlet />
              </div>
            </div>
            

          </>
        )}
      </main>
    </div>
  );
}
